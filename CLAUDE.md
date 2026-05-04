# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Workspace is pnpm + Turborepo. Run from the repo root:

- `pnpm install` — install dependencies
- `pnpm turbo dev` — start the Next.js app on `http://localhost:3000` (auto-cleans `.next` first)
- `pnpm turbo build` — production build
- `pnpm turbo lint` — ESLint across all packages
- `pnpm turbo typecheck` — `tsc --noEmit` across all packages
- `pnpm turbo test` — Vitest in `packages/core` (no test files exist yet — `--passWithNoTests`)
- CI runs `pnpm turbo lint typecheck test build` on push/PR to `main`

Single-test workflow:

- `pnpm --filter @407-tolls/core test path/to/file.test.ts` — run one test file
- `pnpm --filter @407-tolls/core test:watch` — vitest watch mode

Per-package scripts (when you don't need turbo orchestration):

- `pnpm --filter @407-tolls/web dev` / `build` / `start` / `clean`
- `pnpm --filter @407-tolls/core build` / `typecheck`
- `pnpm --filter @407-tolls/scripts pipeline` — full data pipeline (fetch → geocode → assign-zones → validate)

## Environment

Trip planner needs a Google Maps Platform key in `packages/web/.env.local` with **Routes API** and **Places API (New)** enabled.

- `GOOGLE_MAPS_API_KEY` — fallback used by both the Routes and Places clients
- `GOOGLE_DIRECTIONS_API_KEY`, `GOOGLE_PLACES_API_KEY` — optional split for tighter restrictions

Without a key the app still loads. The toll engine works for interchange-pair pages; drive times in `lib/directions.ts` fall back to crude haversine estimates and address autocomplete is disabled.

## Architecture

Monorepo with two TypeScript packages plus a data-pipeline workspace.

```
packages/core   — pure TS toll engine, rates, zones, geo helpers, route comparison
packages/web    — Next.js 15 App Router frontend
scripts/        — one-off TS scripts that fetch and validate interchange/rate data
```

### `packages/core`

Pure TypeScript with Zod schemas. No React, no Next, no DOM. Re-exports from `src/index.ts`. Three layers worth understanding before touching pricing logic:

1. **Rates** (`src/rates/`): one file per vehicle class. Each contains a `rates` table keyed by `${dayType}:${direction}:${slot}:${zone}` — 12 zones × (8 weekday + 4 weekend) slots × 2 directions = 288 entries. `buildRateKey()` constructs the key; `getVehicleClass()` returns the class object.
2. **Zone distances** (`src/toll/compute-zone-distances.ts`): given an entry/exit km marker and direction, splits the trip into per-zone km segments using boundaries from `src/zones/`.
3. **Toll cache** (`src/toll/toll-cache.ts`): on first call for a given `RouteInput` (vehicle, entry/exit km, direction, transponder), computes all 12 time-slot breakdowns and caches them by `cacheKey`. Subsequent `calculateToll` calls for the same route are a Map lookup. The cache is module-level — long-lived in dev, fresh per cold start in production.

Higher-level orchestration:

- `src/compare/compare-routes.ts` — given an origin/destination as `LatLng`, finds the nearest on-ramps + off-ramps (`findNearestOnRamps`, bounded max-heap with equirectangular distance for the comparison pass and true haversine for the final k), enumerates ramp-pair candidates, fans out parallel `DirectionsProvider` calls, prices each via `calculateToll`, and returns sorted routes with a `bestSaving` summary.
- `src/compare/plan-trip.ts` — wraps `compareRoutes` with a no-toll baseline (a separate `NoTollDirectionsProvider`), dedupes by polyline, and assigns `cheapest` / `fastest` / `best_value` badges. Used by the trip-planner page.

`compareRoutes` is provider-injected: it does not import `fetch` or any Next-specific module. Real Google Routes calls live in `packages/web/src/lib/directions.ts`; tests can pass a stub.

### `packages/web`

Next.js 15 App Router with Tailwind v4 and MapLibre GL (not Google Maps for rendering). Routing:

- `/` — trip planner (address → ranked routes). Replaces the old interchange-pair home.
- `/trip/[route]` and `/commute/[route]` — original interchange-pair flows. Slugs are built/parsed via `src/lib/slugs.ts`.
- `/api/planner` — orchestrates `planTrip`. Used by the home page.
- `/api/compare`, `/api/toll`, `/api/commute` — older endpoints for the trip/commute pages.
- `/api/places/autocomplete`, `/api/places/details` — server proxies to Google Places (New), Canada-restricted (`includedRegionCodes: ["ca"]`). Required so the API key never reaches the browser.
- `/api/og/*` — dynamic OG image generation for shareable trip/commute links.

Key wiring:

- `src/lib/load-toll-points.ts` lazily caches `Map<id, Interchange>` and direction-bucketed `OnRamp[]` from the JSON in `src/data/`. Always go through these helpers — don't iterate `interchanges` directly in handlers.
- `src/lib/directions.ts` calls **Routes API v2** (`/directions/v2:computeRoutes`) with `routingPreference: "TRAFFIC_AWARE"` and `polylineEncoding: "ENCODED_POLYLINE"`. Departure time defaults to "now", so durations reflect current live traffic at request time. The legacy Directions API is no longer used.
- `src/lib/polyline.ts` decodes Google's encoded polyline to `[lng, lat]` pairs for MapLibre.
- `src/components/map/highway-map.tsx` is shared by both flows. It renders the static 407 polyline + interchange dots, *and* candidate route polylines for the planner. Polyline source/layer (`candidate-routes`) is fed via `routePolylines` + `selectedRouteId` props; click-on-line calls `onRouteSelect` to keep card state in sync. The same component handles the older entry/exit highlight logic via `entryId` / `exitId` / `selectedRoute`.
- `src/components/planner-app.tsx` owns the planner state (form values → `/api/planner` → result + selected route id) and threads coords down to `RouteCards` so each card can build a Google Maps Universal URL (`https://www.google.com/maps/dir/?api=1&...`) for the "Open in Google Maps" button.
- `src/components/client-app.tsx` is the older interchange-pair root — still used elsewhere if reintroduced.

State conventions to follow when extending the UI:

- Persist user preferences (vehicle class, transponder, last entry/exit) via `useLocalStorage`. Read existing keys (`407-vehicle-class`, `407-transponder`, `407-entry`, `407-exit`) before introducing new ones.
- Time-slot resolution lives inside the form components (see `route-form.tsx`'s `resolveCurrentSlot`). Reuse those constants/boundaries rather than redefining them.

### Data pipeline (`scripts/`)

One-off TypeScript scripts run with `tsx`. They produce the JSON files in `packages/web/src/data/` (`407-interchanges.json`, `407-gantries.json`, `407-highway-geometry.json`). Re-run only when 407 ETR rates / interchanges change (typically each January). Outputs are committed to the repo.

## Conventions

- Currency: store as integer cents throughout; format via `formatDollars` (`src/lib/format.ts`).
- IDs: interchange `id` is a string; routes are slugged via `src/lib/slugs.ts`.
- Distances: kilometers (number), generally rounded to one decimal at boundaries.
- Always validate API request bodies with the Zod schemas exported from `@407-tolls/core` (e.g. `CompareInputSchema`); use `z.prettifyError` for 400 responses.
- ESLint configs in each package use `tsconfigRootDir` for the monorepo — when adding new files, check the package's `eslint.config.mjs` if you hit unexpected rule scoping.

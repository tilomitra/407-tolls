# 407 Tolls — POC v0.5 Implementation Plan

## Goal

Add a `/plan` feature to the forked 407-tolls repo. Given an origin, destination, departure time, and vehicle profile, return a ranked list of route options — including partial-407 variants — with toll cost, duration, and dollars-per-hour saved versus a no-toll baseline. Web only. No map view, no auth, no persistence, no shareable URLs. Those are v1.

The thesis being tested: GTA drivers will value seeing "exit one interchange earlier and save $4 for one extra minute." If they don't, the iOS app isn't worth building.

## Pre-work (do this first; do not skip)

Before writing any new code, the agent must understand the existing toll engine and data model. Concretely:

1. Read `packages/core/src/index.ts` (or its actual entry point) and all related type definitions and Zod schemas.
2. Read the interchange data file(s) — typically under `packages/core/src/data/` or similar. Capture: what fields exist per interchange, how interchanges are referenced (ID? name? slug?), what coordinate format is used.
3. Read the toll calculation function signature. Note exactly what inputs it takes — particularly how vehicle class, time slot, and transponder/camera distinction are passed.
4. Read the existing Next.js app structure under `packages/web` to understand routing conventions, Tailwind setup, and how the home page already calls `packages/core`.
5. Write findings to `docs/poc-v05/engine-summary.md` — a one-page reference covering the toll engine API surface and the interchange data shape. This file will be referenced throughout implementation.

**If anything is ambiguous after this pre-work, stop and report. Do not guess at the toll engine API.**

## Architecture

```
User → /plan page (React)
        ↓ POST /api/plan
      Next.js route handler
        ↓
      planTrip(input)
        ├─ generateCandidates(origin, dest) → up to 16 (entry, exit) interchange pairs
        ├─ for each candidate + 1 baseline (avoid tolls):
        │     getRoute() → Google Directions API → {duration, distance, polyline}
        ├─ for each route:
        │     packages/core toll engine → toll cost
        ├─ compute $/hr saved vs baseline
        ├─ drop dominated options
        └─ return RouteOption[]
```

All new code lives in `packages/web`. The toll engine in `packages/core` is consumed as a library; it is not modified.

## Implementation steps

### Step 1: Planner library (no UI)

Create `packages/web/lib/planner/` with these modules:

- **`interchanges.ts`** — `findNearestInterchanges(latLng: LatLng, k = 4): Interchange[]`. Uses great-circle distance against the interchange list imported from `packages/core`.
- **`candidates.ts`** — `generateCandidates(origin: LatLng, destination: LatLng): InterchangePair[]`. Algorithm:
  1. Get K=4 nearest interchanges to origin and to destination.
  2. Form Cartesian product → up to 16 pairs.
  3. Filter directionally: project both interchanges onto the origin→destination vector. Drop pairs where the exit's projection is less than 5km past the entry's projection along the corridor (i.e., where the route would double back).
- **`directions.ts`** — Google Directions API wrapper. `getRoute({ origin, destination, waypoints?, departureTime, avoidTolls? })` returns `{ polyline, durationSeconds, distanceMeters }`. Reads `GOOGLE_DIRECTIONS_API_KEY` from env. All requests use `mode=driving`, `region=ca`, and pass `departure_time` for traffic-aware durations.
- **`plan.ts`** — main orchestrator `planTrip(input): Promise<{ options: RouteOption[] }>`:
  1. `candidates = generateCandidates(...)`.
  2. Fire `getRoute()` in parallel for each candidate (with entry and exit lat/lons as waypoints) and one baseline call with `avoidTolls: true`.
  3. For each successful route, call the core toll engine with `(entry, exit, departureTime, vehicleClass, hasTransponder)` to get the toll cost. Baseline is $0.
  4. Compute `dollarsPerHourSaved = (option.cost - baseline.cost) / (baseline.durationH - option.durationH)`. Set to `null` if the option is slower than baseline.
  5. Drop dominated options: any option that is both slower AND more expensive than another option.
  6. Sort by duration ascending. Return.

**Acceptance for Step 1:** a script `packages/web/scripts/test-planner.ts` that runs `planTrip()` with hardcoded coords (Square One Mississauga → Markville Mall Markham, Tuesday 8am) and prints the result table to stdout. Run with `pnpm tsx packages/web/scripts/test-planner.ts`.

### Step 2: API route

Create `packages/web/app/api/plan/route.ts`:
- POST handler
- Zod-validates the request body using a schema co-located in `packages/web/lib/planner/schema.ts`
- Calls `planTrip()`, returns JSON
- On Directions API failures: return partial results with a non-empty `errors: string[]` field rather than 500-ing. The page should still be useful even if 2 of 16 candidate routes failed.

### Step 3: Frontend page

Create `packages/web/app/plan/page.tsx`. This is a client component (uses Google Places autocomplete which needs `window`).

UI elements:
- Origin input — Google Places Autocomplete, `componentRestrictions: { country: 'ca' }`, types `['address']`.
- Destination input — same.
- Departure time — `<input type="datetime-local">`, defaults to now, helper text "Tolls vary by time of day."
- Vehicle class — dropdown matching the core engine's enum exactly (per pre-work findings).
- Transponder toggle — default on. Helper: "Camera-charged accounts pay extra fees per trip."
- "Find routes" button.

Results section:
- Loading skeleton while waiting.
- Error banner if the API call fails entirely.
- Results table with columns: **Route** (e.g., "Via 407 — Hwy 410 to Hwy 404"), **Time**, **Distance**, **Toll**, **$/hr saved**, **Verdict**.
- The verdict column shows badges: "Cheapest", "Fastest", "Best value" (highest $/hr-saved among non-baseline options where the option is faster than baseline). One badge per option max.
- The no-407 baseline row is always shown first as a reference. Toll = $0.

Use the repo's existing Tailwind tokens and component patterns. Do not introduce a new UI library. Match the visual style of the existing home page.

### Step 4: Manual verification

After implementation works end-to-end, run these three trips through `/plan` and verify the toll on at least one returned option matches 407etr.com's official calculator within **$0.10**:

| # | From | To | Time | Vehicle | Transponder |
|---|---|---|---|---|---|
| 1 | Square One, Mississauga | Markville Mall, Markham | Tue 8:00 am | Light | Yes |
| 2 | Mapleview Mall, Burlington | Pickering Town Centre, Pickering | Sat 2:00 pm | Light | No |
| 3 | Oakville Place | Vaughan Mills | Wed 5:00 pm | Medium | Yes |

If any test fails, do not proceed — debug the toll engine call (most likely cause: wrong vehicle class enum, wrong time slot calculation, or interchange mismatch).

## Out of scope (do NOT build)

- Map view of the recommended route
- Shareable URLs and OG previews
- User accounts, saved trips, history
- Analytics
- iOS/mobile-specific responsive treatment beyond Tailwind defaults
- Server-side caching of Directions results
- Rate limiting on `/api/plan`
- E2E tests beyond the Step 4 manual verification

These belong to v1 (after the wedge is validated).

## Environment

Update `.env.example`:

```
GOOGLE_DIRECTIONS_API_KEY=
GOOGLE_PLACES_API_KEY=
```

Both keys can be the same Google Cloud project. Required APIs to enable: Directions API, Places API (New), Maps JavaScript API. Update `README.md` with a "Run /plan locally" subsection covering env setup.

## Cost note for the agent

A single `/plan` call fires up to 17 Directions requests (16 candidates + 1 baseline). At Google's $5/1k Directions pricing with the $200/month free credit, that's roughly 2,300 free sessions per month — comfortable for a POC. No caching needed yet.

## Definition of done

- `pnpm dev` runs the web app cleanly.
- `/plan` renders, both autocompletes work, form submits.
- For a typical GTA trip, results return within ~3 seconds and contain the no-407 baseline plus 2–6 toll options.
- All three Step 4 manual test trips pass within $0.10 of 407etr.com.
- `pnpm tsc --noEmit` passes across the workspace.
- `pnpm lint` passes.
- One commit per step (1–3) with conventional commit messages: `feat(planner): ...`, `feat(api): ...`, `feat(web): ...`.
- `README.md` updated.
- Pre-work artifact `docs/poc-v05/engine-summary.md` committed.

## When to stop and ask

Stop and surface a question rather than guessing if:
- The toll engine's public API surface is unclear or undocumented.
- The interchange data uses a coordinate system or ID scheme that's not self-evident.
- A vehicle class in the core engine doesn't have an obvious mapping to a user-facing label.
- Directions API returns consistently zero routes for valid GTA addresses (likely a key/scope issue).
- Toll calculations are off by more than a dollar from 407etr.com (likely a time-slot or zone-lookup bug).
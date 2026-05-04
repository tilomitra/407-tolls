# 407 Tolls

Toll calculator and trip planner for Highway 407 ETR. Single trips, daily commutes, all five vehicle classes.

Open source and open to contributions.

**Live:** [407tolls.com](https://www.407tolls.com)

## What it does

- **Trip planner:** type any two addresses and get ranked routes — no-407 baseline, full-407, and partial-407 alternatives, each with toll, drive time, and distance
- Calculate toll for any interchange pair, any time slot
- Estimate daily/weekly/monthly/yearly commute costs with holiday-aware scheduling
- Compare nearby interchanges to find cheaper on-ramps
- Support for motorcycle, light, medium, heavy single, and heavy multi vehicles
- One-way and round trip commute options
- Shareable links with OG previews

## How it works

Rates come from the official 407 ETR rate charts. Distances and zone boundaries are sourced from the 407 ETR toll calculator API. Tolls are calculated using per-zone rates across 12 time slots, both directions, for all vehicle classes.

## Stack

- **Core:** TypeScript toll calculation with Zod schemas, cached breakdowns
- **Web:** Next.js 15 App Router, Tailwind CSS, MapLibre GL
- **Data:** 41 interchanges, 12 zones, 288 rates per vehicle class
- **Deploy:** Vercel

## Run locally

```bash
pnpm install
cp .env.example .env.local   # set GOOGLE_MAPS_API_KEY
pnpm turbo dev
```

Open [localhost:3000](http://localhost:3000).

The trip planner needs a Google Maps Platform key with **Directions API** and **Places API (New)** enabled. Without a key the toll engine still works for interchange pairs (drive times fall back to crude haversine estimates and address autocomplete is disabled). For tighter key restrictions, set `GOOGLE_DIRECTIONS_API_KEY` and `GOOGLE_PLACES_API_KEY` separately — they both fall back to `GOOGLE_MAPS_API_KEY` when unset.

## Project structure

```
packages/core    Toll calculation, rates, zones
packages/web     Next.js frontend
scripts/         Data pipeline (fetch interchanges, distances, gantries)
```

## Contributing

This project is open source. Bug reports, rate corrections, and feature PRs are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Disclaimer

Not affiliated with 407 ETR. Estimates based on published 2026 rates. Actual charges may vary.

# 407 ETR Toll Calculator

Estimate toll costs for Highway 407 ETR. Single trips, daily commutes, all five vehicle classes.

**Live:** [407-etr-web.vercel.app](https://407-etr-web.vercel.app)

## What it does

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
pnpm turbo dev
```

Open [localhost:3000](http://localhost:3000).

## Project structure

```
packages/core    Toll calculation, rates, zones
packages/web     Next.js frontend
scripts/         Data pipeline (fetch interchanges, distances, gantries)
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Disclaimer

Not affiliated with 407 ETR. Estimates based on published 2026 rates. Actual charges may vary.

# Contributing

Thanks for your interest in contributing.

## Getting started

```bash
pnpm install
pnpm turbo dev
```

The app runs at `http://localhost:3000`.

## Project structure

- `packages/core` — toll calculation engine, rates, zone data
- `packages/web` — Next.js frontend
- `scripts/` — data pipeline for fetching interchange and rate data from the 407 ETR API

## Rate data

Rates live in `packages/core/src/rates/vehicles/`. Each vehicle class has its own file with 288 rate entries (12 zones × 12 time slots × 2 directions). Rates come from the [407 ETR Rates](https://www.407etr.com/en/rates) and are updated each January.

Zone boundaries in `packages/core/src/zones/zone-boundaries.ts` are derived from the 407 ETR toll calculator API.

## What we need help with

- Rate verification against actual 407 ETR bills
- Distance corrections from real trip data
- Bug reports with screenshots or bill comparisons
- Accessibility improvements

## Submitting changes

1. Fork the repo
2. Create a branch
3. Make your changes
4. Open a PR with a clear description of what changed and why

Keep PRs focused. One fix or feature per PR.

## Reporting issues

Open a [GitHub issue](https://github.com/legacy/407-etr/issues). If you're reporting a toll discrepancy, include:

- Entry and exit interchanges
- Vehicle class
- Time of day
- What 407 ETR charged vs what we calculated

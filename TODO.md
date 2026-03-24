# Roadmap

## Done

- Time-of-day chart with cheapest slot highlighted
- Schedule shift savings (visible in time-of-day chart)
- Commute estimator (monthly/yearly, holiday-aware)
- Annual cost summary (per month, per year, transponder savings in commute breakdown)
- Shareable links with OG metadata for trips and commutes
- Transponder toggle with per-class charges
- Vehicle classes (motorcycle, light, medium, heavy single, heavy multi)
- One-way trips in commute estimator
- Nearby interchange comparison with savings
- Searchable interchange picker
- Interactive map with zones, gantries, and route highlighting
- Swap entry/exit
- PWA support (manifest, add to home screen)
- Auto-calculate on input change (debounced)
- Clickable map interchanges (entry/exit selection)
- Clickable nearby suggestions (homepage and shared commute page)
- Client-side toll calculation (no API calls from homepage)
- URL params for pre-filling form from shared pages (?entry=&exit=&mode=)

## Next up

### Recent routes history

Save recently viewed routes to localStorage so users can quickly
re-check past lookups without re-entering interchanges.

### Trip A vs Trip B comparison

Side-by-side comparison of two different routes. Pick route A
and route B, see price, distance, and zones compared.

### 407 vs 401

Toll + time on the 407 vs free but slower 401. Cost per minute saved.
Needs a directions API for drive times.

### Bill verifier

Paste your 407 bill details, we recalculate and flag discrepancies.
Manual entry first (interchange, date, time). OCR later.

### Carpool split

Split the toll 2-4 ways. Per-person cost for trips and commutes.

## Later

### Rate change impact

When new rates drop in January, show how your saved commute changes.

### Community distance corrections

Users submit bill data (entry, exit, billed distance) to crowdsource
more accurate distances.

### Natural language search

"QEW to Weston at 7am?" parsed into a toll lookup.

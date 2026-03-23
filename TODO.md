# Roadmap

## Done

- Time-of-day chart with cheapest slot highlighted
- Commute estimator (monthly/yearly, holiday-aware)
- Shareable links with OG metadata for trips and commutes
- Transponder toggle with per-class charges
- Vehicle classes (motorcycle, light, medium, heavy single, heavy multi)
- One-way trips in commute estimator
- Nearby interchange comparison with savings
- Searchable interchange picker
- Interactive map with zones, gantries, and route highlighting
- Swap entry/exit

## Next up

### Schedule shift savings

Show what adjacent time slots cost so people with flexible schedules
can see if leaving 10 minutes earlier actually saves anything.
The time-of-day chart already computes every slot — just surface the delta.

### 407 vs 401

Toll + time on the 407 vs free but slower 401. Cost per minute saved.
Needs Google Directions API. Comparison endpoint exists at `/api/compare`.

### Bill verifier

Paste your 407 bill details, we recalculate and flag any discrepancies.
Start with manual entry (interchange, date, time). OCR later.

### Annual cost summary

Big-picture view of what the 407 costs you per year. Yearly total,
cost per km, transponder savings. Shareable card format.

### Carpool split

Split the toll 2–4 ways. Per-person cost for trips and commutes.

## Later

### Rate change impact

When new rates drop in January, show how your saved commute is affected.
Diff current vs previous rate tables.

### Cost comparisons

Put yearly toll in perspective — equivalent tanks of gas, flights, etc.

### Community distance corrections

Users submit bill data (entry, exit, billed distance) to crowdsource
more accurate distances.

### Natural language search

"QEW to Weston at 7am?" parsed into a toll lookup.

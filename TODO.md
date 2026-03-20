# Roadmap

## Done

- Time-of-day cost chart
- Monthly/yearly commute estimator with holiday-aware scheduling
- Shareable trip and commute links with OG tags
- Transponder toggle on shared pages

## In progress

- UI/UX polish (mobile responsiveness, searchable interchange picker)

## Next up

### Nearby interchange comparison (commute)

"Enter at Goreway instead of Highway 410, save $80/month for 2 extra minutes."
Show 2-3 nearby on-ramp alternatives with monthly cost and time tradeoffs.
Biggest differentiator. No other tool does this.

### Schedule shift savings (commute)

"Leave 10 minutes earlier (before 7am) and save $X/day = $Y/month."
Show the cost of adjacent time slots so commuters with flexible schedules
can see if a small shift saves real money.

### 407 vs 401 comparison

Compare 407 toll + travel time against the 401 (free, slower).
Show cost per minute saved. Needs Google Directions API for drive times.

### Bill verifier

Upload or paste a 407 ETR bill. We recalculate and flag discrepancies.
"Your bill says $12.97, we calculate $12.97, matches."
Could use OCR (photo upload) or manual entry.

### One-way trip support

Some users only take the 407 one direction (e.g. morning only,
return via 401). The commute estimator assumes round trips.

## Later

### Rate change impact

When new rates drop each January, show how saved commutes are affected.
"Your daily commute goes up $0.42 this year."

### Community distance corrections

Let users submit actual bill data (entry, exit, billed distance).
Once enough submissions agree, calibrate our distances.
Crowdsourced accuracy without needing proprietary gantry data.

### Natural language search

"How much is Goreway to Weston at 7am?" parsed into a toll lookup.
Could use an LLM or simple keyword extraction.

### Bill photo verification

Take a photo of a 407 ETR bill, OCR extracts trip details,
we compare against our calculation and flag overcharges.

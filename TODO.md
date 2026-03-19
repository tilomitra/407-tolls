# Roadmap

## Savings comparison
Show 2-3 alternate on-ramp options with cost and time tradeoffs. "Enter at Pine Valley instead of Jane St, save $4.20 for 2 extra minutes." Core differentiator — no other tool does this.

## Time-of-day cost chart
Bar chart showing what the same trip costs at each time slot. Helps drivers decide whether to leave at 3 PM vs 6 PM.

## Monthly commute estimator
Input your commute (entry, exit, time, days per week) and get a projected monthly 407 bill. Useful for budgeting and deciding whether a transponder is worth it.

## 407 vs 401 comparison
Compare the 407 toll cost + travel time against taking the 401 (free, slower). Show cost per minute saved. Requires Google Directions API.

## Bill verifier
Paste details from a real 407 ETR bill. We recalculate and flag discrepancies between the billed amount and our estimate.

## Shareable trip links
Generate a URL like `/trip/goreway-to-weston?time=7am` that shows the full breakdown. Useful for carpoolers splitting costs or sharing with someone planning a trip.

## Rate change impact
When new rates are published each year, show how your saved commute cost changes. "Your daily commute goes up $0.42 in February."

## Community-sourced distance corrections
Let users submit their actual 407 ETR bill data (entry, exit, billed distance, billed amount). Once enough submissions for a route reach consensus, auto-correct our distance estimates for that segment. Crowdsourced accuracy that improves over time without needing proprietary gantry data.

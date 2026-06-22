import type { LatLng, OnRamp, RampWithDistance } from "../types";
import { haversineKm } from "./haversine";
import { findNearestOnRamps } from "./nearest-ramps";

/**
 * Rank ramps by their position along the highway (km marker) so we can reason
 * about "interchange distance" — how many interchanges apart two ramps are —
 * instead of raw kilometers. Adjacent 407 interchanges sit anywhere from ~0.7
 * to ~6 km apart, so a fixed km threshold is a poor proxy for "one interchange
 * over". The returned map is keyed by ramp id → ordinal index (west = 0).
 */
export function buildRampOrder(ramps: readonly OnRamp[]): Map<string, number> {
  const order = new Map<string, number>();
  [...ramps]
    .sort((a, b) => a.km - b.km)
    .forEach((ramp, i) => order.set(ramp.id, i));
  return order;
}

/**
 * How many interchanges apart two ramps are, or `Infinity` if either id is
 * unknown to the order map (e.g. the no-407 baseline, which has no ramps).
 */
export function interchangeGap({
  order,
  aId,
  bId,
}: {
  order: Map<string, number>;
  aId: string | null | undefined;
  bId: string | null | undefined;
}): number {
  if (aId == null || bId == null) return Infinity;
  const a = order.get(aId);
  const b = order.get(bId);
  if (a === undefined || b === undefined) return Infinity;
  return Math.abs(a - b);
}

/**
 * Pick ramp candidates that are spread out *along the trip*, not clustered
 * around a single point. The old approach (k-nearest to a point) returned a
 * tight run of adjacent interchanges, so every suggested route was really just
 * "get on one interchange earlier/later" — not a meaningfully different choice.
 *
 * Here we anchor on the ramp nearest `anchor` (the origin for entries, the
 * destination for exits) and walk *toward* `far` (the opposite end of the trip),
 * keeping the anchor plus ramps that are at least `minInterchangeGap`
 * interchanges apart from everything already chosen. The result is a handful of
 * genuinely distinct places to get on/off the highway: enter early and ride
 * longer, or stay on surface streets and enter later for a shorter toll.
 *
 * Candidates are returned anchor-first (closest detour first), each carrying its
 * true haversine distance to `anchor`.
 */
export function selectSpreadRamps({
  anchor,
  far,
  ramps,
  count,
  minInterchangeGap = 2,
}: {
  anchor: LatLng;
  far: LatLng;
  ramps: readonly OnRamp[];
  count: number;
  minInterchangeGap?: number;
}): RampWithDistance[] {
  if (count <= 0 || ramps.length === 0) return [];

  const order = buildRampOrder(ramps);
  const anchorRamp = findNearestOnRamps({ origin: anchor, ramps, count: 1 })[0];
  const farRamp = findNearestOnRamps({ origin: far, ramps, count: 1 })[0];
  if (!anchorRamp) return [];

  const anchorIdx = order.get(anchorRamp.id)!;
  const farIdx = farRamp ? order.get(farRamp.id)! : anchorIdx;

  // The corridor is the span of interchanges between the two trip ends. Restrict
  // candidates to it so we never suggest backtracking away from the destination.
  const lo = Math.min(anchorIdx, farIdx);
  const hi = Math.max(anchorIdx, farIdx);

  // Order corridor ramps by how far they sit from the anchor end, so the natural
  // (nearest) entry/exit comes first and detours grow from there.
  const corridor = ramps
    .filter((r) => {
      const idx = order.get(r.id)!;
      return idx >= lo && idx <= hi;
    })
    .sort((a, b) => {
      const da = Math.abs(order.get(a.id)! - anchorIdx);
      const db = Math.abs(order.get(b.id)! - anchorIdx);
      return da - db;
    });

  const picked: OnRamp[] = [];
  for (const ramp of corridor) {
    if (picked.length >= count) break;
    const idx = order.get(ramp.id)!;
    const farEnough = picked.every(
      (p) => Math.abs(order.get(p.id)! - idx) >= minInterchangeGap,
    );
    if (farEnough) picked.push(ramp);
  }

  // Degenerate trip (origin and destination map to the same interchange): still
  // offer the anchor so the pair builder has something to work with.
  if (picked.length === 0) picked.push(anchorRamp);

  return picked.map((ramp) => ({
    ...ramp,
    distanceKm: haversineKm({ a: anchor, b: ramp.location }),
  }));
}

import type {
  CompareInput,
  DirectionsProvider,
  NoTollDirectionsProvider,
  OnRamp,
  PlannerResult,
  RankedRoute,
  RouteBadge,
  RouteOption,
} from "../types";
import { compareRoutes } from "./compare-routes";
import { buildRampOrder, interchangeGap } from "../geo";

export interface PlanTripArgs {
  input: CompareInput;
  onRamps: readonly OnRamp[];
  offRamps: readonly OnRamp[];
  getDirections: DirectionsProvider;
  getNoTollDirections: NoTollDirectionsProvider;
}

// Two 407 routes are only "different enough" to show side by side when they use
// meaningfully different ramps. Entering (or exiting) one interchange over is not
// a distinct choice for a driver, so we require the entry OR the exit to differ
// by at least this many interchanges. The no-407 baseline is always distinct.
const MIN_INTERCHANGE_GAP = 2;

/**
 * Plan a trip end-to-end: build the no-toll baseline and the 407 candidates,
 * then rank them with badges (cheapest, fastest, best_value).
 *
 * "kind" classification:
 *   - no_407: the avoid=tolls baseline
 *   - full_407: a 407 candidate that spans the entire highway
 *   - partial_407: any other 407 candidate
 */
export async function planTrip({
  input,
  onRamps,
  offRamps,
  getDirections,
  getNoTollDirections,
}: PlanTripArgs): Promise<PlannerResult> {
  const [compare, noToll] = await Promise.all([
    compareRoutes({ input, onRamps, offRamps, getDirections }),
    getNoTollDirections({ origin: input.origin, destination: input.destination }),
  ]);

  // Position-along-highway lookups so we can measure how many interchanges apart
  // two routes' entry (or exit) ramps are.
  const entryOrder = buildRampOrder(onRamps);
  const exitOrder = buildRampOrder(offRamps);

  const noTollRoute: RouteOption = {
    kind: "no_407",
    onRamp: null,
    offRamp: null,
    toll: null,
    driveToOnRampMinutes: 0,
    highwayTimeMinutes: 0,
    driveFromOffRampMinutes: noToll.durationMinutes,
    driveTimeMinutes: noToll.durationMinutes,
    staticDurationMinutes: noToll.staticDurationMinutes,
    distanceKm: noToll.distanceKm,
    polyline: noToll.polyline,
  };

  const candidates: RouteOption[] = [noTollRoute, ...compare.routes];

  // Dedupe by polyline string to avoid showing identical paths
  const seen = new Set<string>();
  const unique = candidates.filter((r) => {
    if (seen.has(r.polyline)) return false;
    seen.add(r.polyline);
    return true;
  });

  // Sort: cheapest toll first, then by drive time as tie-breaker
  unique.sort((a, b) => {
    const tollA = a.toll?.totalCents ?? 0;
    const tollB = b.toll?.totalCents ?? 0;
    if (tollA !== tollB) return tollA - tollB;
    return a.driveTimeMinutes - b.driveTimeMinutes;
  });

  // Find cheapest (min toll cents; no-toll route is $0 so typically wins)
  let cheapestIdx = 0;
  let fastestIdx = 0;
  for (let i = 0; i < unique.length; i++) {
    const r = unique[i]!;
    if ((r.toll?.totalCents ?? 0) < (unique[cheapestIdx]!.toll?.totalCents ?? 0)) cheapestIdx = i;
    if (r.driveTimeMinutes < unique[fastestIdx]!.driveTimeMinutes) fastestIdx = i;
  }

  // Optimal score: minutes-saved-per-dollar over the no-toll baseline
  const baselineMinutes = noTollRoute.driveTimeMinutes;
  const optimalScore = (r: RouteOption): number => {
    if (r.kind === "no_407") return -1;
    const tollDollars = (r.toll?.totalCents ?? 0) / 100;
    if (tollDollars <= 0) return -1;
    const minutesSaved = baselineMinutes - r.driveTimeMinutes;
    if (minutesSaved <= 0) return -1;
    return minutesSaved / tollDollars;
  };

  // Candidate indices sorted by value score, descending (only positive scores).
  const byValueDesc = unique
    .map((r, i) => ({ i, score: optimalScore(r) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.i);

  // Diversity check: two routes are "different enough" to occupy separate slots
  // when they get on/off the highway at meaningfully different interchanges —
  // entry OR exit at least MIN_INTERCHANGE_GAP interchanges apart. This keeps the
  // suggestions spatially distinct instead of "the same trip, one ramp over". The
  // no-407 baseline (null ramps) is always distinct from any 407 route.
  const isDifferentEnough = (aIdx: number, bIdx: number): boolean => {
    const a = unique[aIdx]!;
    const b = unique[bIdx]!;
    if (a.kind === "no_407" || b.kind === "no_407") return true;
    const entryGap = interchangeGap({ order: entryOrder, aId: a.onRamp?.id, bId: b.onRamp?.id });
    const exitGap = interchangeGap({ order: exitOrder, aId: a.offRamp?.id, bId: b.offRamp?.id });
    return entryGap >= MIN_INTERCHANGE_GAP || exitGap >= MIN_INTERCHANGE_GAP;
  };

  // Build slots. Each slot is a distinct route; if a route qualifies for
  // multiple badges (e.g. fastest is also best value), badges are merged on
  // the same slot and another diverse route is picked for the freed slot.
  const slots: Array<{ idx: number; badges: RouteBadge[] }> = [];

  const addSlot = (idx: number, badge: RouteBadge): void => {
    const existing = slots.find((s) => s.idx === idx);
    if (existing) {
      if (!existing.badges.includes(badge)) existing.badges.push(badge);
    } else {
      slots.push({ idx, badges: [badge] });
    }
  };

  addSlot(fastestIdx, "fastest");
  addSlot(cheapestIdx, "cheapest");

  // Pick the next route for `badge` from `candidates`, preferring one that is
  // not already in a slot AND is diverse from every existing slot. Falls back
  // to "not already in a slot" if no diverse candidate exists.
  const pickDiverseSlot = (badge: RouteBadge, candidates: readonly number[]): void => {
    const used = new Set(slots.map((s) => s.idx));

    for (const idx of candidates) {
      if (used.has(idx)) continue;
      if (slots.every((s) => isDifferentEnough(idx, s.idx))) {
        addSlot(idx, badge);
        return;
      }
    }
    // Fallback: any unused candidate, even if similar.
    for (const idx of candidates) {
      if (used.has(idx)) continue;
      addSlot(idx, badge);
      return;
    }
    // No remaining candidates — merge badge onto the highest-scoring slot
    // that already exists (so the badge is still surfaced somewhere).
    if (candidates.length > 0) addSlot(candidates[0]!, badge);
  };

  pickDiverseSlot("best_value", byValueDesc);
  pickDiverseSlot("second_best_value", byValueDesc);

  const ranked: RankedRoute[] = slots.map(({ idx, badges }, slotNum) => ({
    ...unique[idx]!,
    id: `slot${slotNum}-${routeId(unique[idx]!, idx)}`,
    badges,
  }));

  // Every deduped candidate, so the client can compute things like a
  // "best route under $X budget" picker without re-fetching directions.
  const allRoutes = unique.map((r, i) => ({
    ...r,
    id: `cand${i}-${routeId(r, i)}`,
  }));

  return { routes: ranked, allRoutes };
}

function routeId(r: RouteOption, i: number): string {
  if (r.kind === "no_407") return "no-407";
  return `${r.kind}-${r.onRamp?.id ?? "?"}-${r.offRamp?.id ?? "?"}-${i}`;
}

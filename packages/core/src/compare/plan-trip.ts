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

export interface PlanTripArgs {
  input: CompareInput;
  onRamps: readonly OnRamp[];
  offRamps: readonly OnRamp[];
  getDirections: DirectionsProvider;
  getNoTollDirections: NoTollDirectionsProvider;
}

// Two routes are considered meaningfully different if cost differs by at least
// MIN_COST_DIFF_CENTS OR drive time differs by at least MIN_TIME_DIFF_MIN. Both
// thresholds together mean: routes that are within ~$0.50 AND within ~2 min are
// treated as duplicates and won't both be shown.
const MIN_COST_DIFF_CENTS = 50;
const MIN_TIME_DIFF_MIN = 2;

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

  // Diversity check: two routes are "different enough" if either cost or time
  // differs by more than the threshold. This prevents the value slots from
  // landing on routes that look identical to the fastest/cheapest picks.
  const isDifferentEnough = (aIdx: number, bIdx: number): boolean => {
    const a = unique[aIdx]!;
    const b = unique[bIdx]!;
    const costDiff = Math.abs((a.toll?.totalCents ?? 0) - (b.toll?.totalCents ?? 0));
    const timeDiff = Math.abs(a.driveTimeMinutes - b.driveTimeMinutes);
    return costDiff >= MIN_COST_DIFF_CENTS || timeDiff >= MIN_TIME_DIFF_MIN;
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

  return { routes: ranked };
}

function routeId(r: RouteOption, i: number): string {
  if (r.kind === "no_407") return "no-407";
  return `${r.kind}-${r.onRamp?.id ?? "?"}-${r.offRamp?.id ?? "?"}-${i}`;
}

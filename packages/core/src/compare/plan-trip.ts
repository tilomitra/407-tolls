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

  let bestValueIdx = -1;
  let bestValueScore = 0;
  let secondBestValueIdx = -1;
  let secondBestValueScore = 0;
  for (let i = 0; i < unique.length; i++) {
    const score = optimalScore(unique[i]!);
    if (score > bestValueScore) {
      secondBestValueScore = bestValueScore;
      secondBestValueIdx = bestValueIdx;
      bestValueScore = score;
      bestValueIdx = i;
    } else if (score > secondBestValueScore) {
      secondBestValueScore = score;
      secondBestValueIdx = i;
    }
  }

  // Build 4 independent slots: fastest, cheapest, most optimal, 2nd most optimal.
  // Each slot gets its own card and badge. A route may appear in multiple slots
  // (e.g. the fastest route is also the most optimal) — both cards are shown so
  // the "Most Optimal" slot is always present when a valid score exists.
  const slots: Array<{ idx: number; badge: RouteBadge }> = [
    { idx: fastestIdx, badge: "fastest" },
    { idx: cheapestIdx, badge: "cheapest" },
    ...(bestValueIdx >= 0 ? [{ idx: bestValueIdx, badge: "best_value" as RouteBadge }] : []),
    ...(secondBestValueIdx >= 0 ? [{ idx: secondBestValueIdx, badge: "second_best_value" as RouteBadge }] : []),
  ];

  const ranked: RankedRoute[] = slots.map(({ idx, badge }, slotNum) => ({
    ...unique[idx]!,
    id: `slot${slotNum}-${routeId(unique[idx]!, idx)}`,
    badges: [badge],
  }));

  return { routes: ranked };
}

function routeId(r: RouteOption, i: number): string {
  if (r.kind === "no_407") return "no-407";
  return `${r.kind}-${r.onRamp?.id ?? "?"}-${r.offRamp?.id ?? "?"}-${i}`;
}

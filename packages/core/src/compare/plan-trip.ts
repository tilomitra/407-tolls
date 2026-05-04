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

  // Compute badges
  let cheapestIdx = 0;
  let fastestIdx = 0;
  for (let i = 0; i < unique.length; i++) {
    const r = unique[i]!;
    if ((r.toll?.totalCents ?? 0) < (unique[cheapestIdx]!.toll?.totalCents ?? 0)) {
      cheapestIdx = i;
    }
    if (r.driveTimeMinutes < unique[fastestIdx]!.driveTimeMinutes) {
      fastestIdx = i;
    }
  }

  // Best value: max minutes-saved-per-dollar over the no-toll baseline
  const baselineMinutes = noTollRoute.driveTimeMinutes;
  let bestValueIdx = -1;
  let bestValueScore = 0;
  for (let i = 0; i < unique.length; i++) {
    const r = unique[i]!;
    if (r.kind === "no_407") continue;
    const tollDollars = (r.toll?.totalCents ?? 0) / 100;
    if (tollDollars <= 0) continue;
    const minutesSaved = baselineMinutes - r.driveTimeMinutes;
    if (minutesSaved <= 0) continue;
    const score = minutesSaved / tollDollars;
    if (score > bestValueScore) {
      bestValueScore = score;
      bestValueIdx = i;
    }
  }

  const ranked: RankedRoute[] = unique.map((r, i) => {
    const badges: RouteBadge[] = [];
    if (i === cheapestIdx) badges.push("cheapest");
    if (i === fastestIdx) badges.push("fastest");
    if (i === bestValueIdx && i !== cheapestIdx && i !== fastestIdx) {
      badges.push("best_value");
    }
    return {
      ...r,
      id: routeId(r, i),
      badges,
    };
  });

  return { routes: ranked };
}

function routeId(r: RouteOption, i: number): string {
  if (r.kind === "no_407") return "no-407";
  return `${r.kind}-${r.onRamp?.id ?? "?"}-${r.offRamp?.id ?? "?"}-${i}`;
}

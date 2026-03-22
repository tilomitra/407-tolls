import type {
  Interchange,
  Direction,
  CommuteSchedule,
  NearbyAlternative,
  NearbyComparison,
  CommuteEstimate,
  RouteInput,
} from "../types";
import { computeCommuteEstimate } from "./commute-estimate";

function findAdjacentInterchanges({
  anchor,
  sorted,
  indexById,
  direction,
  role,
  maxResults = 2,
}: {
  anchor: Interchange;
  sorted: readonly Interchange[];
  indexById: Map<string, number>;
  direction: Direction;
  role: "entry" | "exit";
  maxResults?: number;
}): Interchange[] {
  const anchorIdx = indexById.get(anchor.id);
  if (anchorIdx === undefined) return [];

  // Two pointers expanding outward from the anchor, nearest first.
  const candidates: Interchange[] = [];
  let left = anchorIdx - 1;
  let right = anchorIdx + 1;

  while (candidates.length < maxResults && (left >= 0 || right < sorted.length)) {
    const leftIc = left >= 0 ? sorted[left] : null;
    const rightIc = right < sorted.length ? sorted[right] : null;
    const leftDist = leftIc ? Math.abs(leftIc.km - anchor.km) : Infinity;
    const rightDist = rightIc ? Math.abs(rightIc.km - anchor.km) : Infinity;

    if (leftDist <= rightDist) {
      left--;
    } else {
      right++;
    }
    const next = leftDist <= rightDist ? leftIc : rightIc;

    if (!next || next.isFree) continue;

    const ramps = direction === "eastbound" ? next.eastbound : next.westbound;
    const hasAccess = role === "entry" ? ramps.hasOnRamp : ramps.hasOffRamp;
    if (!hasAccess) continue;

    candidates.push(next);
  }

  return candidates;
}

function buildAlternativeRoute({
  originalRoute,
  interchange,
  role,
}: {
  originalRoute: RouteInput;
  interchange: Interchange;
  role: "entry" | "exit";
}): RouteInput {
  // Swap in the alternate interchange for the role being tested, keep the other end unchanged.
  const entryKm = role === "entry" ? interchange.km : originalRoute.entryKm;
  const exitKm = role === "exit" ? interchange.km : originalRoute.exitKm;
  const entryZone = role === "entry" ? interchange.zone : originalRoute.entryZone;
  const exitZone = role === "exit" ? interchange.zone : originalRoute.exitZone;
  const direction: Direction = exitKm > entryKm ? "eastbound" : "westbound";

  return {
    vehicleClassId: originalRoute.vehicleClassId,
    entryKm,
    exitKm,
    entryZone,
    exitZone,
    direction,
    hasTransponder: originalRoute.hasTransponder,
  };
}

export function computeNearbyComparison({
  entryInterchange,
  exitInterchange,
  interchanges,
  route,
  estimate,
  schedule,
}: {
  entryInterchange: Interchange;
  exitInterchange: Interchange;
  interchanges: readonly Interchange[];
  route: RouteInput;
  estimate: CommuteEstimate;
  schedule: CommuteSchedule;
}): NearbyComparison {
  const sorted = [...interchanges].sort((a, b) => a.km - b.km);
  const indexById = new Map(sorted.map((ic, i) => [ic.id, i]));
  const originalDistanceKm = Math.abs(route.exitKm - route.entryKm);

  // "entry" = find nearby on-ramps to replace the entry, keep the exit fixed.
  // "exit" = find nearby off-ramps to replace the exit, keep the entry fixed.
  const roles = [
    { anchor: entryInterchange, role: "entry" as const },
    { anchor: exitInterchange, role: "exit" as const },
  ];

  const alternatives: NearbyAlternative[] = [];

  for (const { anchor, role } of roles) {
    const adjacent = findAdjacentInterchanges({
      anchor,
      sorted,
      indexById,
      direction: route.direction,
      role,
    });

    for (const ic of adjacent) {
      if (ic.id === entryInterchange.id || ic.id === exitInterchange.id) continue;

      const altRoute = buildAlternativeRoute({ originalRoute: route, interchange: ic, role });
      if (altRoute.direction !== route.direction) continue;

      const altEstimate = computeCommuteEstimate({ route: altRoute, ...schedule });
      const deltaMonthCents = altEstimate.perMonthCents - estimate.perMonthCents;
      if (deltaMonthCents >= 0) continue;

      alternatives.push({
        role,
        interchange: ic,
        estimate: altEstimate,
        deltaMonthCents,
        deltaDistanceKm: Math.abs(altRoute.exitKm - altRoute.entryKm) - originalDistanceKm,
      });
    }
  }

  alternatives.sort((a, b) => a.deltaMonthCents - b.deltaMonthCents);

  return { alternatives };
}

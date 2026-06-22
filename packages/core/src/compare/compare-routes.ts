import type { CompareResult, CompareRoutesArgs, Direction, RouteOption } from "../types";
import { inferDirection, selectSpreadRamps } from "../geo";
import { calculateToll } from "../toll";

export async function compareRoutes({
  input,
  onRamps,
  offRamps,
  getDirections,
}: CompareRoutesArgs): Promise<CompareResult> {
  const { origin, destination, timeSlot, hasTransponder, maxRamps = 4 } = input;

  // Candidate entries are spread along the trip starting from the on-ramp nearest
  // the origin; candidate exits are spread back from the off-ramp nearest the
  // destination. This surfaces genuinely different places to get on/off the 407
  // (enter early and ride longer vs. stay on surface streets and enter later)
  // rather than a cluster of adjacent interchanges.
  const entryRamps = selectSpreadRamps({
    anchor: origin,
    far: destination,
    ramps: onRamps,
    count: maxRamps,
  });
  const exitRamps = selectSpreadRamps({
    anchor: destination,
    far: origin,
    ramps: offRamps,
    count: maxRamps,
  });

  // Trip direction from the actual origin → destination. Along the 407, km
  // markers increase eastward, so a valid entry/exit pair must have the exit
  // ahead of the entry in the direction of travel.
  const tripDirection = inferDirection({
    entryLng: origin.lng,
    exitLng: destination.lng,
  });
  const isExitAhead = (entryKm: number, exitKm: number): boolean =>
    tripDirection === "eastbound" ? exitKm > entryKm : exitKm < entryKm;

  // Build candidate pairs, compute tolls (cheap, sync), and fire directions calls in parallel
  const candidates: Array<{
    onRamp: (typeof entryRamps)[number];
    offRamp: (typeof exitRamps)[number];
    direction: Direction;
    isDefault: boolean;
  }> = [];

  for (const onRamp of entryRamps) {
    for (const offRamp of exitRamps) {
      if (onRamp.id === offRamp.id) continue;
      // Skip pairs that would run backwards (exit behind the entry).
      if (!isExitAhead(onRamp.km, offRamp.km)) continue;

      candidates.push({
        onRamp,
        offRamp,
        direction: inferDirection({
          entryLng: onRamp.location.lng,
          exitLng: offRamp.location.lng,
        }),
        isDefault: onRamp.id === entryRamps[0]?.id && offRamp.id === exitRamps[0]?.id,
      });
    }
  }

  // Degenerate trips (origin and destination map to the same interchange, or no
  // forward-ordered pair exists) yield no 407 option. Bail out cleanly rather
  // than dereferencing an empty routes array.
  if (candidates.length === 0) {
    return { routes: [], defaultRoute: null, bestSaving: null };
  }

  // Parallel directions API calls instead of sequential awaits
  const directionsResults = await Promise.all(
    candidates.map((c) =>
      getDirections({ origin, onRamp: c.onRamp, offRamp: c.offRamp, destination }),
    ),
  );

  let defaultRoute: RouteOption | undefined;
  const routes: RouteOption[] = new Array(candidates.length);

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]!;
    const dirs = directionsResults[i]!;

    const toll = calculateToll({
      vehicleClassId: input.vehicleClassId,
      entryZone: c.onRamp.zone,
      exitZone: c.offRamp.zone,
      entryKm: c.onRamp.km,
      exitKm: c.offRamp.km,
      direction: c.direction,
      timeSlot,
      hasTransponder,
    });

    const isFull = c.onRamp.zone === 1 && c.offRamp.zone === 12
      || c.onRamp.zone === 12 && c.offRamp.zone === 1;
    const route: RouteOption = {
      kind: isFull ? "full_407" : "partial_407",
      onRamp: c.onRamp,
      offRamp: c.offRamp,
      toll,
      driveToOnRampMinutes: dirs.toOnRampMinutes,
      highwayTimeMinutes: dirs.highwayMinutes,
      driveFromOffRampMinutes: dirs.fromOffRampMinutes,
      driveTimeMinutes: dirs.toOnRampMinutes + dirs.highwayMinutes + dirs.fromOffRampMinutes,
      staticDurationMinutes: dirs.staticDurationMinutes,
      distanceKm: dirs.totalDistanceKm,
      polyline: dirs.polyline,
    };

    routes[i] = route;
    if (c.isDefault) defaultRoute = route;
  }

  routes.sort((a, b) => (a.toll?.totalCents ?? 0) - (b.toll?.totalCents ?? 0));

  if (!defaultRoute) defaultRoute = routes[0]!;
  const cheapest = routes[0]!;

  const cheapestToll = cheapest.toll?.totalCents ?? 0;
  const defaultToll = defaultRoute.toll?.totalCents ?? 0;
  const bestSaving =
    cheapest.onRamp && cheapest.offRamp && defaultRoute.onRamp && cheapestToll < defaultToll
      ? {
          savingsCents: defaultToll - cheapestToll,
          extraMinutes: Math.round(cheapest.driveTimeMinutes - defaultRoute.driveTimeMinutes),
          alternateOnRamp: cheapest.onRamp.name,
          alternateOffRamp: cheapest.offRamp!.name,
          description: `Enter at ${cheapest.onRamp.name} instead of ${defaultRoute.onRamp.name}`,
        }
      : null;

  return { routes, defaultRoute, bestSaving };
}

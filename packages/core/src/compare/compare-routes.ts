import type {
  CompareResult,
  CompareRoutesArgs,
  Direction,
  RouteOption,
} from "../types";
import { findNearestOnRamps, inferDirection } from "../geo";
import { calculateToll } from "../toll";

export async function compareRoutes({
  input,
  onRamps,
  offRamps,
  getDirections,
}: CompareRoutesArgs): Promise<CompareResult> {
  const { origin, destination, timeSlot, hasTransponder, maxRamps = 3 } = input;

  const nearestOnRamps = findNearestOnRamps({ origin, ramps: onRamps, count: maxRamps });
  const nearestOffRamps = findNearestOnRamps({ origin: destination, ramps: offRamps, count: maxRamps });

  // Build candidate pairs, compute tolls (cheap, sync), and fire directions calls in parallel
  const candidates: Array<{
    onRamp: (typeof nearestOnRamps)[number];
    offRamp: (typeof nearestOffRamps)[number];
    direction: Direction;
    isDefault: boolean;
  }> = [];

  for (const onRamp of nearestOnRamps) {
    for (const offRamp of nearestOffRamps) {
      if (onRamp.id === offRamp.id) continue;

      candidates.push({
        onRamp,
        offRamp,
        direction: inferDirection({
          entryLng: onRamp.location.lng,
          exitLng: offRamp.location.lng,
        }),
        isDefault:
          onRamp.id === nearestOnRamps[0]?.id &&
          offRamp.id === nearestOffRamps[0]?.id,
      });
    }
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
      entryZone: c.onRamp.zone,
      exitZone: c.offRamp.zone,
      entryKm: c.onRamp.km,
      exitKm: c.offRamp.km,
      direction: c.direction,
      timeSlot,
      hasTransponder,
    });

    const route: RouteOption = {
      onRamp: c.onRamp,
      offRamp: c.offRamp,
      toll,
      driveToOnRampMinutes: dirs.toOnRampMinutes,
      highwayTimeMinutes: dirs.highwayMinutes,
      driveFromOffRampMinutes: dirs.fromOffRampMinutes,
      driveTimeMinutes:
        dirs.toOnRampMinutes + dirs.highwayMinutes + dirs.fromOffRampMinutes,
    };

    routes[i] = route;
    if (c.isDefault) defaultRoute = route;
  }

  routes.sort((a, b) => a.toll.totalCents - b.toll.totalCents);

  if (!defaultRoute) defaultRoute = routes[0]!;
  const cheapest = routes[0]!;

  const bestSaving =
    cheapest.toll.totalCents < defaultRoute.toll.totalCents
      ? {
          savingsCents: defaultRoute.toll.totalCents - cheapest.toll.totalCents,
          extraMinutes: Math.round(
            cheapest.driveTimeMinutes - defaultRoute.driveTimeMinutes,
          ),
          alternateOnRamp: cheapest.onRamp.name,
          alternateOffRamp: cheapest.offRamp.name,
          description: `Enter at ${cheapest.onRamp.name} instead of ${defaultRoute.onRamp.name}`,
        }
      : null;

  return { routes, defaultRoute, bestSaving };
}

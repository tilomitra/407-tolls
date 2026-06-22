import type { Interchange, OnRamp, Direction, LatLng, RouteResult, VehicleClassId } from "@407-tolls/core";
import { inferTripDirection } from "@407-tolls/core";
import { interchanges as rawInterchanges } from "@/data";

let cachedInterchangeMap: Map<string, Interchange> | null = null;
let cachedOnRamps: Record<Direction, OnRamp[]> | null = null;
let cachedAllRamps: OnRamp[] | null = null;

export function getInterchangeById(id: string): Interchange | undefined {
  if (!cachedInterchangeMap) {
    cachedInterchangeMap = new Map(
      rawInterchanges.map((ic) => [ic.id, ic]),
    );
  }
  return cachedInterchangeMap.get(id);
}

function buildOnRampsByDirection(): Record<Direction, OnRamp[]> {
  const eb: OnRamp[] = [];
  const wb: OnRamp[] = [];

  for (const ic of rawInterchanges) {
    if (ic.isFree) continue;
    const ramp: OnRamp = {
      id: ic.id,
      name: ic.name,
      km: ic.km,
      location: ic.location,
      zone: ic.zone,
      isFree: ic.isFree,
    };
    if (ic.eastbound.hasOnRamp) eb.push(ramp);
    if (ic.westbound.hasOnRamp) wb.push(ramp);
  }

  return { eastbound: eb, westbound: wb };
}

export function getOnRampsForDirection({
  direction,
}: {
  direction: Direction;
}): OnRamp[] {
  if (!cachedOnRamps) cachedOnRamps = buildOnRampsByDirection();
  return cachedOnRamps[direction];
}

// Direction-agnostic ramp list (one entry per tolled interchange) used only to
// project trip endpoints onto the highway when deciding travel direction.
function getAllRamps(): OnRamp[] {
  if (cachedAllRamps) return cachedAllRamps;
  cachedAllRamps = rawInterchanges
    .filter((ic) => !ic.isFree)
    .map((ic) => ({
      id: ic.id,
      name: ic.name,
      km: ic.km,
      location: ic.location,
      zone: ic.zone,
      isFree: ic.isFree,
    }));
  return cachedAllRamps;
}

/**
 * Resolve the 407 travel direction for a trip and return the matching on-ramp
 * set. Direction is decided by projecting both endpoints onto the corridor (km
 * of the nearest interchange), so destinations off to the side of the highway
 * (e.g. Niagara Falls via the QEW) get the right direction instead of being
 * mis-read from raw longitude.
 */
export function getTripRamps({
  origin,
  destination,
}: {
  origin: LatLng;
  destination: LatLng;
}): { direction: Direction; onRamps: OnRamp[] } {
  const direction = inferTripDirection({ origin, destination, ramps: getAllRamps() });
  return { direction, onRamps: getOnRampsForDirection({ direction }) };
}

export function buildRouteInput({
  entryId,
  exitId,
  vehicleClassId,
  hasTransponder,
}: {
  entryId: string;
  exitId: string;
  vehicleClassId: VehicleClassId;
  hasTransponder: boolean;
}): RouteResult {
  const entry = getInterchangeById(entryId);
  const exit = getInterchangeById(exitId);

  if (!entry || !exit) {
    return { ok: false, error: "Invalid interchange ID" };
  }

  if (entryId === exitId) {
    return { ok: false, error: "Entry and exit must be different interchanges." };
  }

  const direction: Direction = exit.km > entry.km ? "eastbound" : "westbound";
  const ramps = direction === "eastbound" ? { entry: entry.eastbound, exit: exit.eastbound } : { entry: entry.westbound, exit: exit.westbound };

  if (!ramps.entry.hasOnRamp) {
    return { ok: false, error: entry.note ?? `${entry.name} does not have a ${direction} on-ramp.` };
  }

  if (!ramps.exit.hasOffRamp) {
    return { ok: false, error: exit.note ?? `${exit.name} does not have a ${direction} off-ramp.` };
  }

  return {
    ok: true,
    route: {
      vehicleClassId,
      entryZone: entry.zone,
      exitZone: exit.zone,
      entryKm: entry.km,
      exitKm: exit.km,
      direction,
      hasTransponder,
    },
    entry,
    exit,
  };
}

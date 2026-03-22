import type {
  VehicleClass,
  DayType,
  Direction,
  WeekdaySlot,
  WeekendSlot,
  Zone,
  ResolvedTimeSlot,
  RouteInput,
  TollBreakdown,
  ZoneTollDetail,
} from "../types";
import { WEEKDAY_SLOTS, WEEKEND_SLOTS } from "../types";
import { getVehicleClass, buildRateKey } from "../rates";
import { computeZoneDistances } from "./compute-zone-distances";

const cache = new Map<string, TollBreakdown[]>();

function cacheKey(input: RouteInput): string {
  return `${input.vehicleClassId}:${input.entryKm}:${input.exitKm}:${input.direction}:${
    input.hasTransponder ? 1 : 0
  }`;
}

function buildBreakdown({
  vehicleClass,
  zones,
  direction,
  dayType,
  slot,
  hasTransponder,
}: {
  vehicleClass: VehicleClass;
  zones: Array<{ zone: Zone; distanceKm: number }>;
  direction: Direction;
  dayType: DayType;
  slot: WeekdaySlot | WeekendSlot;
  hasTransponder: boolean;
}): TollBreakdown {
  const perZone: ZoneTollDetail[] = new Array(zones.length);
  let tollCents = 0;

  for (let i = 0; i < zones.length; i++) {
    const { zone, distanceKm } = zones[i]!;
    const key = buildRateKey({ dayType, direction, slot, zone });
    const rateCentsPerKm = vehicleClass.rates[key];

    if (rateCentsPerKm === undefined) {
      throw new Error(`Unknown rate key: ${key}`);
    }

    const costCents = Math.round(rateCentsPerKm * distanceKm);
    tollCents += costCents;
    perZone[i] = { zone, distanceKm, rateCentsPerKm, costCents };
  }

  const appliedCameraCharge = hasTransponder ? 0 : vehicleClass.cameraChargeCents;

  return {
    totalCents: tollCents + vehicleClass.tripChargeCents + appliedCameraCharge,
    tollCents,
    tripChargeCents: vehicleClass.tripChargeCents,
    cameraChargeCents: appliedCameraCharge,
    perZone,
    direction,
    timeSlot: { dayType, slot },
  } as TollBreakdown;
}

export function getAllBreakdowns(input: RouteInput): TollBreakdown[] {
  const key = cacheKey(input);
  const cached = cache.get(key);
  if (cached) return cached;

  const vehicleClass = getVehicleClass({ id: input.vehicleClassId });
  const { direction, hasTransponder } = input;
  const zones = computeZoneDistances(input);
  const shared = { vehicleClass, zones, direction, hasTransponder };

  const breakdowns: TollBreakdown[] = new Array(WEEKDAY_SLOTS.length + WEEKEND_SLOTS.length);
  let idx = 0;

  for (const slot of WEEKDAY_SLOTS) {
    breakdowns[idx++] = buildBreakdown({ ...shared, dayType: "weekday", slot });
  }
  for (const slot of WEEKEND_SLOTS) {
    breakdowns[idx++] = buildBreakdown({ ...shared, dayType: "weekend_or_holiday", slot });
  }

  cache.set(key, breakdowns);
  return breakdowns;
}

export function findBreakdown(
  breakdowns: TollBreakdown[],
  timeSlot: ResolvedTimeSlot,
): TollBreakdown {
  const match = breakdowns.find(
    (b) => b.timeSlot.dayType === timeSlot.dayType && b.timeSlot.slot === timeSlot.slot,
  );
  if (!match) throw new Error(`No breakdown for ${timeSlot.dayType}:${timeSlot.slot}`);
  return match;
}

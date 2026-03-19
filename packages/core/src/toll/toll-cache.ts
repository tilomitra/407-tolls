import type { RateKey, ResolvedTimeSlot, RouteInput, TollBreakdown, ZoneTollDetail } from "../types";
import { WEEKDAY_SLOTS, WEEKEND_SLOTS } from "../types";
import { getRate, TRIP_CHARGE_CENTS, CAMERA_CHARGE_CENTS } from "../rates";
import { computeZoneDistances } from "./compute-zone-distances";

// Single cache for all toll computations. Keyed on route + transponder.
// Stores full breakdowns for all 12 time slots per route.
// ~6,400 possible route combinations × 12 slots × ~200 bytes ≈ 15MB max.
const cache = new Map<string, TollBreakdown[]>();

function cacheKey(input: RouteInput): string {
  return `${input.entryKm}:${input.exitKm}:${input.direction}:${input.hasTransponder ? 1 : 0}`;
}

function buildBreakdown(
  zones: Array<{ zone: number; distanceKm: number }>,
  direction: string,
  dayType: string,
  slot: string,
  hasTransponder: boolean,
): TollBreakdown {
  let tollCents = 0;
  const perZone: ZoneTollDetail[] = new Array(zones.length);

  for (let i = 0; i < zones.length; i++) {
    const { zone, distanceKm } = zones[i]!;
    const key = `${dayType}:${direction}:${slot}:${zone}` as RateKey;
    const rateCentsPerKm = getRate(key);
    const costCents = Math.round(rateCentsPerKm * distanceKm);
    tollCents += costCents;
    perZone[i] = { zone, distanceKm, rateCentsPerKm, costCents };
  }

  const cameraChargeCents = hasTransponder ? null : CAMERA_CHARGE_CENTS;

  return {
    totalCents: tollCents + TRIP_CHARGE_CENTS + (cameraChargeCents ?? 0),
    tollCents,
    tripChargeCents: TRIP_CHARGE_CENTS,
    cameraChargeCents,
    perZone,
    direction,
    timeSlot: { dayType, slot },
  } as TollBreakdown;
}

/**
 * Compute and cache full toll breakdowns for all 12 time slots.
 * Single source of truth. Both calculateToll and
 * computeAllTimeSlotCosts read from this cache.
 */
export function getAllBreakdowns(input: RouteInput): TollBreakdown[] {
  const key = cacheKey(input);
  const cached = cache.get(key);
  if (cached) return cached;

  const { direction, hasTransponder } = input;
  const zones = computeZoneDistances(input);

  const breakdowns: TollBreakdown[] = new Array(WEEKDAY_SLOTS.length + WEEKEND_SLOTS.length);
  let idx = 0;

  for (const slot of WEEKDAY_SLOTS) {
    breakdowns[idx++] = buildBreakdown(zones, direction, "weekday", slot, hasTransponder);
  }
  for (const slot of WEEKEND_SLOTS) {
    breakdowns[idx++] = buildBreakdown(zones, direction, "weekend_or_holiday", slot, hasTransponder);
  }

  cache.set(key, breakdowns);
  return breakdowns;
}

export function findBreakdown(breakdowns: TollBreakdown[], timeSlot: ResolvedTimeSlot): TollBreakdown {
  const match = breakdowns.find(
    (b) => b.timeSlot.dayType === timeSlot.dayType && b.timeSlot.slot === timeSlot.slot,
  );
  if (!match) throw new Error(`No breakdown for ${timeSlot.dayType}:${timeSlot.slot}`);
  return match;
}

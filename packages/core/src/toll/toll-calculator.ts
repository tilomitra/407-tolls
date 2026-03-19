import type {
  RateKey,
  TollBreakdown,
  TollInput,
  Zone,
  ZoneTollDetail,
} from "../types";
import { getRate, TRIP_CHARGE_CENTS, CAMERA_CHARGE_CENTS } from "../rates";
import { getZoneDistanceKm, getDistanceInZone } from "./zone-distances";

export function calculateToll(input: TollInput): TollBreakdown {
  const { entryZone, exitZone, entryKm, exitKm, direction, timeSlot, hasTransponder } = input;

  const start = Math.min(entryZone, exitZone);
  const end = Math.max(entryZone, exitZone);
  const startKm = Math.min(entryKm, exitKm);
  const endKm = Math.max(entryKm, exitKm);
  const zoneCount = end - start + 1;

  let tollCents = 0;
  const perZone: ZoneTollDetail[] = new Array(zoneCount);

  for (let i = 0; i < zoneCount; i++) {
    const zone = (start + i) as Zone;
    const key = `${timeSlot.dayType}:${direction}:${timeSlot.slot}:${zone}` as RateKey;
    const rateCentsPerKm = getRate(key);

    let distanceKm: number;

    if (zoneCount === 1) {
      distanceKm = getDistanceInZone({ zone, fromKm: startKm, toKm: endKm });
    } else if (zone === start) {
      distanceKm = getDistanceInZone({ zone, fromKm: startKm, toKm: "end" });
    } else if (zone === end) {
      distanceKm = getDistanceInZone({ zone, fromKm: "start", toKm: endKm });
    } else {
      distanceKm = getZoneDistanceKm(zone);
    }

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
    timeSlot,
  };
}

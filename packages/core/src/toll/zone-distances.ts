import type { Zone } from "../types";
import { ZONE_BOUNDARIES, EASTERN_TERMINUS_KM } from "../zones";

// Pre-compute zone lengths and boundary km markers.
// Uses exit numbers (= road km from western terminus) for exact distances.
const ZONE_LENGTHS: number[] = new Array(13).fill(0);
const ZONE_START_KM: number[] = new Array(13).fill(0);
const ZONE_END_KM: number[] = new Array(13).fill(0);

for (let i = 0; i < ZONE_BOUNDARIES.length; i++) {
  const boundary = ZONE_BOUNDARIES[i]!;
  const nextKm = ZONE_BOUNDARIES[i + 1]?.startKm ?? EASTERN_TERMINUS_KM;
  ZONE_LENGTHS[boundary.zone] = nextKm - boundary.startKm;
  ZONE_START_KM[boundary.zone] = boundary.startKm;
  ZONE_END_KM[boundary.zone] = nextKm;
}

export function getZoneDistanceKm(zone: Zone): number {
  return ZONE_LENGTHS[zone]!;
}

export function getZoneStartKm(zone: Zone): number {
  return ZONE_START_KM[zone]!;
}

export function getZoneEndKm(zone: Zone): number {
  return ZONE_END_KM[zone]!;
}

/**
 * Calculate the actual road distance traveled within a zone given entry/exit km markers.
 * For the entry zone: from the on-ramp km to the zone's eastern boundary.
 * For the exit zone: from the zone's western boundary to the off-ramp km.
 * For same-zone trips: absolute difference between on-ramp and off-ramp km.
 */
export function getDistanceInZone({
  zone,
  fromKm,
  toKm,
}: {
  zone: Zone;
  fromKm: number | "start";
  toKm: number | "end";
}): number {
  const start = fromKm === "start" ? ZONE_START_KM[zone]! : fromKm;
  const end = toKm === "end" ? ZONE_END_KM[zone]! : toKm;
  return Math.abs(end - start);
}

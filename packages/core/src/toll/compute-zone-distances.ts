import type { Zone } from "../types";
import { getZoneDistanceKm, getDistanceInZone } from "./zone-distances";

/**
 * Compute the actual distance traveled in each zone for a trip.
 *
 * Entry and exit zones are partial — the driver doesn't traverse the full zone.
 *
 * Example: Dixie Rd (km 48, zone 6) → Dufferin St (km 73, zone 8)
 *   Zone 6 spans km 46–58. Driver enters at 48 → only 10 km in zone 6.
 *   Zone 7 spans km 58–66. Full traversal      → 8 km in zone 7.
 *   Zone 8 spans km 66–77. Driver exits at 73  → only 7 km in zone 8.
 *   Total: 25 km (not 12+8+11=31 if we used full zone lengths).
 *
 * Distances are derived from exit numbers (approximate km markers), not actual
 * road measurements. The 407 ETR's gantry-to-gantry distances are proprietary.
 * Community-submitted trip data could calibrate these to within ~100m.
 */
export function computeZoneDistances({
  entryZone,
  exitZone,
  entryKm,
  exitKm,
}: {
  entryZone: Zone;
  exitZone: Zone;
  entryKm: number;
  exitKm: number;
}): Array<{ zone: Zone; distanceKm: number }> {
  // Normalize to west→east order so the logic works for both EB and WB trips
  const westZone = Math.min(entryZone, exitZone);
  const eastZone = Math.max(entryZone, exitZone);
  const westKm = Math.min(entryKm, exitKm);
  const eastKm = Math.max(entryKm, exitKm);
  const zoneCount = eastZone - westZone + 1;

  const result: Array<{ zone: Zone; distanceKm: number }> = [];

  for (let i = 0; i < zoneCount; i++) {
    const zone = (westZone + i) as Zone;
    let distanceKm: number;

    if (zoneCount === 1) {
      // Same zone — distance between the two interchanges
      distanceKm = getDistanceInZone({ zone, fromKm: westKm, toKm: eastKm });
    } else if (i === 0) {
      // Entry zone — from on-ramp to the eastern edge of this zone
      distanceKm = getDistanceInZone({ zone, fromKm: westKm, toKm: "end" });
    } else if (i === zoneCount - 1) {
      // Exit zone — from the western edge of this zone to the off-ramp
      distanceKm = getDistanceInZone({ zone, fromKm: "start", toKm: eastKm });
    } else {
      // Middle zone — fully traversed
      distanceKm = getZoneDistanceKm(zone);
    }

    if (distanceKm > 0) {
      result.push({ zone, distanceKm });
    }
  }

  return result;
}

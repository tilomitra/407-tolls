import type { Zone } from "../types";
import { ZONE_BOUNDARIES } from "./zone-boundaries";

// Pre-extract sorted km values for binary search
const BOUNDARY_KMS: number[] = ZONE_BOUNDARIES.map((b) => b.startKm);

/**
 * Given a km position on the 407, return the zone.
 * Binary search on zone boundary km values.
 */
export function getZoneByKm(km: number): Zone {
  if (km <= BOUNDARY_KMS[0]!) return 1;

  let result = 0;
  let lo = 0;
  let hi = BOUNDARY_KMS.length - 1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (BOUNDARY_KMS[mid]! <= km) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return ZONE_BOUNDARIES[result]!.zone;
}

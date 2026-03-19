import type { Zone } from "../types";
import { ZONE_BOUNDARIES } from "./zone-boundaries";

// Pre-extract sorted longitudes for binary search.
// ZONE_BOUNDARIES is ordered west → east (most negative → least negative longitude).
const BOUNDARY_LNGS: number[] = ZONE_BOUNDARIES.map((b) => b.location.lng);

/**
 * Binary search: given a longitude on the 407 corridor, return the zone.
 *
 * Finds the rightmost boundary whose longitude is less than the input,
 * which is the zone that contains this point.
 *
 * Time:  O(log n) where n = number of zone boundaries
 * Space: O(1)
 */
export function getZoneByLongitude(lng: number): Zone {
  let lo = 0;
  let hi = BOUNDARY_LNGS.length - 1;

  // Find the largest index where BOUNDARY_LNGS[index] < lng
  // (rightmost boundary that the point is east of)
  if (lng <= BOUNDARY_LNGS[0]!) return 1;

  let result = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (BOUNDARY_LNGS[mid]! < lng) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return ZONE_BOUNDARIES[result]!.zone;
}
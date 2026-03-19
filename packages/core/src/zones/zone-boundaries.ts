import type { Zone } from "../types";

// Zone boundary km values from the 407 ETR toll calculator API.
// 3 boundaries (Z6/Z7, Z7/Z8, Z9/Z10) are exact from cross-zone API responses.
// The rest are midpoints between the last interchange in zone N and first in zone N+1.
export const ZONE_BOUNDARIES: ReadonlyArray<{
  zone: Zone;
  startKm: number;
}> = [
  { zone: 1, startKm: 0 },
  { zone: 2, startKm: 7.986 },
  { zone: 3, startKm: 20.602 },
  { zone: 4, startKm: 27.282 },
  { zone: 5, startKm: 37.657 },
  { zone: 6, startKm: 49.111 },
  { zone: 7, startKm: 59.502 },     // exact (from API)
  { zone: 8, startKm: 67.748 },     // exact (from API)
  { zone: 9, startKm: 79.981 },
  { zone: 10, startKm: 84.019 },    // exact (from API)
  { zone: 11, startKm: 92.322 },
  { zone: 12, startKm: 101.995 },
];

export const EASTERN_TERMINUS_KM = 107.964; // Brock Road

import type { Zone } from "../types";

// Per-zone distances from the 407 ETR API (QEW-to-Brock full trip response).
const ZONE_DISTANCES_KM: readonly number[] = [
  6.062, // Zone 1
  12.927, // Zone 2
  6.144, // Zone 3
  9.879, // Zone 4
  12.987, // Zone 5
  11.503, // Zone 6
  8.246, // Zone 7
  11.268, // Zone 8
  5.003, // Zone 9
  7.252, // Zone 10
  8.839, // Zone 11
  7.854, // Zone 12
];

// Cumulative sum of zone distances gives each zone's start km.
export const ZONE_BOUNDARIES: ReadonlyArray<{ zone: Zone; startKm: number }> =
  ZONE_DISTANCES_KM.map((_, i) => ({
    zone: (i + 1) as Zone,
    startKm: ZONE_DISTANCES_KM.slice(0, i).reduce((sum, d) => sum + d, 0),
  }));

export const EASTERN_TERMINUS_KM = ZONE_DISTANCES_KM.reduce((sum, d) => sum + d, 0);

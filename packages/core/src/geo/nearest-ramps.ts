import type { LatLng, OnRamp, RampWithDistance } from "../types";
import { haversineKm } from "./haversine";
import { BoundedMaxHeap } from "./min-heap";

/**
 * Equirectangular squared distance: cheap proxy for haversine when we only
 * need relative ordering. Skips all trig except one cos() for the latitude
 * correction. The result is NOT in real units, but the ordering is identical
 * to haversine for points within a few hundred km of each other.
 */
function equirectangularDistSq({ origin, target }: { origin: LatLng; target: LatLng }): number {
  const dLat = target.lat - origin.lat;
  const dLng = (target.lng - origin.lng) * Math.cos(((origin.lat + target.lat) / 2) * (Math.PI / 180));
  return dLat * dLat + dLng * dLng;
}

/**
 * Find the k nearest on-ramps to an origin point.
 *
 * Uses a bounded max-heap (O(n log k)) with equirectangular distance for the
 * comparison pass, then computes true haversine only for the final k results.
 */
export function findNearestOnRamps({
  origin,
  ramps,
  count = 3,
}: {
  origin: LatLng;
  ramps: readonly OnRamp[];
  count?: number;
}): RampWithDistance[] {
  if (ramps.length <= count) {
    return ramps
      .map((ramp) => ({
        ...ramp,
        distanceKm: haversineKm({ a: origin, b: ramp.location }),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  const heap = new BoundedMaxHeap<{ ramp: OnRamp; distSq: number }>({
    capacity: count,
    compare: (a, b) => a.distSq - b.distSq,
  });

  for (const ramp of ramps) {
    heap.push({
      ramp,
      distSq: equirectangularDistSq({ origin, target: ramp.location }),
    });
  }

  return heap.drain().map(({ ramp }) => ({
    ...ramp,
    distanceKm: haversineKm({ a: origin, b: ramp.location }),
  }));
}

import type { LatLng } from "../types";

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine formula: calculates the great-circle distance between two points
 * on a sphere given their latitudes and longitudes. Accuracy is within ~0.5%
 * for distances under 100 km, which is sufficient for measuring zone lengths
 * along the 407 corridor (~5–15 km each). For actual road-following driving
 * distances, we delegate to Google Directions API instead.
 *
 * Reference: https://en.wikipedia.org/wiki/Haversine_formula
 */
export function haversineKm({ a, b }: { a: LatLng; b: LatLng }): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

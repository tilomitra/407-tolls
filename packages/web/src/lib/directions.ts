import type { DirectionsInput, DirectionsResult } from "@407-tolls/core";
import { haversineKm } from "@407-tolls/core";

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function googleDirections({
  origin,
  onRamp,
  offRamp,
  destination,
}: DirectionsInput): Promise<DirectionsResult> {
  const toWaypoint = ({ lat, lng }: { lat: number; lng: number }) => `${lat},${lng}`;

  const params = new URLSearchParams({
    origin: toWaypoint(origin),
    destination: toWaypoint(destination),
    waypoints: `via:${toWaypoint(onRamp.location)}|via:${toWaypoint(offRamp.location)}`,
    departure_time: "now",
    key: GOOGLE_API_KEY!,
  });

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?${params}`,
  );
  const data = await res.json();

  if (data.status !== "OK" || !data.routes?.[0]?.legs) {
    throw new Error(`Google Directions: ${data.status}`);
  }

  const legs = data.routes[0].legs;
  return {
    toOnRampMinutes: Math.round((legs[0]?.duration?.value ?? 0) / 60),
    highwayMinutes: Math.round((legs[1]?.duration?.value ?? 0) / 60),
    fromOffRampMinutes: Math.round((legs[2]?.duration?.value ?? 0) / 60),
  };
}

const CITY_SPEED_KMH = 40;
const HWY_SPEED_KMH = 110;

function estimatedDirections({
  origin,
  onRamp,
  offRamp,
  destination,
}: DirectionsInput): DirectionsResult {
  const toOnRampKm = haversineKm({ a: origin, b: onRamp.location });
  const highwayKm = haversineKm({ a: onRamp.location, b: offRamp.location });
  const fromOffRampKm = haversineKm({ a: offRamp.location, b: destination });

  return {
    toOnRampMinutes: Math.round((toOnRampKm / CITY_SPEED_KMH) * 60),
    highwayMinutes: Math.round((highwayKm / HWY_SPEED_KMH) * 60),
    fromOffRampMinutes: Math.round((fromOffRampKm / CITY_SPEED_KMH) * 60),
  };
}

export async function getDirections(input: DirectionsInput): Promise<DirectionsResult> {
  if (GOOGLE_API_KEY) {
    return googleDirections(input);
  }
  return estimatedDirections(input);
}

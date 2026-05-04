import type {
  DirectionsInput,
  DirectionsResult,
  LatLng,
  NoTollDirectionsInput,
  NoTollDirectionsResult,
} from "@407-tolls/core";
import { haversineKm } from "@407-tolls/core";

const GOOGLE_API_KEY =
  process.env.GOOGLE_DIRECTIONS_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;

const ROUTES_ENDPOINT =
  "https://routes.googleapis.com/directions/v2:computeRoutes";

interface RoutesLeg {
  duration?: string;
  staticDuration?: string;
  distanceMeters?: number;
}

interface RoutesRoute {
  duration?: string;
  staticDuration?: string;
  distanceMeters?: number;
  polyline?: { encodedPolyline?: string };
  legs?: RoutesLeg[];
}

interface RoutesResponse {
  routes?: RoutesRoute[];
  error?: { message?: string };
}

function latLng({ lat, lng }: LatLng) {
  return { location: { latLng: { latitude: lat, longitude: lng } } };
}

function parseDurationSeconds(d?: string): number {
  if (!d) return 0;
  // Format from Routes API: "1234s"
  const n = parseInt(d.replace(/s$/, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

async function callRoutes({
  origin,
  destination,
  intermediates,
  avoidTolls,
  fieldMask,
}: {
  origin: LatLng;
  destination: LatLng;
  intermediates?: LatLng[];
  avoidTolls?: boolean;
  fieldMask: string;
}): Promise<RoutesRoute> {
  const body: Record<string, unknown> = {
    origin: latLng(origin),
    destination: latLng(destination),
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
    polylineEncoding: "ENCODED_POLYLINE",
  };
  if (intermediates && intermediates.length > 0) {
    body.intermediates = intermediates.map(latLng);
  }
  if (avoidTolls) {
    body.routeModifiers = { avoidTolls: true };
  }

  const res = await fetch(ROUTES_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_API_KEY!,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as RoutesResponse;
  const route = data.routes?.[0];
  if (!route) {
    throw new Error(`Routes API: ${data.error?.message ?? `status ${res.status}`}`);
  }
  return route;
}

async function googleDirections({
  origin,
  onRamp,
  offRamp,
  destination,
}: DirectionsInput): Promise<DirectionsResult> {
  const route = await callRoutes({
    origin,
    destination,
    intermediates: [onRamp.location, offRamp.location],
    fieldMask:
      "routes.duration,routes.staticDuration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.duration,routes.legs.staticDuration,routes.legs.distanceMeters",
  });

  const legs = route.legs ?? [];
  const totalMeters = route.distanceMeters ?? legs.reduce((s, l) => s + (l.distanceMeters ?? 0), 0);
  const staticSecs = legs.reduce((s, l) => s + parseDurationSeconds(l.staticDuration), 0)
    || parseDurationSeconds(route.staticDuration);
  return {
    toOnRampMinutes: Math.round(parseDurationSeconds(legs[0]?.duration) / 60),
    highwayMinutes: Math.round(parseDurationSeconds(legs[1]?.duration) / 60),
    fromOffRampMinutes: Math.round(parseDurationSeconds(legs[2]?.duration) / 60),
    totalDistanceKm: Math.round((totalMeters / 1000) * 10) / 10,
    polyline: route.polyline?.encodedPolyline ?? "",
    staticDurationMinutes: staticSecs > 0 ? Math.round(staticSecs / 60) : undefined,
  };
}

async function googleNoTollDirections({
  origin,
  destination,
}: NoTollDirectionsInput): Promise<NoTollDirectionsResult> {
  const route = await callRoutes({
    origin,
    destination,
    avoidTolls: true,
    fieldMask:
      "routes.duration,routes.staticDuration,routes.distanceMeters,routes.polyline.encodedPolyline",
  });

  const staticSecs = parseDurationSeconds(route.staticDuration);
  return {
    durationMinutes: Math.round(parseDurationSeconds(route.duration) / 60),
    distanceKm: Math.round(((route.distanceMeters ?? 0) / 1000) * 10) / 10,
    polyline: route.polyline?.encodedPolyline ?? "",
    staticDurationMinutes: staticSecs > 0 ? Math.round(staticSecs / 60) : undefined,
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
    totalDistanceKm: Math.round((toOnRampKm + highwayKm + fromOffRampKm) * 10) / 10,
    polyline: "",
  };
}

function estimatedNoTollDirections({
  origin,
  destination,
}: NoTollDirectionsInput): NoTollDirectionsResult {
  const km = haversineKm({ a: origin, b: destination });
  return {
    durationMinutes: Math.round((km / 50) * 60),
    distanceKm: Math.round(km * 10) / 10,
    polyline: "",
  };
}

export async function getDirections(input: DirectionsInput): Promise<DirectionsResult> {
  if (GOOGLE_API_KEY) return googleDirections(input);
  return estimatedDirections(input);
}

export async function getNoTollDirections(
  input: NoTollDirectionsInput,
): Promise<NoTollDirectionsResult> {
  if (GOOGLE_API_KEY) return googleNoTollDirections(input);
  return estimatedNoTollDirections(input);
}

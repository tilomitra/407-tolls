import type { Zone, LatLng } from "../types";

// Zone boundary interchanges, ordered west → east.
// km = exit number from western terminus (407 ETR's distance-based exit numbering).
// These are more accurate than polyline-measured distances for inter-interchange spacing.
export const ZONE_BOUNDARIES: ReadonlyArray<{
  zone: Zone;
  name: string;
  km: number;
  location: LatLng;
}> = [
  { zone: 1, name: "QEW", km: 1, location: { lat: 43.4090, lng: -79.8270 } },
  { zone: 2, name: "Dundas St", km: 5, location: { lat: 43.3889, lng: -79.8341 } },
  { zone: 3, name: "Neyagawa Blvd", km: 18, location: { lat: 43.4797, lng: -79.7722 } },
  { zone: 4, name: "Highway 403", km: 24, location: { lat: 43.5192, lng: -79.7354 } },
  { zone: 5, name: "Highway 401", km: 34, location: { lat: 43.5974, lng: -79.8025 } },
  { zone: 6, name: "Highway 410", km: 46, location: { lat: 43.6615, lng: -79.7072 } },
  { zone: 7, name: "Highway 427", km: 58, location: { lat: 43.7480, lng: -79.6435 } },
  { zone: 8, name: "Highway 400", km: 66, location: { lat: 43.7800, lng: -79.5516 } },
  { zone: 9, name: "Yonge St", km: 77, location: { lat: 43.8317, lng: -79.4358 } },
  { zone: 10, name: "Highway 404", km: 82, location: { lat: 43.8366, lng: -79.3850 } },
  { zone: 11, name: "McCowan Rd", km: 90, location: { lat: 43.8548, lng: -79.2874 } },
  { zone: 12, name: "York Durham Line", km: 98, location: { lat: 43.8866, lng: -79.1893 } },
];

export const EASTERN_TERMINUS: LatLng = { lat: 43.9147, lng: -79.1033 };
export const EASTERN_TERMINUS_NAME = "Brock Rd";
export const EASTERN_TERMINUS_KM = 105;

export const BROCK_RD_LNG = -79.103;

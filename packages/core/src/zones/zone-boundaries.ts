import type { Zone, LatLng } from "../types";

// Zone boundary interchanges, ordered west → east.
// km = distance from western terminus (QEW), matching the 407 ETR exit numbering system.
// Coordinates are for map display. Distances use km markers (exact road distance).
export const ZONE_BOUNDARIES: ReadonlyArray<{
  zone: Zone;
  name: string;
  km: number;
  location: LatLng;
}> = [
  { zone: 1, name: "QEW", km: 1, location: { lat: 43.3630, lng: -79.8462 } },
  { zone: 2, name: "Dundas St", km: 5, location: { lat: 43.3840, lng: -79.8340 } },
  { zone: 3, name: "Neyagawa Blvd", km: 18, location: { lat: 43.4624, lng: -79.7818 } },
  { zone: 4, name: "Highway 403", km: 24, location: { lat: 43.5150, lng: -79.7450 } },
  { zone: 5, name: "Highway 401", km: 34, location: { lat: 43.5935, lng: -79.7280 } },
  { zone: 6, name: "Highway 410", km: 46, location: { lat: 43.6740, lng: -79.6870 } },
  { zone: 7, name: "Highway 427", km: 58, location: { lat: 43.7530, lng: -79.6100 } },
  { zone: 8, name: "Highway 400", km: 66, location: { lat: 43.7890, lng: -79.5380 } },
  { zone: 9, name: "Yonge St", km: 77, location: { lat: 43.8320, lng: -79.4330 } },
  { zone: 10, name: "Highway 404", km: 82, location: { lat: 43.8480, lng: -79.3810 } },
  { zone: 11, name: "McCowan Rd", km: 90, location: { lat: 43.8640, lng: -79.2620 } },
  { zone: 12, name: "York Durham Line", km: 98, location: { lat: 43.8880, lng: -79.1870 } },
];

export const EASTERN_TERMINUS: LatLng = { lat: 43.9180, lng: -79.0870 };
export const EASTERN_TERMINUS_NAME = "Brock Rd";
export const EASTERN_TERMINUS_KM = 105;

export const BROCK_RD_LNG = -79.087;

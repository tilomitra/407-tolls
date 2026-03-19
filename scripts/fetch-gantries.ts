/**
 * Fetch and enrich 407 ETR toll gantry locations from the Ontario GeoHub.
 *
 * Source: Ontario Road Network Composite Service (GeoHub Feature Service)
 *   API: https://services1.arcgis.com/TJH5KDher0W13Kgo/arcgis/rest/services/
 *        Ontario_Road_Network_Composite_Service_GeoHub_View_EN/FeatureServer/3
 *   Layer 3: ORN Composite - Toll Point (Feature Layer with geometry)
 *
 * The API returns all Ontario toll points (407 ETR, bridges, etc) with coordinates
 * but no zone, name, or free-flow info. This script filters to the 407 corridor
 * and enriches each gantry using our interchange data for zone assignment,
 * nearest-interchange naming, and free-section detection.
 *
 * Output: packages/web/src/data/407-etr-gantries.json
 *
 * Run: npx tsx scripts/fetch-gantries.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const API_URL = "https://services1.arcgis.com/TJH5KDher0W13Kgo/arcgis/rest/services/Ontario_Road_Network_Composite_Service_GeoHub_View_EN/FeatureServer/3/query";
const OUTPUT_PATH = join(process.cwd(), "packages/web/src/data/407-etr-gantries.json");
const INTERCHANGES_PATH = join(process.cwd(), "packages/web/src/data/407-etr-interchanges.json");
const PAGE_SIZE = 200;

// 407 ETR corridor bounding box
const BOUNDS = { minLng: -79.95, maxLng: -78.6, minLat: 43.2, maxLat: 44.05 };


interface Interchange {
  name: string;
  zone: number;
  isFree: boolean;
  location: { lat: number; lng: number };
}

const interchanges: Interchange[] = JSON.parse(readFileSync(INTERCHANGES_PATH, "utf-8"));

function isOn407(lng: number, lat: number): boolean {
  return lng >= BOUNDS.minLng && lng <= BOUNDS.maxLng && lat >= BOUNDS.minLat && lat <= BOUNDS.maxLat;
}

// Brute force nearest neighbor (41 interchanges, not worth a spatial index).
// Returns the nearest interchange so we can use its zone, name, and isFree.
function getNearestInterchange(lat: number, lng: number): Interchange {
  let best = interchanges[0]!;
  let bestDist = Infinity;
  for (const ic of interchanges) {
    const d = (ic.location.lat - lat) ** 2 + (ic.location.lng - lng) ** 2;
    if (d < bestDist) { bestDist = d; best = ic; }
  }
  return best;
}

async function fetchPage(offset: number): Promise<{ features: any[]; exceededTransferLimit: boolean }> {
  const params = new URLSearchParams({
    where: "1=1",
    outFields: "OBJECTID,TOLL_POINT_TYPE",
    returnGeometry: "true",
    f: "json",
    resultRecordCount: String(PAGE_SIZE),
    resultOffset: String(offset),
  });

  const res = await fetch(`${API_URL}?${params}`);
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  return res.json();
}

async function main() {
  console.log("Fetching toll points from Ontario GeoHub...");

  const allFeatures: any[] = [];
  let offset = 0;

  while (true) {
    const page = await fetchPage(offset);
    allFeatures.push(...(page.features ?? []));
    if (!page.exceededTransferLimit || page.features.length === 0) break;
    offset += page.features.length;
  }

  const gantries = allFeatures
    .filter((f) => isOn407(f.geometry.x, f.geometry.y))
    .map((f) => {
      const lat = f.geometry.y;
      const lng = f.geometry.x;
      const nearest = getNearestInterchange(lat, lng);

      return {
        id: f.attributes.OBJECTID,
        type: f.attributes.TOLL_POINT_TYPE,
        location: { lat, lng },
        zone: nearest.zone,
        name: nearest.name,
        isFree: nearest.isFree,
      };
    });

  console.log(`${allFeatures.length} total toll points, ${gantries.length} on the 407 corridor`);

  writeFileSync(OUTPUT_PATH, JSON.stringify(gantries, null, 2));
  console.log(`Saved to ${OUTPUT_PATH}`);
}

main().catch(console.error);

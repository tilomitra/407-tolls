/**
 * Fetch the 407 ETR highway polyline from OpenStreetMap.
 *
 * Source: OpenStreetMap via Overpass API (https://overpass-api.de)
 *   Community-maintained, free, no API key required.
 *   Queries for motorway ways tagged "ref=407 ETR" within the GTA bounding box.
 *
 * Output: packages/web/src/data/407-etr-highway-geometry.json
 *   Array of [longitude, latitude] coordinate pairs (GeoJSON order).
 *   Only the eastbound carriageway is kept to produce a clean single polyline.
 *   Points are sorted west-to-east and deduplicated within ~20m.
 *
 * Run: npx tsx scripts/fetch-highway-geometry.ts
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { OverpassElement } from "./types";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const DEDUP_THRESHOLD = 0.0002; // ~20m in degrees
const OUTPUT_PATH = join(process.cwd(), "packages/web/src/data/407-etr-highway-geometry.json");

const QUERY = `
[out:json][timeout:60];
way["ref"="407 ETR"]["highway"="motorway"](43.3,-79.9,43.95,-79.05);
out body;
node(w);
out skel;
`;

function isEastbound(nodes: number[], nodeMap: Map<number, [number, number]>): boolean {
  const first = nodeMap.get(nodes[0]!);
  const last = nodeMap.get(nodes[nodes.length - 1]!);
  if (!first || !last) return false;
  return last[0] > first[0];
}

function deduplicate(points: Array<[number, number]>): Array<[number, number]> {
  const result: Array<[number, number]> = [points[0]!];
  for (let i = 1; i < points.length; i++) {
    const prev = result[result.length - 1]!;
    const curr = points[i]!;
    if (Math.abs(curr[0] - prev[0]) > DEDUP_THRESHOLD || Math.abs(curr[1] - prev[1]) > DEDUP_THRESHOLD) {
      result.push(curr);
    }
  }
  return result;
}

async function main() {
  console.log("Fetching highway geometry from Overpass API...");

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    body: `data=${encodeURIComponent(QUERY)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!res.ok) {
    console.error(`Overpass returned ${res.status}. Wait a minute and retry (rate limiting).`);
    process.exit(1);
  }

  const elements: OverpassElement[] = (await res.json()).elements;

  const nodeMap = new Map<number, [number, number]>();
  for (const el of elements) {
    if (el.type === "node") nodeMap.set(el.id, [el.lon!, el.lat!]);
  }

  // Keep only EB ways so the polyline doesn't zigzag between carriageways
  const ebWays = elements.filter(
    (el): el is OverpassElement & { nodes: number[] } =>
      el.type === "way"
      && Array.isArray(el.nodes)
      && el.nodes.length >= 2
      && isEastbound(el.nodes, nodeMap),
  );

  console.log(`${ebWays.length} eastbound ways, ${nodeMap.size} nodes`);

  const seen = new Set<number>();
  const points: Array<[number, number]> = [];

  for (const way of ebWays) {
    for (const nodeId of way.nodes) {
      if (seen.has(nodeId)) continue;
      seen.add(nodeId);
      const coord = nodeMap.get(nodeId);
      if (coord) points.push(coord);
    }
  }

  points.sort((a, b) => a[0] - b[0]);
  const filtered = deduplicate(points);

  console.log(`${filtered.length} points (deduplicated from ${points.length})`);

  writeFileSync(OUTPUT_PATH, JSON.stringify(filtered));
  console.log(`Saved to ${OUTPUT_PATH}`);
}

main().catch(console.error);

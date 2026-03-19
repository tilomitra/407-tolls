/**
 * Build the enriched interchange file from 407 ETR API data.
 *
 * Inputs:
 *   scripts/data/407-etr-interchanges-raw.json
 *     Source: 407 ETR website API (api.407etr.com/toll-fee-calculator/api/v1/interchanges)
 *     Contains: names, coordinates, partial access notes, en/fr translations
 *
 *   scripts/data/407-etr-distances-raw.json
 *     Source: 407 ETR toll calculator API (api.407etr.com/toll-fee-calculator/api/v1/toll-rate)
 *     Fetched by: scripts/fetch-distances.ts
 *     Contains: distance and zone_info for each consecutive interchange pair
 *
 * Output:
 *   packages/web/src/data/407-etr-interchanges.json
 *
 * How it works:
 *   Distances between consecutive interchanges are indexed into an adjacency map
 *   for O(1) lookup. A west-to-east pass computes cumulative km from QEW (km 0)
 *   by adding distances like a prefix sum. Partial interchanges that got skipped
 *   during fetching are filled in with an east-to-west pass (subtracting from the
 *   next known neighbor). EB and WB distances are identical so one set of km values
 *   is sufficient. Zones and ramp access are read directly from the API responses.
 *
 * Run: npx tsx scripts/process-interchanges.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { RawInterchange, DistancePair, DistancesFile, Access } from "./types";

const SCRIPTS_DATA = join(process.cwd(), "scripts/data");
const APP_DATA = join(process.cwd(), "packages/web/src/data");

const round = (n: number) => Math.round(n * 1000) / 1000;

const parseZoneNumber = (s: string) => parseInt(s.replace("Zone ", ""), 10);

function getAccess(note: string): Access {
  const lower = note.toLowerCase();
  if (lower.includes("407 east only")) return "eb-side";
  if (lower.includes("407 west only")) return "wb-side";
  return "full";
}

// "access to 407 East only" = connects to EB carriageway (EB on-ramp + WB off-ramp)
// "access to 407 West only" = connects to WB carriageway (WB on-ramp + EB off-ramp)
function parseRampAccess(note: string) {
  const access = getAccess(note);
  if (access === "eb-side") {
    return {
      eastbound: { hasOnRamp: true, hasOffRamp: false },
      westbound: { hasOnRamp: false, hasOffRamp: true },
    };
  }
  if (access === "wb-side") {
    return {
      eastbound: { hasOnRamp: false, hasOffRamp: true },
      westbound: { hasOnRamp: true, hasOffRamp: false },
    };
  }
  return {
    eastbound: { hasOnRamp: true, hasOffRamp: true },
    westbound: { hasOnRamp: true, hasOffRamp: true },
  };
}

function main() {
  const rawInterchanges: RawInterchange[] = JSON.parse(
    readFileSync(join(SCRIPTS_DATA, "407-etr-interchanges-raw.json"), "utf-8"),
  );

  const rawDistances: DistancesFile | DistancePair[] = JSON.parse(
    readFileSync(join(SCRIPTS_DATA, "407-etr-distances-raw.json"), "utf-8"),
  );
  const pairs = (Array.isArray(rawDistances) ? rawDistances : rawDistances.pairs)
    .filter((p) => !p.error && p.etr_distance !== undefined);

  const ids = rawInterchanges.map((ic) => ic.id);

  // Index distances into an adjacency map for O(1) neighbor lookup
  const adj = new Map<number, Map<number, number>>();
  for (const pair of pairs) {
    if (!adj.has(pair.entry)) adj.set(pair.entry, new Map());
    if (!adj.has(pair.exit)) adj.set(pair.exit, new Map());
    adj.get(pair.entry)!.set(pair.exit, pair.etr_distance!);
    adj.get(pair.exit)!.set(pair.entry, pair.etr_distance!);
  }

  // West-to-east: cumulative km from QEW (km 0), adding distances like a prefix sum.
  // Handles both consecutive pairs and bridge pairs that skip partial interchanges.
  const km = new Map<number, number>();
  km.set(ids[0]!, 0);

  for (let i = 1; i < ids.length; i++) {
    const id = ids[i]!;
    const neighbors = adj.get(id);
    if (!neighbors) continue;

    for (let j = i - 1; j >= 0; j--) {
      const westId = ids[j]!;
      if (km.has(westId) && neighbors.has(westId)) {
        km.set(id, round(km.get(westId)! + neighbors.get(westId)!));
        break;
      }
    }
  }

  // East-to-west: fills Bramalea, Goreway, and Hwy 27 which the west-to-east
  // pass couldn't reach because partial access broke the chain.
  for (let i = ids.length - 2; i >= 0; i--) {
    const id = ids[i]!;
    if (km.has(id)) continue;
    const neighbors = adj.get(id);
    if (!neighbors) continue;

    for (let j = i + 1; j < ids.length; j++) {
      const eastId = ids[j]!;
      if (km.has(eastId) && neighbors.has(eastId)) {
        km.set(id, round(km.get(eastId)! - neighbors.get(eastId)!));
        break;
      }
    }
  }

  // Zone assignments from each API response's zone_info
  const zones = new Map<number, number>();
  for (const pair of pairs) {
    if (!pair.zone_info?.length) continue;
    zones.set(pair.entry, parseZoneNumber(pair.zone_info[0]!.zone));
    zones.set(pair.exit, parseZoneNumber(pair.zone_info[pair.zone_info.length - 1]!.zone));
  }

  // Validate all interchanges were positioned
  const missing = ids.filter((id) => !km.has(id));
  if (missing.length > 0) {
    const names = missing.map((id) => rawInterchanges.find((ic) => ic.id === id)?.name);
    console.error(`Failed to position: ${names.join(", ")}`);
    process.exit(1);
  }

  const result = rawInterchanges.map((ic) => {
    const { eastbound, westbound } = parseRampAccess(ic.note);
    return {
      id: String(ic.id),
      apiId: ic.id,
      name: ic.name,
      nameFr: ic.name_fr ?? ic.name,
      km: km.get(ic.id)!,
      zone: zones.get(ic.id) ?? 0,
      isFree: false,
      eastbound,
      westbound,
      location: { lat: ic.lat, lng: ic.lng },
      note: ic.note || null,
      noteFr: ic.note_fr || null,
    };
  });

  // km must strictly increase west to east
  for (let i = 1; i < result.length; i++) {
    if (result[i]!.km <= result[i - 1]!.km) {
      console.error(`Order violation: ${result[i - 1]!.name} (${result[i - 1]!.km}) >= ${result[i]!.name} (${result[i]!.km})`);
      process.exit(1);
    }
  }

  writeFileSync(join(APP_DATA, "407-etr-interchanges.json"), JSON.stringify(result, null, 2));

  console.log(`${result.length} interchanges`);
  for (const ic of result) {
    const ramps = [
      ic.eastbound.hasOnRamp ? "EB-on" : "",
      ic.eastbound.hasOffRamp ? "EB-off" : "",
      ic.westbound.hasOnRamp ? "WB-on" : "",
      ic.westbound.hasOffRamp ? "WB-off" : "",
    ].filter(Boolean).join(" ");
    console.log(`${ic.name.padEnd(28)} ${ic.km.toFixed(3).padStart(8)} km  Z${ic.zone}  ${ramps}`);
  }
}

main();

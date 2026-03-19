/**
 * Fetch distances between consecutive interchanges from the 407 ETR toll API.
 *
 * Source: api.407etr.com/toll-fee-calculator/api/v1/toll-rate
 * Input: scripts/data/407-etr-interchanges-raw.json
 * Output: scripts/data/407-etr-distances-raw.json
 *
 * For each interchange, queries the next valid one going eastbound and westbound.
 * Partial interchanges (EB-only or WB-only access) are skipped when they can't
 * serve as a valid entry or exit for that direction.
 *
 * Run: npx tsx scripts/fetch-distances.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { RawInterchange, DistancePair, Access, InterchangePair } from "./types";

const API_BASE = "https://api.407etr.com/toll-fee-calculator/api/v1/toll-rate";
const QUERY_TIMESTAMP = "2026-01-06T05:00:00.000Z";
const VEHICLE_CLASS = 2; // light vehicle
const DELAY_MS = 2000;

const PATHS = {
  interchanges: join(process.cwd(), "scripts/data/407-etr-interchanges-raw.json"),
  output: join(process.cwd(), "scripts/data/407-etr-distances-raw.json"),
};

const HEADERS: Record<string, string> = {
  accept: "*/*",
  "accept-encoding": "gzip, deflate, br, zstd",
  "accept-language": "en-US,en;q=0.9",
  "content-type": "application/json",
  origin: "https://www.407etr.com",
  referer: "https://www.407etr.com/",
  "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
  "x-recaptcha": "add token here",
};

// Adjacent pairs the API rejects with "invalidRoute" despite both having full access.
// Discovered empirically. Likely too close for the toll system to measure.
const UNSUPPORTED_PAIRS = new Set(["19-20", "20-19", "24-25", "25-24", "33-34", "34-33"]);

// "access to 407 East only" = connects to EB carriageway (EB on-ramp + WB off-ramp)
//   valid as: EB entry, WB exit
// "access to 407 West only" = connects to WB carriageway (WB on-ramp + EB off-ramp)
//   valid as: WB entry, EB exit
function getAccess(note: string): Access {
  const lower = note.toLowerCase();
  if (lower.includes("407 east only")) return "eb-side";
  if (lower.includes("407 west only")) return "wb-side";
  return "full";
}

const interchanges: RawInterchange[] = JSON.parse(readFileSync(PATHS.interchanges, "utf-8"));
const ids = interchanges.map((ic) => ic.id);
const accessById = new Map(interchanges.map((ic) => [ic.id, getAccess(ic.note)]));
const nameById = new Map(interchanges.map((ic) => [ic.id, ic.name]));

function canBeEntry(id: number, direction: "EB" | "WB"): boolean {
  const access = accessById.get(id) ?? "full";
  if (access === "full") return true;
  return direction === "EB" ? access === "eb-side" : access === "wb-side";
}

function canBeExit(id: number, direction: "EB" | "WB"): boolean {
  const access = accessById.get(id) ?? "full";
  if (access === "full") return true;
  return direction === "EB" ? access === "wb-side" : access === "eb-side";
}

function isValidPair(entry: number, exit: number, direction: "EB" | "WB"): boolean {
  return canBeEntry(entry, direction)
    && canBeExit(exit, direction)
    && !UNSUPPORTED_PAIRS.has(`${entry}-${exit}`);
}

function buildPairs(): InterchangePair[] {
  const pairs: InterchangePair[] = [];

  // Eastbound: for each interchange, find the next valid exit to the east
  for (let i = 0; i < ids.length - 1; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      if (isValidPair(ids[i]!, ids[j]!, "EB")) {
        pairs.push({ entry: ids[i]!, exit: ids[j]!, direction: "EB" });
        break;
      }
    }
  }

  // Westbound: for each interchange, find the next valid exit to the west
  for (let i = ids.length - 1; i > 0; i--) {
    for (let j = i - 1; j >= 0; j--) {
      if (isValidPair(ids[i]!, ids[j]!, "WB")) {
        pairs.push({ entry: ids[i]!, exit: ids[j]!, direction: "WB" });
        break;
      }
    }
  }

  return pairs;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchToll(entry: number, exit: number): Promise<DistancePair> {
  const url = `${API_BASE}?entry=${entry}&exit=${exit}&rated_class=${VEHICLE_CLASS}&timestamp=${QUERY_TIMESTAMP}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function main() {
  const pairs = buildPairs();
  const results: Array<DistancePair & { direction: string }> = [];

  console.log(`Fetching ${pairs.length} pairs...\n`);

  for (let i = 0; i < pairs.length; i++) {
    const { entry, exit, direction } = pairs[i]!;
    process.stdout.write(`  [${i + 1}/${pairs.length}] ${direction} ${nameById.get(entry)}(${entry}) -> ${nameById.get(exit)}(${exit})...`);

    try {
      const data = await fetchToll(entry, exit);
      results.push({ ...data, direction, entry, exit });
      console.log(` ${data.etr_distance}km`);
    } catch (err: any) {
      console.log(` FAILED: ${err.message}`);
      results.push({ direction, entry, exit, error: err.message } as any);
    }

    if (i < pairs.length - 1) await sleep(DELAY_MS);
  }

  writeFileSync(PATHS.output, JSON.stringify({
    fetchedAt: new Date().toISOString().slice(0, 10),
    ratedClass: VEHICLE_CLASS,
    ratedClassName: "Light vehicle",
    timestamp: QUERY_TIMESTAMP,
    totalPairs: results.length,
    pairs: results,
  }, null, 2));

  const failed = results.filter((r) => r.error);
  console.log(`\n${results.length} pairs saved to ${PATHS.output}`);
  if (failed.length) {
    console.log(`\n${failed.length} failed:`);
    failed.forEach((f) => console.log(`  ${f.direction} ${f.entry}->${f.exit}: ${f.error}`));
  }
}

main().catch(console.error);

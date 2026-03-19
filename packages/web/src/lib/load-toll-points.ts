import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { TollPoint, Interchange, OnRamp, Direction } from "@407-etr/core";

const DATA_DIR = join(process.cwd(), "..", "..", "data");

let cachedTollPoints: TollPoint[] | null = null;
let cachedInterchanges: Interchange[] | null = null;
let cachedOnRamps: Record<Direction, OnRamp[]> | null = null;

export function loadTollPoints(): TollPoint[] {
  if (cachedTollPoints) return cachedTollPoints;
  cachedTollPoints = JSON.parse(
    readFileSync(join(DATA_DIR, "407-toll-points.json"), "utf-8"),
  ) as TollPoint[];
  return cachedTollPoints;
}

export function loadInterchanges(): Interchange[] {
  if (cachedInterchanges) return cachedInterchanges;
  cachedInterchanges = JSON.parse(
    readFileSync(join(DATA_DIR, "interchanges.json"), "utf-8"),
  ) as Interchange[];
  return cachedInterchanges;
}

function buildOnRampsByDirection(): Record<Direction, OnRamp[]> {
  const interchanges = loadInterchanges();
  const eb: OnRamp[] = [];
  const wb: OnRamp[] = [];

  for (const ic of interchanges) {
    if (ic.isFree) continue;
    const ramp: OnRamp = {
      id: ic.id,
      name: ic.name,
      km: ic.km,
      location: ic.location,
      zone: ic.zone,
      isFree: ic.isFree,
    };
    if (ic.eastbound.hasOnRamp) eb.push(ramp);
    if (ic.westbound.hasOnRamp) wb.push(ramp);
  }

  return { eastbound: eb, westbound: wb };
}

export function getOnRampsForDirection({
  direction,
}: {
  direction: Direction;
}): OnRamp[] {
  if (!cachedOnRamps) cachedOnRamps = buildOnRampsByDirection();
  return cachedOnRamps[direction];
}

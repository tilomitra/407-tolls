import type { Interchange, OnRamp, Direction } from "@407-etr/core";
import { interchanges as rawInterchanges } from "@/data";

let cachedInterchangeMap: Map<string, Interchange> | null = null;
let cachedOnRamps: Record<Direction, OnRamp[]> | null = null;

export function getInterchangeById(id: string): Interchange | undefined {
  if (!cachedInterchangeMap) {
    cachedInterchangeMap = new Map(
      rawInterchanges.map((ic) => [ic.id, ic]),
    );
  }
  return cachedInterchangeMap.get(id);
}

function buildOnRampsByDirection(): Record<Direction, OnRamp[]> {
  const eb: OnRamp[] = [];
  const wb: OnRamp[] = [];

  for (const ic of rawInterchanges) {
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

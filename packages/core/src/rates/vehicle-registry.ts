import type {
  VehicleClass,
  VehicleClassId,
  RateKey,
  DayType,
  Direction,
  WeekdaySlot,
  WeekendSlot,
  Zone,
} from "../types";
import { light } from "./vehicles/light";
import { motorcycle } from "./vehicles/motorcycle";
import { medium } from "./vehicles/medium";
import { heavySingle } from "./vehicles/heavy-single";
import { heavyMulti } from "./vehicles/heavy-multi";

export const RATE_YEAR = 2026;

const registry = new Map<VehicleClassId, VehicleClass>([
  ["motorcycle", motorcycle],
  ["light", light],
  ["medium", medium],
  ["heavy_single", heavySingle],
  ["heavy_multi", heavyMulti],
]);

export const VEHICLE_CLASSES: readonly VehicleClass[] = [...registry.values()];

export function getVehicleClass({ id }: { id: VehicleClassId }): VehicleClass {
  const vc = registry.get(id);
  if (!vc) throw new Error(`Unknown vehicle class: ${id}`);
  return vc;
}

export function buildRateKey({
  dayType,
  direction,
  slot,
  zone,
}: {
  dayType: DayType;
  direction: Direction;
  slot: WeekdaySlot | WeekendSlot;
  zone: Zone;
}): RateKey {
  return `${dayType}:${direction}:${slot}:${zone}` as RateKey;
}

export function getRate({
  vehicleClassId,
  key,
}: {
  vehicleClassId: VehicleClassId;
  key: RateKey;
}): number {
  const vc = getVehicleClass({ id: vehicleClassId });
  const rate = vc.rates[key];
  if (rate === undefined) throw new Error(`Unknown rate key: ${key} for ${vehicleClassId}`);
  return rate;
}

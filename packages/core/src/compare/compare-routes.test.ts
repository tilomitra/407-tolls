import { describe, expect, it } from "vitest";
import type {
  CompareInput,
  DirectionsInput,
  DirectionsResult,
  OnRamp,
} from "../types";
import { compareRoutes } from "./compare-routes";

function ramp(i: number): OnRamp {
  return {
    id: `r${i}`,
    name: `IC ${i}`,
    km: i * 2,
    location: { lat: 43.7, lng: -79.8 + i * 0.02 },
    zone: 1,
    isFree: false,
  };
}

const RAMPS: OnRamp[] = Array.from({ length: 12 }, (_, i) => ramp(i));

const getDirections = async (d: DirectionsInput): Promise<DirectionsResult> => {
  const span = Math.abs(d.offRamp.km - d.onRamp.km);
  return {
    toOnRampMinutes: d.onRamp.km / 4,
    highwayMinutes: span / 2,
    fromOffRampMinutes: (22 - d.offRamp.km) / 4,
    totalDistanceKm: span + 5,
    polyline: `poly-${d.onRamp.id}-${d.offRamp.id}`,
  };
};

const baseInput: CompareInput = {
  vehicleClassId: "light",
  origin: { lat: 43.7, lng: -79.8 }, // nearest r0
  destination: { lat: 43.7, lng: -79.58 }, // nearest r11
  timeSlot: { dayType: "weekday", slot: "7am" },
  hasTransponder: true,
  maxRamps: 4,
};

describe("compareRoutes — corridor candidates", () => {
  it("only produces forward-ordered pairs (exit ahead of entry)", async () => {
    const result = await compareRoutes({
      input: baseInput,
      onRamps: RAMPS,
      offRamps: RAMPS,
      getDirections,
    });
    expect(result.routes.length).toBeGreaterThan(0);
    for (const r of result.routes) {
      // eastbound trip → exit km must exceed entry km
      expect(r.offRamp!.km).toBeGreaterThan(r.onRamp!.km);
    }
  });

  it("returns an empty result instead of crashing when no 407 option exists", async () => {
    const result = await compareRoutes({
      input: {
        ...baseInput,
        origin: { lat: 43.7, lng: -79.8 },
        destination: { lat: 43.7, lng: -79.8 }, // both map to r0
      },
      onRamps: RAMPS,
      offRamps: RAMPS,
      getDirections,
    });
    expect(result.routes).toHaveLength(0);
    expect(result.defaultRoute).toBeNull();
    expect(result.bestSaving).toBeNull();
  });
});

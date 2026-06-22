import { describe, expect, it } from "vitest";
import type {
  CompareInput,
  DirectionsInput,
  DirectionsResult,
  NoTollDirectionsResult,
  OnRamp,
} from "../types";
import { planTrip } from "./plan-trip";

// A toy westbound→eastbound stretch with closely spaced interchanges so we can
// prove the planner never shows two suggestions that are only one interchange
// apart.
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

const input: CompareInput = {
  vehicleClassId: "light",
  origin: { lat: 43.7, lng: -79.8 }, // nearest r0
  destination: { lat: 43.7, lng: -79.58 }, // nearest r11
  timeSlot: { dayType: "weekday", slot: "7am" },
  hasTransponder: true,
  maxRamps: 4,
};

// Drive times that make a longer highway segment faster, so several routes are
// genuinely competitive and the planner has to choose among them.
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

const getNoTollDirections = async (): Promise<NoTollDirectionsResult> => ({
  durationMinutes: 40,
  distanceKm: 28,
  polyline: "poly-no-407",
});

describe("planTrip — distinct suggestions", () => {
  it("never shows two 407 routes that are only one interchange apart", async () => {
    const result = await planTrip({
      input,
      onRamps: RAMPS,
      offRamps: RAMPS,
      getDirections,
      getNoTollDirections,
    });

    const order = new Map(RAMPS.map((r, i) => [r.id, i] as const));
    const tolled = result.routes.filter((r) => r.kind !== "no_407");

    for (let i = 0; i < tolled.length; i++) {
      for (let j = i + 1; j < tolled.length; j++) {
        const a = tolled[i]!;
        const b = tolled[j]!;
        const entryGap = Math.abs(order.get(a.onRamp!.id)! - order.get(b.onRamp!.id)!);
        const exitGap = Math.abs(order.get(a.offRamp!.id)! - order.get(b.offRamp!.id)!);
        // Distinct means entry OR exit differs by 2+ interchanges.
        expect(entryGap >= 2 || exitGap >= 2).toBe(true);
      }
    }
  });

  it("still returns ranked routes with badges", async () => {
    const result = await planTrip({
      input,
      onRamps: RAMPS,
      offRamps: RAMPS,
      getDirections,
      getNoTollDirections,
    });
    expect(result.routes.length).toBeGreaterThan(0);
    expect(result.routes.every((r) => r.badges.length > 0)).toBe(true);
    // The no-407 baseline is always one of the candidates.
    expect(result.allRoutes.some((r) => r.kind === "no_407")).toBe(true);
  });
});

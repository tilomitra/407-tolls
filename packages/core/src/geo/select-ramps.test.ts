import { describe, expect, it } from "vitest";
import type { OnRamp } from "../types";
import {
  buildRampOrder,
  inferTripDirection,
  interchangeGap,
  selectSpreadRamps,
} from "./select-ramps";

// A toy stretch of highway running west→east. km increases eastward, mirroring
// the real 407 where km 0 is at the QEW (west) and rises to the east end.
function ramp(id: string, km: number, lng: number): OnRamp {
  return {
    id,
    name: `IC ${id}`,
    km,
    location: { lat: 43.7, lng },
    zone: 1,
    isFree: false,
  };
}

// Ten evenly spaced interchanges, ~2 km / ~0.02° apart.
const RAMPS: OnRamp[] = Array.from({ length: 10 }, (_, i) =>
  ramp(`r${i}`, i * 2, -79.8 + i * 0.02),
);

describe("buildRampOrder", () => {
  it("ranks ramps west → east regardless of input order", () => {
    const shuffled = [RAMPS[5]!, RAMPS[0]!, RAMPS[9]!, RAMPS[2]!];
    const order = buildRampOrder(shuffled);
    expect(order.get("r0")).toBe(0);
    expect(order.get("r2")).toBe(1);
    expect(order.get("r5")).toBe(2);
    expect(order.get("r9")).toBe(3);
  });
});

describe("interchangeGap", () => {
  const order = buildRampOrder(RAMPS);

  it("counts interchanges between two ramps", () => {
    expect(interchangeGap({ order, aId: "r0", bId: "r1" })).toBe(1);
    expect(interchangeGap({ order, aId: "r0", bId: "r4" })).toBe(4);
    expect(interchangeGap({ order, aId: "r7", bId: "r3" })).toBe(4);
  });

  it("treats missing ids (e.g. the no-407 baseline) as infinitely far", () => {
    expect(interchangeGap({ order, aId: null, bId: "r0" })).toBe(Infinity);
    expect(interchangeGap({ order, aId: "r0", bId: "nope" })).toBe(Infinity);
  });
});

describe("inferTripDirection", () => {
  it("uses corridor projection, not raw longitude", () => {
    // Mirror Thornhill → Niagara Falls: the destination is slightly EAST in
    // longitude, but its nearest highway access is the WEST end (km 0), so the
    // trip is westbound. A naive longitude test would wrongly say eastbound.
    const ramps: OnRamp[] = [
      { id: "west", name: "QEW", km: 0, location: { lat: 43.4, lng: -79.83 }, zone: 1, isFree: false },
      { id: "mid", name: "Bayview", km: 81, location: { lat: 43.82, lng: -79.41 }, zone: 8, isFree: false },
    ];
    const origin = { lat: 43.82, lng: -79.4 }; // nearest "mid" (km 81)
    const destination = { lat: 43.06, lng: -79.11 }; // nearest "west" (km 0), but east in lng
    expect(destination.lng > origin.lng).toBe(true); // longitude alone would say eastbound
    expect(inferTripDirection({ origin, destination, ramps })).toBe("westbound");
  });

  it("returns eastbound when the destination projects further east", () => {
    const origin = { lat: 43.7, lng: -79.8 }; // r0
    const destination = { lat: 43.7, lng: -79.62 }; // r9
    expect(inferTripDirection({ origin, destination, ramps: RAMPS })).toBe("eastbound");
  });
});

describe("selectSpreadRamps", () => {
  it("spreads candidates at least minInterchangeGap apart", () => {
    const order = buildRampOrder(RAMPS);
    const picks = selectSpreadRamps({
      anchor: { lat: 43.7, lng: -79.8 }, // nearest r0
      far: { lat: 43.7, lng: -79.62 }, // nearest r9
      ramps: RAMPS,
      count: 4,
      minInterchangeGap: 2,
    });

    expect(picks.length).toBeGreaterThan(1);
    // Anchor end comes first.
    expect(picks[0]!.id).toBe("r0");
    // No two picks are within one interchange of each other.
    for (let i = 0; i < picks.length; i++) {
      for (let j = i + 1; j < picks.length; j++) {
        const gap = interchangeGap({ order, aId: picks[i]!.id, bId: picks[j]!.id });
        expect(gap).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("never suggests backtracking past the origin (stays within the corridor)", () => {
    // Trip covers only the western half (r0 → r4); candidates must stay in it.
    const picks = selectSpreadRamps({
      anchor: { lat: 43.7, lng: -79.8 }, // r0
      far: { lat: 43.7, lng: -79.72 }, // r4
      ramps: RAMPS,
      count: 4,
      minInterchangeGap: 2,
    });
    for (const p of picks) {
      expect(p.km).toBeGreaterThanOrEqual(0);
      expect(p.km).toBeLessThanOrEqual(8); // r4 is km 8
    }
  });

  it("returns a single anchor when origin and destination map to the same interchange", () => {
    const picks = selectSpreadRamps({
      anchor: { lat: 43.7, lng: -79.8 },
      far: { lat: 43.7, lng: -79.8 },
      ramps: RAMPS,
      count: 4,
    });
    expect(picks).toHaveLength(1);
    expect(picks[0]!.id).toBe("r0");
  });

  it("biases toward the anchor end of the corridor", () => {
    // Anchoring on the east end (r9) should pick r9 first, then work west.
    const picks = selectSpreadRamps({
      anchor: { lat: 43.7, lng: -79.62 }, // r9
      far: { lat: 43.7, lng: -79.8 }, // r0
      ramps: RAMPS,
      count: 3,
      minInterchangeGap: 2,
    });
    expect(picks[0]!.id).toBe("r9");
  });
});

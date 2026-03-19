import type { TollBreakdown, TollInput } from "../types";
import { getAllBreakdowns } from "./toll-cache";

/**
 * Calculate toll for a specific route and time slot.
 * Pulls from the shared cache. First call computes all 12 slots,
 * subsequent calls for the same route are a Map lookup.
 */
export function calculateToll(input: TollInput): TollBreakdown {
  const breakdowns = getAllBreakdowns(input);
  const { dayType, slot } = input.timeSlot;

  const match = breakdowns.find(
    (b) => b.timeSlot.dayType === dayType && b.timeSlot.slot === slot,
  );

  if (!match) {
    throw new Error(`No breakdown found for ${dayType}:${slot}`);
  }

  return match;
}

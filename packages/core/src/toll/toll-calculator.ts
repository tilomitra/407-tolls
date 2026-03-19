import type { TollBreakdown, TollInput } from "../types";
import { getAllBreakdowns, findBreakdown } from "./toll-cache";

/**
 * Calculate toll for a specific route and time slot.
 * Pulls from the shared cache. First call computes all 12 slots,
 * subsequent calls for the same route are a Map lookup.
 */
export function calculateToll(input: TollInput): TollBreakdown {
  return findBreakdown(getAllBreakdowns(input), input.timeSlot);
}

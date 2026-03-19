import type { RouteInput, TimeSlotCost } from "../types";
import { WEEKDAY_SLOT_LABELS, WEEKEND_SLOT_LABELS } from "../rates/time-slot-labels";
import { getAllBreakdowns } from "./toll-cache";

const slotLabels: Record<string, Record<string, string>> = {
  weekday: WEEKDAY_SLOT_LABELS,
  weekend_or_holiday: WEEKEND_SLOT_LABELS,
};

/**
 * Get toll cost for every time slot (8 weekday + 4 weekend).
 * Reads from the shared cache, same source as calculateToll.
 */
export function computeAllTimeSlotCosts(input: RouteInput): TimeSlotCost[] {
  const breakdowns = getAllBreakdowns(input);

  return breakdowns.map((b) => ({
    slot: b.timeSlot.slot,
    dayType: b.timeSlot.dayType,
    label: slotLabels[b.timeSlot.dayType]?.[b.timeSlot.slot] ?? b.timeSlot.slot,
    totalCents: b.totalCents,
  }));
}

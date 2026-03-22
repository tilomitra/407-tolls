import type { DayOfWeek } from "@407-etr/core";
import { DAY_NAMES } from "@407-etr/core";

const WEEKDAYS: DayOfWeek[] = [1, 2, 3, 4, 5];

export function formatCommuteDays(days: DayOfWeek[]): string {
  const daySet = new Set(days);
  const sorted = [...days].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
  const hasAllWeekdays = WEEKDAYS.every((d) => daySet.has(d));
  const hasAllWeekends = daySet.has(0) && daySet.has(6);

  if (hasAllWeekdays && hasAllWeekends) return "Every day";
  if (hasAllWeekdays && !hasAllWeekends) {
    const extra = sorted.filter((d) => d === 0 || d === 6);
    return extra.length > 0 ? `Weekdays + ${extra.map((d) => DAY_NAMES[d]).join(", ")}` : "Weekdays";
  }
  if (hasAllWeekends && !hasAllWeekdays) {
    const extra = sorted.filter((d) => d >= 1 && d <= 5);
    return extra.length > 0 ? `${extra.map((d) => DAY_NAMES[d]).join(", ")} + Weekends` : "Weekends";
  }

  return sorted.map((d) => DAY_NAMES[d]).join(", ");
}

export function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatLargeDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatTimeSlot(slot: string): string {
  const match = slot.match(/^(\d{1,2})(\d{2})?(am|pm)$/);
  if (!match) return slot;
  const hour = match[1];
  const minutes = match[2] ?? "00";
  const period = match[3]!.toUpperCase();
  return minutes === "00" ? `${hour} ${period}` : `${hour}:${minutes} ${period}`;
}

import type { WeekdaySlot, WeekendSlot, ResolvedTimeSlot, DayOfWeek, TollBreakdown } from "@407-etr/core";

export const VALID_WEEKDAY_SLOTS = new Set<string>(["5am", "7am", "930am", "1030am", "230pm", "330pm", "6pm", "9pm"]);
export const VALID_WEEKEND_SLOTS = new Set<string>(["830am", "10am", "7pm", "9pm"]);

export function parseRoute(route: string): { entryId: string; exitId: string } | null {
  const match = route.match(/^(.+)-to-(.+)$/);
  if (!match) return null;
  return { entryId: match[1]!, exitId: match[2]! };
}

export function parseTimeSlot(time: string | undefined, day: string | undefined): ResolvedTimeSlot {
  if (day === "weekend") {
    const slot = (time && VALID_WEEKEND_SLOTS.has(time) ? time : "10am") as WeekendSlot;
    return { dayType: "weekend_or_holiday", slot };
  }
  const slot = (time && VALID_WEEKDAY_SLOTS.has(time) ? time : "7am") as WeekdaySlot;
  return { dayType: "weekday", slot };
}

export function parseSlot(val: string | null | undefined, validSet: Set<string>, fallback: string): string {
  return val && validSet.has(val) ? val : fallback;
}

export function parseDays(val: string | null | undefined): DayOfWeek[] {
  if (!val) return [1, 2, 3, 4, 5];
  const parsed = val.split(",").map(Number).filter((d) => d >= 0 && d <= 6) as DayOfWeek[];
  return parsed.length > 0 ? parsed : [1, 2, 3, 4, 5];
}

export function buildTripShareUrl(entryId: string, exitId: string, breakdown: TollBreakdown): string {
  const day = breakdown.timeSlot.dayType === "weekday" ? "weekday" : "weekend";
  const transponder = breakdown.cameraChargeCents === null;
  return `/trip/${entryId}-to-${exitId}?day=${day}&time=${breakdown.timeSlot.slot}&transponder=${transponder}`;
}

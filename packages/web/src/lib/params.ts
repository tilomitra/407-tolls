import type {
  WeekdaySlot,
  WeekendSlot,
  ResolvedTimeSlot,
  DayOfWeek,
  TollBreakdown,
  TripType,
} from "@407-etr/core";

export function getString(
  query: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const val = query[key];
  return typeof val === "string" ? val : undefined;
}

export const VALID_WEEKDAY_SLOTS = new Set<string>([
  "5am",
  "7am",
  "930am",
  "1030am",
  "230pm",
  "330pm",
  "6pm",
  "9pm",
]);
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

export function parseSlot(
  val: string | null | undefined,
  validSet: Set<string>,
  fallback: string,
): string {
  return val && validSet.has(val) ? val : fallback;
}

export function parseDays(val: string | null | undefined): DayOfWeek[] {
  if (!val) return [1, 2, 3, 4, 5];
  const parsed = val
    .split(",")
    .map(Number)
    .filter((d) => d >= 0 && d <= 6) as DayOfWeek[];
  return parsed.length > 0 ? parsed : [1, 2, 3, 4, 5];
}

export function parseTripType(val: string | null | undefined): TripType {
  return val === "one_way" ? "one_way" : "round_trip";
}

export function buildTripShareUrl(
  entryId: string,
  exitId: string,
  breakdown: TollBreakdown,
): string {
  const params = new URLSearchParams({
    day: breakdown.timeSlot.dayType === "weekday" ? "weekday" : "weekend",
    time: breakdown.timeSlot.slot,
    transponder: String(breakdown.cameraChargeCents === null),
  });
  return `/trip/${entryId}-to-${exitId}?${params}`;
}

export function buildCommuteShareUrl({
  entryId,
  exitId,
  tripType,
  commuteDays,
  hasTransponder,
  goSlot,
  returnSlot,
  weekendGoSlot,
  weekendReturnSlot,
}: {
  entryId: string;
  exitId: string;
  tripType: TripType;
  commuteDays: DayOfWeek[];
  hasTransponder: boolean;
  goSlot: string;
  returnSlot?: string;
  weekendGoSlot: string;
  weekendReturnSlot?: string;
}): string {
  const params = new URLSearchParams({
    tripType,
    days: commuteDays.join(","),
    departure: goSlot,
    weekendDeparture: weekendGoSlot,
    transponder: String(hasTransponder),
  });
  if (returnSlot) params.set("return", returnSlot);
  if (weekendReturnSlot) params.set("weekendReturn", weekendReturnSlot);
  return `/commute/${entryId}-to-${exitId}?${params}`;
}

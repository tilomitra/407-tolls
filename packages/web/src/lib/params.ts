import type {
  WeekdaySlot,
  WeekendSlot,
  ResolvedTimeSlot,
  DayOfWeek,
  TripType,
  VehicleClassId,
} from "@407-etr/core";
import { VehicleClassIdSchema } from "@407-etr/core";
import type { TollQueryParams, CommuteQueryParams } from "./types";
import { buildSlugRoute } from "./slugs";

export function requireParam(url: URL, key: string): string {
  const value = url.searchParams.get(key);
  if (!value) throw new Error(`Missing required param: ${key}`);
  return value;
}

export function getParam(url: URL, key: string, fallback: string): string {
  return url.searchParams.get(key) ?? fallback;
}

export function getString(
  query: Record<string, string | string[] | undefined>,
  key: string,
  fallback: string,
): string {
  const val = query[key];
  return typeof val === "string" ? val : fallback;
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

export function parseTimeSlot(time: string, day: string): ResolvedTimeSlot {
  if (day === "weekend") {
    const slot = (VALID_WEEKEND_SLOTS.has(time) ? time : "10am") as WeekendSlot;
    return { dayType: "weekend_or_holiday", slot };
  }
  const slot = (VALID_WEEKDAY_SLOTS.has(time) ? time : "7am") as WeekdaySlot;
  return { dayType: "weekday", slot };
}

export function parseSlot(value: string, validSet: Set<string>, fallback: string): string {
  return validSet.has(value) ? value : fallback;
}

export function parseDays(value: string): DayOfWeek[] {
  const parsed = value
    .split(",")
    .map(Number)
    .filter((d) => d >= 0 && d <= 6) as DayOfWeek[];
  return parsed.length > 0 ? parsed : [1, 2, 3, 4, 5];
}

export function parseVehicleClass(value: string): VehicleClassId {
  const result = VehicleClassIdSchema.safeParse(value);
  return result.success ? result.data : "light";
}

export function parseTripType(value: string): TripType {
  return value === "one_way" ? "one_way" : "round_trip";
}

function buildTollSearchParams(params: TollQueryParams): URLSearchParams {
  return new URLSearchParams({
    vehicleClass: params.vehicleClassId,
    day: params.dayType === "weekday" ? "weekday" : "weekend",
    slot: params.slot,
    transponder: String(params.hasTransponder),
  });
}

function buildCommuteSearchParams(params: CommuteQueryParams): URLSearchParams {
  const result = new URLSearchParams({
    vehicleClass: params.vehicleClassId,
    tripType: params.tripType,
    days: params.commuteDays.join(","),
    departure: params.goSlot,
    weekendDeparture: params.weekendGoSlot,
    transponder: String(params.hasTransponder),
  });
  if (params.returnSlot) result.set("return", params.returnSlot);
  if (params.weekendReturnSlot) result.set("weekendReturn", params.weekendReturnSlot);
  return result;
}

export function buildTollApiUrl(params: TollQueryParams): string {
  const query = buildTollSearchParams(params);
  query.set("entry", params.entryId);
  query.set("exit", params.exitId);
  return `/api/toll?${query}`;
}

export function buildCommuteApiUrl(params: CommuteQueryParams): string {
  const query = buildCommuteSearchParams(params);
  query.set("entry", params.entryId);
  query.set("exit", params.exitId);
  return `/api/commute?${query}`;
}

export function buildTripShareUrl(params: TollQueryParams): string {
  return `/trip/${buildSlugRoute(params.entryId, params.exitId)}?${buildTollSearchParams(params)}`;
}

export function buildCommuteShareUrl(params: CommuteQueryParams): string {
  return `/commute/${buildSlugRoute(params.entryId, params.exitId)}?${buildCommuteSearchParams(params)}`;
}

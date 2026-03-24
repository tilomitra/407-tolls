import type { WeekdaySlot, WeekendSlot, CommuteInput } from "@407-tolls/core";
import type { Query } from "@/lib/types";
import { buildRouteInput } from "@/lib/load-toll-points";
import {
  VALID_WEEKDAY_SLOTS,
  VALID_WEEKEND_SLOTS,
  parseSlot,
  parseDays,
  parseTripType,
  parseVehicleClass,
  getString,
} from "@/lib/params";

export function buildCommuteInput(query: Query, transponder: boolean, entryId: string, exitId: string) {
  const vehicleClassId = parseVehicleClass(getString(query, "vehicleClass", "light"));
  const resolved = buildRouteInput({
    entryId,
    exitId,
    vehicleClassId,
    hasTransponder: transponder,
  });
  if (!resolved.ok) return null;

  const tripType = parseTripType(getString(query, "tripType", "round_trip"));
  const days = parseDays(getString(query, "days", "1,2,3,4,5"));
  const goSlot = parseSlot(
    getString(query, "departure", "7am"),
    VALID_WEEKDAY_SLOTS,
    "7am",
  ) as WeekdaySlot;
  const wkndGoSlot = parseSlot(
    getString(query, "weekendDeparture", "10am"),
    VALID_WEEKEND_SLOTS,
    "10am",
  ) as WeekendSlot;

  const commuteInput: CommuteInput =
    tripType === "round_trip"
      ? {
          tripType: "round_trip",
          route: resolved.route,
          goTimeSlot: { dayType: "weekday", slot: goSlot },
          returnTimeSlot: {
            dayType: "weekday",
            slot: parseSlot(
              getString(query, "return", "330pm"),
              VALID_WEEKDAY_SLOTS,
              "330pm",
            ) as WeekdaySlot,
          },
          weekendGoTimeSlot: { dayType: "weekend_or_holiday", slot: wkndGoSlot },
          weekendReturnTimeSlot: {
            dayType: "weekend_or_holiday",
            slot: parseSlot(
              getString(query, "weekendReturn", "7pm"),
              VALID_WEEKEND_SLOTS,
              "7pm",
            ) as WeekendSlot,
          },
          commuteDays: days,
        }
      : {
          tripType: "one_way",
          route: resolved.route,
          goTimeSlot: { dayType: "weekday", slot: goSlot },
          weekendGoTimeSlot: { dayType: "weekend_or_holiday", slot: wkndGoSlot },
          commuteDays: days,
        };

  return { entry: resolved.entry, exit: resolved.exit, days, tripType, commuteInput };
}

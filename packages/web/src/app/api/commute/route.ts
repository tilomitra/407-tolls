import { NextResponse } from "next/server";
import { computeCommuteEstimate, computeNearbyComparison } from "@407-tolls/core";
import type { WeekdaySlot, WeekendSlot, CommuteSchedule } from "@407-tolls/core";
import { buildRouteInput } from "@/lib/load-toll-points";
import { interchanges } from "@/data";
import {
  VALID_WEEKDAY_SLOTS,
  VALID_WEEKEND_SLOTS,
  requireParam,
  getParam,
  parseSlot,
  parseDays,
  parseTripType,
  parseVehicleClass,
} from "@/lib/params";
import { API_CACHE_HEADERS } from "@/lib/cache";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const entryId = url.searchParams.get("entry");
    const exitId = url.searchParams.get("exit");

    if (!entryId || !exitId) {
      return NextResponse.json({ error: "Missing entry or exit" }, { status: 400 });
    }

    const vehicleClassId = parseVehicleClass(requireParam(url, "vehicleClass"));
    const transponder = getParam(url, "transponder", "true") !== "false";
    const resolved = buildRouteInput({
      entryId,
      exitId,
      vehicleClassId,
      hasTransponder: transponder,
    });
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }

    const tripType = parseTripType(getParam(url, "tripType", "round_trip"));
    const goSlot = parseSlot(getParam(url, "departure", "7am"), VALID_WEEKDAY_SLOTS, "7am");
    const wkndGoSlot = parseSlot(
      getParam(url, "weekendDeparture", "10am"),
      VALID_WEEKEND_SLOTS,
      "10am",
    );
    const commuteDays = parseDays(getParam(url, "days", "1,2,3,4,5"));

    const schedule: CommuteSchedule =
      tripType === "round_trip"
        ? {
            tripType: "round_trip",
            goTimeSlot: { dayType: "weekday", slot: goSlot as WeekdaySlot },
            returnTimeSlot: {
              dayType: "weekday",
              slot: parseSlot(
                getParam(url, "return", "330pm"),
                VALID_WEEKDAY_SLOTS,
                "330pm",
              ) as WeekdaySlot,
            },
            weekendGoTimeSlot: { dayType: "weekend_or_holiday", slot: wkndGoSlot as WeekendSlot },
            weekendReturnTimeSlot: {
              dayType: "weekend_or_holiday",
              slot: parseSlot(
                getParam(url, "weekendReturn", "7pm"),
                VALID_WEEKEND_SLOTS,
                "7pm",
              ) as WeekendSlot,
            },
            commuteDays,
          }
        : {
            tripType: "one_way",
            goTimeSlot: { dayType: "weekday", slot: goSlot as WeekdaySlot },
            weekendGoTimeSlot: { dayType: "weekend_or_holiday", slot: wkndGoSlot as WeekendSlot },
            commuteDays,
          };

    const estimate = computeCommuteEstimate({ route: resolved.route, ...schedule });

    const nearby = computeNearbyComparison({
      entryInterchange: resolved.entry,
      exitInterchange: resolved.exit,
      interchanges,
      route: resolved.route,
      estimate,
      schedule,
    });

    return NextResponse.json({ estimate, nearby }, { headers: API_CACHE_HEADERS });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

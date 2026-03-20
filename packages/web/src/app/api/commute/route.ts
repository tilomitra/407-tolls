import { NextResponse } from "next/server";
import { computeCommuteEstimate, computeNearbyComparison } from "@407-etr/core";
import type { WeekdaySlot, WeekendSlot, CommuteSchedule } from "@407-etr/core";
import { buildRouteInput } from "@/lib/load-toll-points";
import { interchanges } from "@/data";
import {
  VALID_WEEKDAY_SLOTS,
  VALID_WEEKEND_SLOTS,
  parseSlot,
  parseDays,
  parseTripType,
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

    const transponder = url.searchParams.get("transponder") !== "false";
    const resolved = buildRouteInput(entryId, exitId, transponder);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }

    const tripType = parseTripType(url.searchParams.get("tripType"));
    const goSlot = parseSlot(url.searchParams.get("departure"), VALID_WEEKDAY_SLOTS, "7am");
    const wkndGoSlot = parseSlot(
      url.searchParams.get("weekendDeparture"),
      VALID_WEEKEND_SLOTS,
      "10am",
    );
    const commuteDays = parseDays(url.searchParams.get("days"));

    const schedule: CommuteSchedule =
      tripType === "round_trip"
        ? {
            tripType: "round_trip",
            goTimeSlot: { dayType: "weekday", slot: goSlot as WeekdaySlot },
            returnTimeSlot: {
              dayType: "weekday",
              slot: parseSlot(
                url.searchParams.get("return"),
                VALID_WEEKDAY_SLOTS,
                "330pm",
              ) as WeekdaySlot,
            },
            weekendGoTimeSlot: { dayType: "weekend_or_holiday", slot: wkndGoSlot as WeekendSlot },
            weekendReturnTimeSlot: {
              dayType: "weekend_or_holiday",
              slot: parseSlot(
                url.searchParams.get("weekendReturn"),
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

    return NextResponse.json(
      { estimate, nearby },
      { headers: API_CACHE_HEADERS },
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

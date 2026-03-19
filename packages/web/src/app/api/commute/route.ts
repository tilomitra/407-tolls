import { NextResponse } from "next/server";
import { computeCommuteEstimate } from "@407-etr/core";
import type { WeekdaySlot, WeekendSlot } from "@407-etr/core";
import { buildRouteInput } from "@/lib/load-toll-points";
import { VALID_WEEKDAY_SLOTS, VALID_WEEKEND_SLOTS, parseSlot, parseDays } from "@/lib/params";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const entryId = url.searchParams.get("entry");
    const exitId = url.searchParams.get("exit");
    const transponder = url.searchParams.get("transponder") !== "false";

    if (!entryId || !exitId) {
      return NextResponse.json({ error: "Missing entry or exit" }, { status: 400 });
    }

    const resolved = buildRouteInput(entryId, exitId, transponder);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }

    const days = parseDays(url.searchParams.get("days"));
    const goSlot = parseSlot(url.searchParams.get("departure"), VALID_WEEKDAY_SLOTS, "7am");
    const retSlot = parseSlot(url.searchParams.get("return"), VALID_WEEKDAY_SLOTS, "330pm");
    const wkndGoSlot = parseSlot(url.searchParams.get("weekendDeparture"), VALID_WEEKEND_SLOTS, "10am");
    const wkndRetSlot = parseSlot(url.searchParams.get("weekendReturn"), VALID_WEEKEND_SLOTS, "7pm");

    const result = computeCommuteEstimate({
      route: resolved.route,
      goTimeSlot: { dayType: "weekday", slot: goSlot as WeekdaySlot },
      returnTimeSlot: { dayType: "weekday", slot: retSlot as WeekdaySlot },
      weekendGoTimeSlot: { dayType: "weekend_or_holiday", slot: wkndGoSlot as WeekendSlot },
      weekendReturnTimeSlot: { dayType: "weekend_or_holiday", slot: wkndRetSlot as WeekendSlot },
      commuteDays: days,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

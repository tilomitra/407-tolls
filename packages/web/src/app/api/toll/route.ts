import { NextResponse } from "next/server";
import { calculateToll, computeAllTimeSlotCosts } from "@407-etr/core";
import type { WeekdaySlot, WeekendSlot } from "@407-etr/core";
import { buildRouteInput } from "@/lib/load-toll-points";
import { VALID_WEEKDAY_SLOTS, VALID_WEEKEND_SLOTS } from "@/lib/params";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const entryId = url.searchParams.get("entry");
    const exitId = url.searchParams.get("exit");
    const day = url.searchParams.get("day") ?? "weekday";
    const slot = url.searchParams.get("slot") ?? "7am";

    if (!entryId || !exitId) {
      return NextResponse.json({ error: "Missing entry or exit" }, { status: 400 });
    }

    const transponder = url.searchParams.get("transponder") !== "false";
    const resolved = buildRouteInput(entryId, exitId, transponder);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }

    const isWeekend = day === "weekend";
    if (isWeekend && !VALID_WEEKEND_SLOTS.has(slot)) {
      return NextResponse.json({ error: "Invalid time slot" }, { status: 400 });
    }
    if (!isWeekend && !VALID_WEEKDAY_SLOTS.has(slot)) {
      return NextResponse.json({ error: "Invalid time slot" }, { status: 400 });
    }

    const timeSlot = isWeekend
      ? { dayType: "weekend_or_holiday" as const, slot: slot as WeekendSlot }
      : { dayType: "weekday" as const, slot: slot as WeekdaySlot };

    const result = calculateToll({ ...resolved.route, timeSlot });
    const byTimeSlot = computeAllTimeSlotCosts(resolved.route);

    return NextResponse.json({ ...result, byTimeSlot }, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

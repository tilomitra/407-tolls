import { NextResponse } from "next/server";
import { calculateToll, computeAllTimeSlotCosts } from "@407-etr/core";
import type { WeekdaySlot, WeekendSlot } from "@407-etr/core";
import { buildRouteInput } from "@/lib/load-toll-points";
import {
  VALID_WEEKDAY_SLOTS,
  VALID_WEEKEND_SLOTS,
  requireParam,
  getParam,
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
    const day = getParam(url, "day", "weekday");
    const slot = getParam(url, "slot", "7am");

    const resolved = buildRouteInput({
      entryId,
      exitId,
      vehicleClassId,
      hasTransponder: transponder,
    });
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

    return NextResponse.json({ ...result, byTimeSlot }, { headers: API_CACHE_HEADERS });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

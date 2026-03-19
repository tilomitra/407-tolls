import { NextResponse } from "next/server";
import { computeCommuteEstimate } from "@407-etr/core";
import type { WeekdaySlot, WeekendSlot, DayOfWeek } from "@407-etr/core";
import { buildRouteInput } from "@/lib/load-toll-points";

const VALID_WEEKDAY_SLOTS = new Set(["5am", "7am", "930am", "1030am", "230pm", "330pm", "6pm", "9pm"]);
const VALID_WEEKEND_SLOTS = new Set(["830am", "10am", "7pm", "9pm"]);

function parseSlot(val: string | null, validSet: Set<string>, fallback: string): string {
  return val && validSet.has(val) ? val : fallback;
}

function parseDays(val: string | null): DayOfWeek[] {
  if (!val) return [1, 2, 3, 4, 5];
  const parsed = val.split(",").map(Number).filter((d) => d >= 0 && d <= 6) as DayOfWeek[];
  return parsed.length > 0 ? parsed : [1, 2, 3, 4, 5];
}

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
    if (!resolved) {
      return NextResponse.json({ error: "Invalid interchange ID" }, { status: 400 });
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

import { NextResponse } from "next/server";
import { z } from "zod/v4";
import {
  DirectionSchema,
  ResolvedTimeSlotSchema,
  calculateToll,
  computeAllTimeSlotCosts,
} from "@407-etr/core";
import { getInterchangeById } from "@/lib/load-toll-points";

const TollRequestSchema = z.object({
  entryId: z.string(),
  exitId: z.string(),
  direction: DirectionSchema,
  timeSlot: ResolvedTimeSlotSchema,
  hasTransponder: z.boolean().default(true),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = TollRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.prettifyError(parsed.error) },
        { status: 400 },
      );
    }

    const { entryId, exitId, direction, timeSlot, hasTransponder } = parsed.data;
    const entry = getInterchangeById(entryId);
    const exit = getInterchangeById(exitId);

    if (!entry || !exit) {
      return NextResponse.json(
        { error: "Invalid interchange ID" },
        { status: 400 },
      );
    }

    const shared = {
      entryZone: entry.zone,
      exitZone: exit.zone,
      entryKm: entry.km,
      exitKm: exit.km,
      direction,
      hasTransponder,
    };

    const result = calculateToll({ ...shared, timeSlot });
    const byTimeSlot = computeAllTimeSlotCosts(shared);

    return NextResponse.json({ ...result, byTimeSlot }, {
      headers: {
        // Rates are static for the year. Cache in browser for 1 hour,
        // allow CDN to serve stale while revalidating for up to 24 hours.
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

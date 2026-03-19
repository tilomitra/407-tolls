import { NextResponse } from "next/server";
import { z } from "zod/v4";
import {
  DirectionSchema,
  ResolvedTimeSlotSchema,
  computeCommuteEstimate,
} from "@407-etr/core";
import { getInterchangeById } from "@/lib/load-toll-points";

const CommuteRequestSchema = z.object({
  entryId: z.string(),
  exitId: z.string(),
  direction: DirectionSchema,
  goTimeSlot: ResolvedTimeSlotSchema,
  returnTimeSlot: ResolvedTimeSlotSchema,
  weekendGoTimeSlot: ResolvedTimeSlotSchema,
  weekendReturnTimeSlot: ResolvedTimeSlotSchema,
  commuteDays: z.array(z.number().int().min(0).max(6)).min(1),
  hasTransponder: z.boolean().default(true),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = CommuteRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.prettifyError(parsed.error) },
        { status: 400 },
      );
    }

    const { entryId, exitId, direction, goTimeSlot, returnTimeSlot, weekendGoTimeSlot, weekendReturnTimeSlot, commuteDays, hasTransponder } = parsed.data;
    const entry = getInterchangeById(entryId);
    const exit = getInterchangeById(exitId);

    if (!entry || !exit) {
      return NextResponse.json(
        { error: "Invalid interchange ID" },
        { status: 400 },
      );
    }

    const result = computeCommuteEstimate({
      route: {
        entryZone: entry.zone,
        exitZone: exit.zone,
        entryKm: entry.km,
        exitKm: exit.km,
        direction,
        hasTransponder,
      },
      goTimeSlot,
      returnTimeSlot,
      weekendGoTimeSlot,
      weekendReturnTimeSlot,
      commuteDays: commuteDays as Array<0 | 1 | 2 | 3 | 4 | 5 | 6>,
    });

    return NextResponse.json(result, {
      headers: {
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

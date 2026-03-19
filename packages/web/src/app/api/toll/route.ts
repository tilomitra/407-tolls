import { NextResponse } from "next/server";
import { z } from "zod/v4";
import {
  DirectionSchema,
  ResolvedTimeSlotSchema,
  calculateToll,
} from "@407-etr/core";
import { loadInterchanges } from "@/lib/load-toll-points";

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
    const interchanges = loadInterchanges();
    const entry = interchanges.find((ic) => ic.id === entryId);
    const exit = interchanges.find((ic) => ic.id === exitId);

    if (!entry || !exit) {
      return NextResponse.json(
        { error: "Invalid interchange ID" },
        { status: 400 },
      );
    }

    const result = calculateToll({
      entryZone: entry.zone,
      exitZone: exit.zone,
      entryKm: entry.km,
      exitKm: exit.km,
      direction,
      timeSlot,
      hasTransponder,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

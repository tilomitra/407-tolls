import { NextResponse } from "next/server";
import { CompareInputSchema, planTrip } from "@407-tolls/core";
import { z } from "zod/v4";
import { getOnRampsForDirection } from "@/lib/load-toll-points";
import { inferDirection } from "@407-tolls/core";
import { getDirections, getNoTollDirections } from "@/lib/directions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = CompareInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.prettifyError(parsed.error) },
        { status: 400 },
      );
    }

    const { origin, destination } = parsed.data;
    const direction = inferDirection({ entryLng: origin.lng, exitLng: destination.lng });
    const onRamps = getOnRampsForDirection({ direction });

    const result = await planTrip({
      input: parsed.data,
      onRamps,
      offRamps: onRamps,
      getDirections,
      getNoTollDirections,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("planner route error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { calculateToll, computeAllTimeSlotCosts } from "@407-etr/core";
import { buildRouteInput } from "@/lib/load-toll-points";
import { parseRoute, parseTimeSlot } from "@/lib/params";
import { formatDollars } from "@/lib/format";
import { TripPageClient } from "./trip-page-client";

export const revalidate = 86400;

interface PageProps {
  params: Promise<{ route: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function resolveTrip(routeParam: string, query: Record<string, string | string[] | undefined>) {
  const parsed = parseRoute(decodeURIComponent(routeParam));
  if (!parsed) return null;

  const resolved = buildRouteInput(parsed.entryId, parsed.exitId, true);
  if (!resolved.ok) return null;

  const transponder = query.transponder !== "false";
  const timeSlot = parseTimeSlot(
    typeof query.time === "string" ? query.time : undefined,
    typeof query.day === "string" ? query.day : undefined,
  );

  return { ...parsed, ...resolved, transponder, timeSlot };
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const trip = resolveTrip((await params).route, await searchParams);
  if (!trip) return { title: "Trip not found" };

  const result = calculateToll({ ...trip.route, timeSlot: trip.timeSlot, hasTransponder: trip.transponder });
  const title = `${trip.entry.name} to ${trip.exit.name} - ${formatDollars(result.totalCents)}`;
  const km = result.perZone.reduce((s, z) => s + z.distanceKm, 0).toFixed(1);
  const description = `407 ETR toll estimate: ${formatDollars(result.totalCents)} for ${trip.entry.name} to ${trip.exit.name}. ${km} km across ${result.perZone.length} zones.`;

  return { title, description, openGraph: { title, description, type: "website" } };
}

export default async function TripPage({ params, searchParams }: PageProps) {
  const trip = resolveTrip((await params).route, await searchParams);
  if (!trip) notFound();

  // Pre-compute both transponder variants so the client can toggle instantly
  const routeWith = trip.route;
  const routeWithout = { ...trip.route, hasTransponder: false };

  const resultWith = calculateToll({ ...routeWith, timeSlot: trip.timeSlot });
  const resultWithout = calculateToll({ ...routeWithout, timeSlot: trip.timeSlot });
  const byTimeSlotWith = computeAllTimeSlotCosts(routeWith);
  const byTimeSlotWithout = computeAllTimeSlotCosts(routeWithout);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <TripPageClient
        breakdown={{ ...resultWith, byTimeSlot: byTimeSlotWith }}
        breakdownWithout={{ ...resultWithout, byTimeSlot: byTimeSlotWithout }}
        entryName={trip.entry.name}
        exitName={trip.exit.name}
        entryId={trip.entryId}
        exitId={trip.exitId}
        hasTransponder={trip.transponder}
      />
    </main>
  );
}

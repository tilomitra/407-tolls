import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { calculateToll, computeAllTimeSlotCosts, getVehicleClass } from "@407-etr/core";
import { buildRouteInput } from "@/lib/load-toll-points";
import { parseRoute, parseTimeSlot, parseVehicleClass, getString } from "@/lib/params";
import { formatDollars } from "@/lib/format";
import { TripPageClient } from "./trip-page-client";

// Next.js statically analyzes this value, so it must be a literal.
export const revalidate = 86400;

interface PageProps {
  params: Promise<{ route: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function resolveTrip(routeParam: string, query: Record<string, string | string[] | undefined>) {
  const parsed = parseRoute(decodeURIComponent(routeParam));
  if (!parsed) return null;

  const vehicleClassId = parseVehicleClass(getString(query, "vehicleClass", "light"));
  const resolved = buildRouteInput({
    entryId: parsed.entryId,
    exitId: parsed.exitId,
    vehicleClassId,
    hasTransponder: true,
  });
  if (!resolved.ok) return null;

  const transponder = getString(query, "transponder", "true") !== "false";
  const timeSlot = parseTimeSlot(
    getString(query, "time", "7am"),
    getString(query, "day", "weekday"),
  );

  return { ...parsed, ...resolved, transponder, timeSlot };
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const trip = resolveTrip((await params).route, await searchParams);
  if (!trip) return { title: "Trip not found" };

  const result = calculateToll({
    ...trip.route,
    timeSlot: trip.timeSlot,
    hasTransponder: trip.transponder,
  });
  const vehicleClass = getVehicleClass({ id: trip.route.vehicleClassId });
  const km = result.perZone.reduce((s, z) => s + z.distanceKm, 0).toFixed(1);
  const title = `${trip.entry.name} to ${trip.exit.name} (${vehicleClass.name}) - ${formatDollars(
    result.totalCents,
  )}`;
  const description = `407 ETR toll estimate: ${formatDollars(result.totalCents)} for ${
    trip.entry.name
  } to ${trip.exit.name}. ${vehicleClass.name}, ${km} km across ${result.perZone.length} zones.`;

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
        vehicleClassId={trip.route.vehicleClassId}
        hasTransponder={trip.transponder}
      />
    </main>
  );
}

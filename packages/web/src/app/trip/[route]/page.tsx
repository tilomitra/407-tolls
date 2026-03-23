import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { calculateToll, computeAllTimeSlotCosts, getVehicleClass } from "@407-etr/core";
import type { Query } from "@/lib/types";
import { buildTripInput } from "@/lib/build-trip-input";
import { formatDollars } from "@/lib/format";
import { buildTripOgImageUrl, OG_SIZE } from "@/lib/og";
import { TripPageClient } from "./trip-page-client";

// Next.js statically analyzes this value, so it must be a literal.
export const revalidate = 86400;

interface PageProps {
  params: Promise<{ route: string }>;
  searchParams: Promise<Query>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const routeParam = (await params).route;
  const query = await searchParams;
  const trip = buildTripInput(routeParam, query);
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
  const ogImageUrl = buildTripOgImageUrl(routeParam, query);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: ogImageUrl, ...OG_SIZE, alt: title }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function TripPage({ params, searchParams }: PageProps) {
  const trip = buildTripInput((await params).route, await searchParams);
  if (!trip) notFound();

  const routeWith = { ...trip.route, hasTransponder: true };
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

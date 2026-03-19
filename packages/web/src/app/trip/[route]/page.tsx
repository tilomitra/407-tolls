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

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { route } = await params;
  const query = await searchParams;
  const parsed = parseRoute(decodeURIComponent(route));
  if (!parsed) return { title: "Trip not found" };

  const transponder = query.transponder !== "false";
  const resolved = buildRouteInput(parsed.entryId, parsed.exitId, transponder);
  if (!resolved.ok) return { title: "Trip not found" };

  const timeSlot = parseTimeSlot(
    typeof query.time === "string" ? query.time : undefined,
    typeof query.day === "string" ? query.day : undefined,
  );

  const result = calculateToll({ ...resolved.route, timeSlot });

  const title = `${resolved.entry.name} to ${resolved.exit.name} - ${formatDollars(result.totalCents)}`;
  const description = `407 ETR toll estimate: ${formatDollars(result.totalCents)} for ${resolved.entry.name} to ${resolved.exit.name}. ${result.perZone.reduce((s, z) => s + z.distanceKm, 0).toFixed(1)} km across ${result.perZone.length} zones.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function TripPage({ params, searchParams }: PageProps) {
  const { route } = await params;
  const query = await searchParams;
  const parsed = parseRoute(decodeURIComponent(route));
  if (!parsed) notFound();

  const transponder = query.transponder !== "false";
  const resolved = buildRouteInput(parsed.entryId, parsed.exitId, transponder);
  if (!resolved.ok) notFound();

  const timeSlot = parseTimeSlot(
    typeof query.time === "string" ? query.time : undefined,
    typeof query.day === "string" ? query.day : undefined,
  );

  const result = calculateToll({ ...resolved.route, timeSlot });
  const byTimeSlot = computeAllTimeSlotCosts(resolved.route);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <TripPageClient
        breakdown={{ ...result, byTimeSlot }}
        entryName={resolved.entry.name}
        exitName={resolved.exit.name}
      />
    </main>
  );
}

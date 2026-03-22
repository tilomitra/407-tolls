import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { computeCommuteEstimate, computeNearbyComparison, getVehicleClass } from "@407-etr/core";
import type { CommuteInput } from "@407-etr/core";
import { interchanges } from "@/data";
import type { Query } from "@/lib/types";
import { parseRoute, getString } from "@/lib/params";
import { buildCommuteInput } from "@/lib/build-commute-input";
import { formatDollars, formatCommuteDays } from "@/lib/format";
import { buildCommuteOgImageUrl, OG_SIZE } from "@/lib/og";
import { CommutePageClient } from "./commute-page-client";

// Next.js statically analyzes this value, so it must be a literal.
export const revalidate = 86400;

interface PageProps {
  params: Promise<{ route: string }>;
  searchParams: Promise<Query>;
}

function resolveCommute(route: string, query: Query) {
  const parsed = parseRoute(decodeURIComponent(route));
  if (!parsed) return null;

  const transponder = getString(query, "transponder", "true") !== "false";
  const resolved = buildCommuteInput(query, transponder, parsed.entryId, parsed.exitId);
  if (!resolved) return null;

  return { ...resolved, parsed, transponder };
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { route } = await params;
  const query = await searchParams;
  const resolved = resolveCommute(route, query);
  if (!resolved) return { title: "Commute not found" };

  const estimate = computeCommuteEstimate(resolved.commuteInput);
  const vehicleClass = getVehicleClass({ id: resolved.commuteInput.route.vehicleClassId });

  const dayLabels = formatCommuteDays(resolved.days);
  const title = `${resolved.entry.name} to ${resolved.exit.name} commute (${vehicleClass.name}): ${formatDollars(
    estimate.perMonthCents,
  )}/mo`;
  const description = `407 ETR commute estimate: ${formatDollars(
    estimate.perMonthCents,
  )}/month for ${resolved.entry.name} to ${resolved.exit.name}. ${vehicleClass.name}, ${dayLabels}.`;

  const ogImageUrl = buildCommuteOgImageUrl(route, query);

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

export default async function CommutePage({ params, searchParams }: PageProps) {
  const { route } = await params;
  const query = await searchParams;
  const resolved = resolveCommute(route, query);
  if (!resolved) notFound();

  const inputWith = resolved.commuteInput;
  const inputWithout: CommuteInput = {
    ...inputWith,
    route: { ...inputWith.route, hasTransponder: false },
  };

  const estimate = computeCommuteEstimate(inputWith);
  const estimateWithout = computeCommuteEstimate(inputWithout);

  const { route: _route, ...schedule } = inputWith;

  const nearby = computeNearbyComparison({
    entryInterchange: resolved.entry,
    exitInterchange: resolved.exit,
    interchanges,
    route: inputWith.route,
    estimate,
    schedule,
  });

  const shareParams =
    inputWith.tripType === "round_trip"
      ? {
          goSlot: inputWith.goTimeSlot.slot,
          returnSlot: inputWith.returnTimeSlot.slot,
          weekendGoSlot: inputWith.weekendGoTimeSlot.slot,
          weekendReturnSlot: inputWith.weekendReturnTimeSlot.slot,
        }
      : {
          goSlot: inputWith.goTimeSlot.slot,
          weekendGoSlot: inputWith.weekendGoTimeSlot.slot,
        };

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <CommutePageClient
        estimate={estimate}
        estimateWithout={estimateWithout}
        entryName={resolved.entry.name}
        exitName={resolved.exit.name}
        vehicleClassId={inputWith.route.vehicleClassId}
        tripType={resolved.tripType}
        commuteDays={resolved.days}
        hasTransponder={resolved.transponder}
        shareParams={shareParams}
        entryId={resolved.parsed.entryId}
        exitId={resolved.parsed.exitId}
        nearby={nearby}
      />
    </main>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { computeCommuteEstimate, computeNearbyComparison, DAY_NAMES } from "@407-etr/core";
import type { WeekdaySlot, WeekendSlot } from "@407-etr/core";
import { buildRouteInput } from "@/lib/load-toll-points";
import { interchanges } from "@/data";
import {
  VALID_WEEKDAY_SLOTS,
  VALID_WEEKEND_SLOTS,
  parseRoute,
  parseSlot,
  parseDays,
} from "@/lib/params";
import { formatDollars } from "@/lib/format";
import { CommutePageClient } from "./commute-page-client";

export const revalidate = 86400;

function buildCommuteInput(
  query: Record<string, string | string[] | undefined>,
  transponder: boolean,
  entryId: string,
  exitId: string,
) {
  const resolved = buildRouteInput(entryId, exitId, transponder);
  if (!resolved.ok) return null;

  const days = parseDays(typeof query.days === "string" ? query.days : undefined);
  const goSlot = parseSlot(
    typeof query.departure === "string" ? query.departure : undefined,
    VALID_WEEKDAY_SLOTS,
    "7am",
  );
  const returnSlot = parseSlot(
    typeof query.return === "string" ? query.return : undefined,
    VALID_WEEKDAY_SLOTS,
    "330pm",
  );
  const wkndGoSlot = parseSlot(
    typeof query.weekendDeparture === "string" ? query.weekendDeparture : undefined,
    VALID_WEEKEND_SLOTS,
    "10am",
  );
  const wkndRetSlot = parseSlot(
    typeof query.weekendReturn === "string" ? query.weekendReturn : undefined,
    VALID_WEEKEND_SLOTS,
    "7pm",
  );

  return {
    entry: resolved.entry,
    exit: resolved.exit,
    days,
    commuteInput: {
      route: resolved.route,
      goTimeSlot: { dayType: "weekday" as const, slot: goSlot as WeekdaySlot },
      returnTimeSlot: { dayType: "weekday" as const, slot: returnSlot as WeekdaySlot },
      weekendGoTimeSlot: {
        dayType: "weekend_or_holiday" as const,
        slot: wkndGoSlot as WeekendSlot,
      },
      weekendReturnTimeSlot: {
        dayType: "weekend_or_holiday" as const,
        slot: wkndRetSlot as WeekendSlot,
      },
      commuteDays: days,
    },
  };
}

interface PageProps {
  params: Promise<{ route: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { route } = await params;
  const query = await searchParams;
  const parsed = parseRoute(decodeURIComponent(route));
  if (!parsed) return { title: "Commute not found" };

  const transponder = query.transponder !== "false";
  const resolved = buildCommuteInput(query, transponder, parsed.entryId, parsed.exitId);
  if (!resolved) return { title: "Commute not found" };

  const estimate = computeCommuteEstimate(resolved.commuteInput);

  const dayLabels = resolved.days
    .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
    .map((d) => DAY_NAMES[d])
    .join(", ");

  const title = `${resolved.entry.name} to ${resolved.exit.name} commute: ${formatDollars(
    estimate.perMonthCents,
  )}/mo`;
  const description = `407 ETR commute estimate: ${formatDollars(
    estimate.perMonthCents,
  )}/month for ${resolved.entry.name} to ${resolved.exit.name}, ${dayLabels}.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function CommutePage({ params, searchParams }: PageProps) {
  const { route } = await params;
  const query = await searchParams;
  const parsed = parseRoute(decodeURIComponent(route));
  if (!parsed) notFound();

  const transponder = query.transponder !== "false";
  const resolved = buildCommuteInput(query, true, parsed.entryId, parsed.exitId);
  if (!resolved) notFound();

  // Pre-compute both transponder variants
  const inputWith = resolved.commuteInput;
  const inputWithout = { ...inputWith, route: { ...inputWith.route, hasTransponder: false } };

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

  const shareParams = {
    goSlot: inputWith.goTimeSlot.slot,
    returnSlot: inputWith.returnTimeSlot.slot,
    weekendGoSlot: inputWith.weekendGoTimeSlot.slot,
    weekendReturnSlot: inputWith.weekendReturnTimeSlot.slot,
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <CommutePageClient
        estimate={estimate}
        estimateWithout={estimateWithout}
        entryName={resolved.entry.name}
        exitName={resolved.exit.name}
        commuteDays={resolved.days}
        hasTransponder={transponder}
        shareParams={shareParams}
        entryId={parsed.entryId}
        exitId={parsed.exitId}
        nearby={nearby}
      />
    </main>
  );
}

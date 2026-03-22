import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { computeCommuteEstimate, computeNearbyComparison } from "@407-etr/core";
import type { WeekdaySlot, WeekendSlot, CommuteInput } from "@407-etr/core";
import { buildRouteInput } from "@/lib/load-toll-points";
import { interchanges } from "@/data";
import {
  VALID_WEEKDAY_SLOTS,
  VALID_WEEKEND_SLOTS,
  parseRoute,
  parseSlot,
  parseDays,
  parseTripType,
  parseVehicleClass,
  getString,
} from "@/lib/params";
import { formatDollars, formatCommuteDays } from "@/lib/format";
import { CommutePageClient } from "./commute-page-client";

// Next.js statically analyzes this value, so it must be a literal.
export const revalidate = 86400;

type Query = Record<string, string | string[] | undefined>;

function buildCommuteInput(query: Query, transponder: boolean, entryId: string, exitId: string) {
  const vehicleClassId = parseVehicleClass(getString(query, "vehicleClass", "light"));
  const resolved = buildRouteInput({
    entryId,
    exitId,
    vehicleClassId,
    hasTransponder: transponder,
  });
  if (!resolved.ok) return null;

  const tripType = parseTripType(getString(query, "tripType", "round_trip"));
  const days = parseDays(getString(query, "days", "1,2,3,4,5"));
  const goSlot = parseSlot(
    getString(query, "departure", "7am"),
    VALID_WEEKDAY_SLOTS,
    "7am",
  ) as WeekdaySlot;
  const wkndGoSlot = parseSlot(
    getString(query, "weekendDeparture", "10am"),
    VALID_WEEKEND_SLOTS,
    "10am",
  ) as WeekendSlot;

  const commuteInput: CommuteInput =
    tripType === "round_trip"
      ? {
          tripType: "round_trip",
          route: resolved.route,
          goTimeSlot: { dayType: "weekday", slot: goSlot },
          returnTimeSlot: {
            dayType: "weekday",
            slot: parseSlot(
              getString(query, "return", "330pm"),
              VALID_WEEKDAY_SLOTS,
              "330pm",
            ) as WeekdaySlot,
          },
          weekendGoTimeSlot: { dayType: "weekend_or_holiday", slot: wkndGoSlot },
          weekendReturnTimeSlot: {
            dayType: "weekend_or_holiday",
            slot: parseSlot(
              getString(query, "weekendReturn", "7pm"),
              VALID_WEEKEND_SLOTS,
              "7pm",
            ) as WeekendSlot,
          },
          commuteDays: days,
        }
      : {
          tripType: "one_way",
          route: resolved.route,
          goTimeSlot: { dayType: "weekday", slot: goSlot },
          weekendGoTimeSlot: { dayType: "weekend_or_holiday", slot: wkndGoSlot },
          commuteDays: days,
        };

  return { entry: resolved.entry, exit: resolved.exit, days, tripType, commuteInput };
}

interface PageProps {
  params: Promise<{ route: string }>;
  searchParams: Promise<Query>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { route } = await params;
  const query = await searchParams;
  const parsed = parseRoute(decodeURIComponent(route));
  if (!parsed) return { title: "Commute not found" };

  const transponder = getString(query, "transponder", "true") !== "false";
  const resolved = buildCommuteInput(query, transponder, parsed.entryId, parsed.exitId);
  if (!resolved) return { title: "Commute not found" };

  const estimate = computeCommuteEstimate(resolved.commuteInput);

  const dayLabels = formatCommuteDays(resolved.days);

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

  const transponder = getString(query, "transponder", "true") !== "false";
  const resolved = buildCommuteInput(query, true, parsed.entryId, parsed.exitId);
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
        hasTransponder={transponder}
        shareParams={shareParams}
        entryId={parsed.entryId}
        exitId={parsed.exitId}
        nearby={nearby}
      />
    </main>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { calculateToll, computeAllTimeSlotCosts } from "@407-etr/core";
import type { Direction, WeekdaySlot, WeekendSlot, ResolvedTimeSlot } from "@407-etr/core";
import { getInterchangeById } from "@/lib/load-toll-points";
import { TripPageClient } from "./trip-page-client";

// Rates are static for the year
export const revalidate = 86400;

const VALID_WEEKDAY_SLOTS = new Set(["5am", "7am", "930am", "1030am", "230pm", "330pm", "6pm", "9pm"]);
const VALID_WEEKEND_SLOTS = new Set(["830am", "10am", "7pm", "9pm"]);

function parseRoute(route: string): { entryId: string; exitId: string } | null {
  const match = route.match(/^(.+)-to-(.+)$/);
  if (!match) return null;
  return { entryId: match[1]!, exitId: match[2]! };
}

function parseTimeSlot(time: string | undefined, day: string | undefined): ResolvedTimeSlot {
  if (day === "weekend") {
    const slot = (time && VALID_WEEKEND_SLOTS.has(time) ? time : "10am") as WeekendSlot;
    return { dayType: "weekend_or_holiday", slot };
  }

  const slot = (time && VALID_WEEKDAY_SLOTS.has(time) ? time : "7am") as WeekdaySlot;
  return { dayType: "weekday", slot };
}

function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

interface PageProps {
  params: Promise<{ route: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { route } = await params;
  const query = await searchParams;
  const parsed = parseRoute(decodeURIComponent(route));
  if (!parsed) return { title: "Trip not found" };

  const entry = getInterchangeById(parsed.entryId);
  const exit = getInterchangeById(parsed.exitId);
  if (!entry || !exit) return { title: "Trip not found" };

  const timeSlot = parseTimeSlot(
    typeof query.time === "string" ? query.time : undefined,
    typeof query.day === "string" ? query.day : undefined,
  );
  const transponder = query.transponder !== "false";

  const direction: Direction = exit.zone > entry.zone ||
    (exit.zone === entry.zone && exit.km > entry.km)
    ? "eastbound" : "westbound";

  const result = calculateToll({
    entryZone: entry.zone,
    exitZone: exit.zone,
    entryKm: entry.km,
    exitKm: exit.km,
    direction,
    timeSlot,
    hasTransponder: transponder,
  });

  const title = `${entry.name} to ${exit.name} - ${formatDollars(result.totalCents)}`;
  const description = `407 ETR toll estimate: ${formatDollars(result.totalCents)} for ${entry.name} to ${exit.name}. ${result.perZone.reduce((s, z) => s + z.distanceKm, 0).toFixed(1)} km across ${result.perZone.length} zones.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function TripPage({ params, searchParams }: PageProps) {
  const { route } = await params;
  const query = await searchParams;
  const parsed = parseRoute(decodeURIComponent(route));
  if (!parsed) notFound();

  const entry = getInterchangeById(parsed.entryId);
  const exit = getInterchangeById(parsed.exitId);
  if (!entry || !exit) notFound();

  const timeSlot = parseTimeSlot(
    typeof query.time === "string" ? query.time : undefined,
    typeof query.day === "string" ? query.day : undefined,
  );
  const transponder = query.transponder !== "false";

  const direction: Direction = exit.zone > entry.zone ||
    (exit.zone === entry.zone && exit.km > entry.km)
    ? "eastbound" : "westbound";

  const shared = {
    entryZone: entry.zone,
    exitZone: exit.zone,
    entryKm: entry.km,
    exitKm: exit.km,
    direction,
    hasTransponder: transponder,
  };

  const result = calculateToll({ ...shared, timeSlot });
  const byTimeSlot = computeAllTimeSlotCosts(shared);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="/" className="group">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              407 ETR Savings Tool
            </h1>
          </a>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            2026 Rates
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <TripPageClient
          breakdown={{ ...result, byTimeSlot }}
          entryName={entry.name}
          exitName={exit.name}
        />
      </main>
    </div>
  );
}

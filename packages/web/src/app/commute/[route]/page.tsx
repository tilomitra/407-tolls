import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { computeCommuteEstimate } from "@407-etr/core";
import type { WeekdaySlot, WeekendSlot, DayOfWeek } from "@407-etr/core";
import { buildRouteInput } from "@/lib/load-toll-points";
import { CommutePageClient } from "./commute-page-client";

export const revalidate = 86400;

const VALID_WEEKDAY_SLOTS = new Set(["5am", "7am", "930am", "1030am", "230pm", "330pm", "6pm", "9pm"]);
const VALID_WEEKEND_SLOTS = new Set(["830am", "10am", "7pm", "9pm"]);

const DAY_NAMES: Record<number, string> = {
  0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat",
};

function parseRoute(route: string): { entryId: string; exitId: string } | null {
  const match = route.match(/^(.+)-to-(.+)$/);
  if (!match) return null;
  return { entryId: match[1]!, exitId: match[2]! };
}

function parseSlot(time: string | undefined, validSet: Set<string>, fallback: string): string {
  return time && validSet.has(time) ? time : fallback;
}

function parseDays(daysParam: string | undefined): DayOfWeek[] {
  if (!daysParam) return [1, 2, 3, 4, 5];
  const parsed = daysParam.split(",").map(Number).filter((d) => d >= 0 && d <= 6) as DayOfWeek[];
  return parsed.length > 0 ? parsed : [1, 2, 3, 4, 5];
}

function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function buildCommuteInput(query: Record<string, string | string[] | undefined>, transponder: boolean, entryId: string, exitId: string) {
  const resolved = buildRouteInput(entryId, exitId, transponder);
  if (!resolved) return null;

  const days = parseDays(typeof query.days === "string" ? query.days : undefined);
  const goSlot = parseSlot(typeof query.departure === "string" ? query.departure : undefined, VALID_WEEKDAY_SLOTS, "7am");
  const returnSlot = parseSlot(typeof query.return === "string" ? query.return : undefined, VALID_WEEKDAY_SLOTS, "330pm");
  const wkndGoSlot = parseSlot(typeof query.weekendDeparture === "string" ? query.weekendDeparture : undefined, VALID_WEEKEND_SLOTS, "10am");
  const wkndRetSlot = parseSlot(typeof query.weekendReturn === "string" ? query.weekendReturn : undefined, VALID_WEEKEND_SLOTS, "7pm");

  return {
    ...resolved,
    days,
    commuteInput: {
      route: resolved.route,
      goTimeSlot: { dayType: "weekday" as const, slot: goSlot as WeekdaySlot },
      returnTimeSlot: { dayType: "weekday" as const, slot: returnSlot as WeekdaySlot },
      weekendGoTimeSlot: { dayType: "weekend_or_holiday" as const, slot: wkndGoSlot as WeekendSlot },
      weekendReturnTimeSlot: { dayType: "weekend_or_holiday" as const, slot: wkndRetSlot as WeekendSlot },
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

  const title = `${resolved.entry.name} to ${resolved.exit.name} commute: ${formatDollars(estimate.perMonthCents)}/mo`;
  const description = `407 ETR commute estimate: ${formatDollars(estimate.perMonthCents)}/month for ${resolved.entry.name} to ${resolved.exit.name}, ${dayLabels}.`;

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
  const resolved = buildCommuteInput(query, transponder, parsed.entryId, parsed.exitId);
  if (!resolved) notFound();

  const estimate = computeCommuteEstimate(resolved.commuteInput);

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
        <CommutePageClient
          estimate={estimate}
          entryName={resolved.entry.name}
          exitName={resolved.exit.name}
          commuteDays={resolved.days}
          hasTransponder={transponder}
        />
      </main>
    </div>
  );
}

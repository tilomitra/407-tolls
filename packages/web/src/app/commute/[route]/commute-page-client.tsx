"use client";

import type { CommuteEstimate, DayOfWeek } from "@407-etr/core";
import { CommuteBreakdown } from "@/components/results/commute-breakdown";
import { ShareButton } from "@/components/ui/share-button";

export function CommutePageClient({
  estimate,
  entryName,
  exitName,
  commuteDays,
  hasTransponder,
}: {
  estimate: CommuteEstimate;
  entryName: string;
  exitName: string;
  commuteDays: DayOfWeek[];
  hasTransponder: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {entryName} to {exitName}
          </h2>
          <p className="text-sm text-slate-500">Commute estimate</p>
        </div>
        <ShareButton />
      </div>

      <CommuteBreakdown
        estimate={estimate}
        entryName={entryName}
        exitName={exitName}
        commuteDays={commuteDays}
        hasTransponder={hasTransponder}
      />

      <a
        href="/"
        className="
          flex items-center justify-center gap-2 rounded-xl
          bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white
          shadow-sm transition-all duration-150
          hover:bg-blue-700
          active:scale-[0.98]
        "
      >
        Estimate your commute
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </a>
    </div>
  );
}

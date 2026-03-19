"use client";

import type { TollResponse } from "@407-etr/core";
import { TollBreakdownView } from "@/components/results/toll-breakdown";
import { TimeChart } from "@/components/results/time-chart";
import { ShareButton } from "@/components/ui/share-button";

export function TripPageClient({
  breakdown,
  entryName,
  exitName,
}: {
  breakdown: TollResponse;
  entryName: string;
  exitName: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {entryName} to {exitName}
          </h2>
          <p className="text-sm text-slate-500">
            {breakdown.direction === "eastbound" ? "Eastbound" : "Westbound"} trip
          </p>
        </div>
        <ShareButton />
      </div>

      <TollBreakdownView breakdown={breakdown} />

      {breakdown.byTimeSlot.length > 0 && (
        <TimeChart
          data={breakdown.byTimeSlot}
          currentSlot={breakdown.timeSlot.slot}
          currentDayType={breakdown.timeSlot.dayType}
        />
      )}

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
        Calculate your route
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </a>
    </div>
  );
}

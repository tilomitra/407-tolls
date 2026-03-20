"use client";

import { useState } from "react";
import type { TollResponse } from "@407-etr/core";
import { TollBreakdownView } from "@/components/results/toll-breakdown";
import { TimeChart } from "@/components/results/time-chart";
import { Toggle } from "@/components/ui/toggle";

export function TripPageClient({
  breakdown,
  breakdownWithout,
  entryName,
  exitName,
  entryId,
  exitId,
  hasTransponder: initialTransponder,
}: {
  breakdown: TollResponse;
  breakdownWithout: TollResponse;
  entryName: string;
  exitName: string;
  entryId: string;
  exitId: string;
  hasTransponder: boolean;
}) {
  const [hasTransponder, setHasTransponder] = useState(initialTransponder);
  const active = hasTransponder ? breakdown : breakdownWithout;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">
        {entryName} to {exitName}
      </h2>

      <TollBreakdownView breakdown={active} entryId={entryId} exitId={exitId}>
        <Toggle
          checked={hasTransponder}
          onChange={setHasTransponder}
          label="I have a transponder"
        />
      </TollBreakdownView>

      {active.byTimeSlot.length > 0 && (
        <TimeChart
          data={active.byTimeSlot}
          currentSlot={active.timeSlot.slot}
          currentDayType={active.timeSlot.dayType}
        />
      )}

      <a
        href="/"
        className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      >
        Calculate your route
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </a>
    </div>
  );
}

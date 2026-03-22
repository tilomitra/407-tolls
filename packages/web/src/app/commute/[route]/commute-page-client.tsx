"use client";

import { useState } from "react";
import type {
  CommuteEstimate,
  DayOfWeek,
  NearbyComparison,
  TripType,
  VehicleClassId,
} from "@407-etr/core";
import { getVehicleClass } from "@407-etr/core";
import { CommuteBreakdown } from "@/components/results/commute-breakdown";
import { NearbyComparisonView } from "@/components/results/nearby-comparison";
import { Toggle } from "@/components/ui/toggle";

export function CommutePageClient({
  estimate,
  estimateWithout,
  entryName,
  exitName,
  vehicleClassId,
  tripType,
  commuteDays,
  hasTransponder: initialTransponder,
  shareParams,
  entryId,
  exitId,
  nearby,
}: {
  estimate: CommuteEstimate;
  estimateWithout: CommuteEstimate;
  entryName: string;
  exitName: string;
  vehicleClassId: VehicleClassId;
  tripType: TripType;
  commuteDays: DayOfWeek[];
  hasTransponder: boolean;
  shareParams: {
    goSlot: string;
    returnSlot?: string;
    weekendGoSlot: string;
    weekendReturnSlot?: string;
  };
  entryId: string;
  exitId: string;
  nearby: NearbyComparison;
}) {
  const [hasTransponder, setHasTransponder] = useState(initialTransponder);

  const vehicleClass = getVehicleClass({ id: vehicleClassId });
  const active = hasTransponder ? estimate : estimateWithout;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">
        {entryName} to {exitName}
      </h2>

      <CommuteBreakdown
        estimate={active}
        entryName={entryName}
        exitName={exitName}
        vehicleClassId={vehicleClassId}
        tripType={tripType}
        commuteDays={commuteDays}
        hasTransponder={hasTransponder}
        entryId={entryId}
        exitId={exitId}
        shareParams={shareParams}
      >
        {vehicleClass.hasTransponderOption && (
          <Toggle
            checked={hasTransponder}
            onChange={setHasTransponder}
            label="I have a transponder"
          />
        )}
      </CommuteBreakdown>

      <NearbyComparisonView comparison={nearby} entryName={entryName} exitName={exitName} />

      <a
        href="/"
        className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      >
        Estimate your commute
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </a>
    </div>
  );
}

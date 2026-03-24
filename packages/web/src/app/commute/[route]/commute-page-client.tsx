"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  CommuteEstimate,
  DayOfWeek,
  NearbyComparison,
  TripType,
  VehicleClassId,
} from "@407-tolls/core";
import { getVehicleClass } from "@407-tolls/core";
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
  const router = useRouter();
  const [hasTransponder, setHasTransponder] = useState(initialTransponder);

  const vehicleClass = getVehicleClass({ id: vehicleClassId });
  const active = hasTransponder ? estimate : estimateWithout;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-900">
          {entryName} to {exitName}
        </h2>
        <a
          href={`/?entry=${entryId}&exit=${exitId}&mode=commute`}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
        >
          Try your own commute →
        </a>
      </div>

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

      <NearbyComparisonView
        comparison={nearby}
        entryName={entryName}
        exitName={exitName}
        onAlternativeClick={(role, id) => {
          const entry = role === "entry" ? id : entryId;
          const exit = role === "exit" ? id : exitId;
          router.push(`/?entry=${entry}&exit=${exit}&mode=commute`);
        }}
      />
    </div>
  );
}

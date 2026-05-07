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
        <h2 className="text-xl font-semibold uppercase tracking-[0.14em] text-amex-text">
          {entryName} <span className="text-amex-gold-lo">→</span> {exitName}
        </h2>
        <a
          href={`/?entry=${entryId}&exit=${exitId}&mode=commute`}
          className="shrink-0 border border-amex-line-hi px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-amex-text-dim transition-colors hover:border-amex-gold-lo hover:text-amex-gold-hi"
        >
          Plan your own →
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

"use client";

import { useState } from "react";
import type { TollResponse, VehicleClassId } from "@407-tolls/core";
import { getVehicleClass } from "@407-tolls/core";
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
  vehicleClassId,
  hasTransponder: initialTransponder,
}: {
  breakdown: TollResponse;
  breakdownWithout: TollResponse;
  entryName: string;
  exitName: string;
  entryId: string;
  exitId: string;
  vehicleClassId: VehicleClassId;
  hasTransponder: boolean;
}) {
  const [hasTransponder, setHasTransponder] = useState(initialTransponder);

  const vehicleClass = getVehicleClass({ id: vehicleClassId });
  const active = hasTransponder ? breakdown : breakdownWithout;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold uppercase tracking-[0.14em] text-amex-text">
          {entryName} <span className="text-amex-gold-lo">→</span> {exitName}
        </h2>
        <a
          href={`/?entry=${entryId}&exit=${exitId}&mode=trip`}
          className="shrink-0 border border-amex-line-hi px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-amex-text-dim transition-colors hover:border-amex-gold-lo hover:text-amex-gold-hi"
        >
          Plan your own →
        </a>
      </div>

      <TollBreakdownView
        breakdown={active}
        entryId={entryId}
        exitId={exitId}
        vehicleClassId={vehicleClassId}
        hasTransponder={hasTransponder}
      >
        {vehicleClass.hasTransponderOption && (
          <Toggle
            checked={hasTransponder}
            onChange={setHasTransponder}
            label="I have a transponder"
          />
        )}
      </TollBreakdownView>

      {active.byTimeSlot.length > 0 && (
        <TimeChart
          data={active.byTimeSlot}
          currentSlot={active.timeSlot.slot}
          currentDayType={active.timeSlot.dayType}
        />
      )}
    </div>
  );
}

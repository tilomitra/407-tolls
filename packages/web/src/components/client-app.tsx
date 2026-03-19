"use client";

import { useState } from "react";
import type { TollPoint, Interchange, TollResponse, CommuteEstimate } from "@407-etr/core";
import type { DayOfWeek } from "@407-etr/core";
import { HighwayMap } from "./map/highway-map";
import { ZoneLegend } from "./map/zone-legend";
import { RouteForm, type FormMode } from "./form/route-form";
import { TollBreakdownView } from "./results/toll-breakdown";
import { TimeChart } from "./results/time-chart";
import { CommuteBreakdown } from "./results/commute-breakdown";
import { FreeSectionCallout } from "./results/free-section-callout";
import { Card } from "./ui/card";

export function ClientApp({
  gantries,
  interchanges,
  highwayGeometry,
}: {
  gantries: TollPoint[];
  interchanges: Interchange[];
  highwayGeometry: Array<[number, number]>;
}) {
  const [mode, setMode] = useState<FormMode>("single");
  const [tollResult, setTollResult] = useState<TollResponse | null>(null);
  const [commuteResult, setCommuteResult] = useState<{
    estimate: CommuteEstimate;
    entryName: string;
    exitName: string;
    commuteDays: DayOfWeek[];
    hasTransponder: boolean;
    shareParams: { goSlot: string; returnSlot: string; weekendGoSlot: string; weekendReturnSlot: string };
  } | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<{
    entryId: string;
    exitId: string;
  } | null>(null);

  function handleTollResult({
    result,
    entryId,
    exitId,
  }: {
    result: TollResponse;
    entryId: string;
    exitId: string;
  }) {
    setTollResult(result);
    setCommuteResult(null);
    setSelectedRoute({ entryId, exitId });
  }

  function handleCommuteResult({
    result,
    entryId,
    exitId,
    entryName,
    exitName,
    commuteDays,
    hasTransponder,
    shareParams,
  }: {
    result: CommuteEstimate;
    entryId: string;
    exitId: string;
    entryName: string;
    exitName: string;
    commuteDays: DayOfWeek[];
    hasTransponder: boolean;
    shareParams: { goSlot: string; returnSlot: string; weekendGoSlot: string; weekendReturnSlot: string };
  }) {
    setCommuteResult({ estimate: result, entryName, exitName, commuteDays, hasTransponder, shareParams });
    setTollResult(null);
    setSelectedRoute({ entryId, exitId });
  }

  function handleModeChange(newMode: FormMode) {
    setMode(newMode);
    setTollResult(null);
    setCommuteResult(null);
  }

  return (
    <div className="space-y-6">
      <FreeSectionCallout />

      {gantries.length > 0 && (
        <Card>
          <div className="p-1">
            <HighwayMap
              gantries={gantries}
              interchanges={interchanges}
              highwayGeometry={highwayGeometry}
              selectedRoute={selectedRoute}
            />
          </div>
          <div className="px-5 py-3">
            <ZoneLegend />
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <RouteForm
            interchanges={interchanges}
            mode={mode}
            onModeChange={handleModeChange}
            onTollResult={handleTollResult}
            onCommuteResult={handleCommuteResult}
          />
        </div>
        <div className="lg:col-span-3 space-y-6">
          {mode === "single" && tollResult ? (
            <>
              <TollBreakdownView breakdown={tollResult} entryId={selectedRoute?.entryId} exitId={selectedRoute?.exitId} />
              {tollResult.byTimeSlot.length > 0 && (
                <TimeChart
                  data={tollResult.byTimeSlot}
                  currentSlot={tollResult.timeSlot.slot}
                  currentDayType={tollResult.timeSlot.dayType}
                />
              )}
            </>
          ) : mode === "commute" && commuteResult ? (
            <CommuteBreakdown
              estimate={commuteResult.estimate}
              entryName={commuteResult.entryName}
              exitName={commuteResult.exitName}
              commuteDays={commuteResult.commuteDays}
              hasTransponder={commuteResult.hasTransponder}
              entryId={selectedRoute?.entryId}
              exitId={selectedRoute?.exitId}
              shareParams={commuteResult.shareParams}
            />
          ) : (
            <Card className="flex h-full items-center justify-center p-12">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-500">Select your route</p>
                <p className="mt-1 text-xs text-slate-400">
                  {mode === "commute"
                    ? "Set your commute details to see the cost breakdown"
                    : "Pick entry and exit interchanges to see the toll breakdown"}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useLocalStorage } from "@/lib/use-local-storage";
import type {
  TollPoint,
  Interchange,
  TollResponse,
  CommuteEstimate,
  NearbyComparison,
  TripType,
  VehicleClassId,
  DayOfWeek,
} from "@407-tolls/core";
import { HighwayMap } from "./map/highway-map";
import { ZoneLegend } from "./map/zone-legend";
import { RouteForm, type FormMode } from "./form/route-form";
import { TollBreakdownView } from "./results/toll-breakdown";
import { TimeChart } from "./results/time-chart";
import { CommuteBreakdown } from "./results/commute-breakdown";
import { NearbyComparisonView } from "./results/nearby-comparison";
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
  const searchParams = useSearchParams();
  const urlEntry = searchParams.get("entry") ?? undefined;
  const urlExit = searchParams.get("exit") ?? undefined;
  const urlMode = searchParams.get("mode");

  const [entryId, setEntryId] = useLocalStorage("407-entry", "25", urlEntry);
  const [exitId, setExitId] = useLocalStorage("407-exit", "33", urlExit);
  const [activeField, setActiveField] = useState<"entry" | "exit">("entry");
  const [mode, setMode] = useState<FormMode>(urlMode === "commute" ? "commute" : "single");
  const [tollResult, setTollResult] = useState<{
    data: TollResponse;
    vehicleClassId: VehicleClassId;
    hasTransponder: boolean;
  } | null>(null);
  const [commuteResult, setCommuteResult] = useState<{
    estimate: CommuteEstimate;
    nearby: NearbyComparison;
    entryId: string;
    exitId: string;
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
  } | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<{
    entryId: string;
    exitId: string;
  } | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  function handleTollResult(args: {
    result: TollResponse;
    entryId: string;
    exitId: string;
    vehicleClassId: VehicleClassId;
    hasTransponder: boolean;
  } | null, error?: string) {
    setRouteError(error ?? null);
    if (!args) {
      setTollResult(null);
      setSelectedRoute(null);
      return;
    }
    setTollResult({
      data: args.result,
      vehicleClassId: args.vehicleClassId,
      hasTransponder: args.hasTransponder,
    });
    setCommuteResult(null);
    setSelectedRoute({ entryId: args.entryId, exitId: args.exitId });
  }

  function handleCommuteResult(args: {
    estimate: CommuteEstimate;
    nearby: NearbyComparison;
    entryId: string;
    exitId: string;
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
  } | null, error?: string) {
    setRouteError(error ?? null);
    if (!args) {
      setCommuteResult(null);
      setSelectedRoute(null);
      return;
    }
    setCommuteResult(args);
    setTollResult(null);
    setSelectedRoute({ entryId: args.entryId, exitId: args.exitId });
  }

  const handleInterchangeClick = useCallback(
    (interchangeId: string) => {
      // Clicking a selected entry deselects it
      if (interchangeId === entryId) {
        setEntryId("");
        setActiveField("entry");
        return;
      }
      // Clicking a selected exit deselects it
      if (interchangeId === exitId) {
        setExitId("");
        setActiveField(entryId ? "exit" : "entry");
        return;
      }
      // Fill entry first if empty, otherwise use activeField
      if (!entryId || activeField === "entry") {
        setEntryId(interchangeId);
        setActiveField("exit");
      } else {
        setExitId(interchangeId);
        setActiveField("entry");
      }
    },
    [activeField, entryId, exitId, setEntryId, setExitId],
  );

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
              onInterchangeClick={handleInterchangeClick}
              entryId={entryId}
              exitId={exitId}
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
            entryId={entryId}
            exitId={exitId}
            onEntryChange={(id) => { setEntryId(id); setActiveField("exit"); }}
            onExitChange={(id) => { setExitId(id); setActiveField("entry"); }}
            mode={mode}
            onModeChange={handleModeChange}
            onTollResult={handleTollResult}
            onCommuteResult={handleCommuteResult}
          />
        </div>
        <div className="lg:col-span-3 space-y-6">
          {mode === "single" && tollResult ? (
            <>
              <TollBreakdownView
                breakdown={tollResult.data}
                entryId={selectedRoute!.entryId}
                exitId={selectedRoute!.exitId}
                vehicleClassId={tollResult.vehicleClassId}
                hasTransponder={tollResult.hasTransponder}
              />
              {tollResult.data.byTimeSlot.length > 0 && (
                <TimeChart
                  data={tollResult.data.byTimeSlot}
                  currentSlot={tollResult.data.timeSlot.slot}
                  currentDayType={tollResult.data.timeSlot.dayType}
                />
              )}
            </>
          ) : mode === "commute" && commuteResult ? (
            <>
              <CommuteBreakdown
                estimate={commuteResult.estimate}
                entryName={commuteResult.entryName}
                exitName={commuteResult.exitName}
                vehicleClassId={commuteResult.vehicleClassId}
                tripType={commuteResult.tripType}
                commuteDays={commuteResult.commuteDays}
                hasTransponder={commuteResult.hasTransponder}
                entryId={commuteResult.entryId}
                exitId={commuteResult.exitId}
                shareParams={commuteResult.shareParams}
              />
              <NearbyComparisonView
                comparison={commuteResult.nearby}
                entryName={commuteResult.entryName}
                exitName={commuteResult.exitName}
                onAlternativeClick={(role, id) => {
                  if (role === "entry") setEntryId(id);
                  else setExitId(id);
                }}
              />
            </>
          ) : (
            <Card className="flex h-full items-center justify-center p-12">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <svg
                    className="h-6 w-6 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-500">
                  {routeError ? "Route not available" : "Select your route"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {routeError ?? "Pick entry and exit interchanges or click the map"}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import type { CandidateRoute, LatLng, RankedRoute, RouteOption } from "@407-tolls/core";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { formatDollars } from "@/lib/format";

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

type TrafficLevel = "light" | "moderate" | "heavy" | "unknown";

function trafficLevel(driveTimeMinutes: number, staticDurationMinutes?: number): TrafficLevel {
  if (!staticDurationMinutes || staticDurationMinutes <= 0) return "unknown";
  const ratio = driveTimeMinutes / staticDurationMinutes;
  if (ratio <= 1.15) return "light";
  if (ratio <= 1.35) return "moderate";
  return "heavy";
}

function trafficColor(level: TrafficLevel): string {
  if (level === "light") return "text-amex-emerald";
  if (level === "moderate") return "text-amex-amber";
  if (level === "heavy") return "text-amex-ruby";
  return "text-amex-text";
}

function routeKindLabel(r: RouteOption): string {
  if (r.kind === "no_407") return "No 407";
  if (r.kind === "full_407") return "Full 407";
  return "Partial 407";
}

function badgeProps(b: RankedRoute["badges"][number]) {
  switch (b) {
    case "cheapest":
      return { label: "Cheapest", variant: "success" as const };
    case "fastest":
      return { label: "Fastest", variant: "info" as const };
    case "best_value":
      return { label: "Optimal", variant: "warning" as const };
    case "second_best_value":
      return { label: "2nd Optimal", variant: "warning" as const };
  }
}

function llStr(p: LatLng): string {
  return `${p.lat},${p.lng}`;
}

function googleMapsUrl(r: RouteOption, origin: LatLng, destination: LatLng): string {
  const params = new URLSearchParams({
    api: "1",
    origin: llStr(origin),
    destination: llStr(destination),
    travelmode: "driving",
    dir_action: "navigate",
  });
  if (r.kind === "no_407") {
    params.set("avoid", "tolls");
  } else if (r.onRamp && r.offRamp) {
    params.set("waypoints", `${llStr(r.onRamp.location)}|${llStr(r.offRamp.location)}`);
    params.set("waypoint_names", `${r.onRamp.name}|${r.offRamp.name}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

// Round a cent value UP to the nearest 50¢ — used to give the slider a clean
// upper bound and step size.
const BUDGET_STEP_CENTS = 50;
function roundUpToStep(cents: number, step: number = BUDGET_STEP_CENTS): number {
  return Math.ceil(cents / step) * step;
}

export function RouteCards({
  routes,
  allRoutes,
  selectedId,
  onSelect,
  origin,
  destination,
}: {
  routes: RankedRoute[];
  allRoutes: CandidateRoute[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  origin: LatLng | null;
  destination: LatLng | null;
}) {
  if (routes.length === 0) {
    return (
      <Card className="flex h-full items-center justify-center p-12">
        <div className="text-center">
          <p className="text-amex-eyebrow">No Routes Yet</p>
          <p className="mt-2 text-xs text-amex-text-mute">Pick origin and destination to see options</p>
        </div>
      </Card>
    );
  }

  const noTollRoute = routes.find((r) => r.kind === "no_407");
  const noTollLevel = noTollRoute
    ? trafficLevel(noTollRoute.driveTimeMinutes, noTollRoute.staticDurationMinutes)
    : "unknown";
  const noTollIsHeavy = noTollLevel === "heavy";
  const noTollMinutes = noTollRoute?.driveTimeMinutes ?? 0;

  return (
    <div className="space-y-3">
      {noTollIsHeavy && (
        <div className="flex items-center gap-2 border border-amex-amber-deep bg-amex-amber-deep/30 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-amex-amber">
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          Heavy traffic — 407 may save significant time
        </div>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[340px] text-sm">
          <thead>
            <tr className="border-b border-amex-line bg-amex-ink text-left text-[10px] font-medium uppercase tracking-[0.22em] text-amex-text-mute">
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3 text-right">Cost</th>
              <th className="px-4 py-3 text-right">$/min saved</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => {
              const isSelected = r.id === selectedId;
              const tollCents = r.toll?.totalCents ?? 0;
              const mapsUrl = origin && destination ? googleMapsUrl(r, origin, destination) : null;
              const level = trafficLevel(r.driveTimeMinutes, r.staticDurationMinutes);
              const timeColor = trafficColor(level);
              const timeSavedVsNoToll = noTollMinutes - r.driveTimeMinutes;
              const costPerMinSaved =
                r.kind !== "no_407" && tollCents > 0 && timeSavedVsNoToll > 0
                  ? tollCents / 100 / timeSavedVsNoToll
                  : null;

              return (
                <tr
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(r.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(r.id);
                    }
                  }}
                  className={`cursor-pointer border-b border-amex-line last:border-0 transition-colors ${
                    isSelected ? "bg-amex-gold-mist" : "hover:bg-amex-elev"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`font-semibold uppercase tracking-[0.12em] text-sm ${isSelected ? "text-amex-gold-hi" : "text-amex-text"}`}>
                        {routeKindLabel(r)}
                      </span>
                      {r.badges.map((b) => {
                        const { label, variant } = badgeProps(b);
                        return <Badge key={b} variant={variant}>{label}</Badge>;
                      })}
                    </div>
                    {r.kind === "partial_407" && r.onRamp && r.offRamp && (
                      <div className="mt-1 space-y-0.5 text-[10px] uppercase tracking-[0.14em] text-amex-text-mute">
                        <p><span className="text-amex-text-faint">Enter</span> {r.onRamp.name}</p>
                        <p><span className="text-amex-text-faint">Exit</span> {r.offRamp.name}</p>
                      </div>
                    )}
                    {r.kind === "full_407" && r.onRamp && r.offRamp && (
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-amex-text-mute">
                        {r.onRamp.name} → {r.offRamp.name}
                      </p>
                    )}
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-amex-gold hover:text-amex-gold-hi"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
                        </svg>
                        Maps
                      </a>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span className={`font-semibold tabular-nums ${timeColor}`}>{formatMinutes(r.driveTimeMinutes)}</span>
                    {r.kind !== "no_407" && noTollMinutes > 0 && timeSavedVsNoToll !== 0 && (
                      <p className={`text-[10px] tabular-nums ${
                        timeSavedVsNoToll > 0
                          ? noTollIsHeavy ? "text-amex-emerald" : "text-amex-text-mute"
                          : "text-amex-text-mute"
                      }`}>
                        {timeSavedVsNoToll > 0
                          ? `−${formatMinutes(timeSavedVsNoToll)}`
                          : `+${formatMinutes(-timeSavedVsNoToll)}`}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold tabular-nums text-amex-text">{formatDollars(tollCents)}</span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    {costPerMinSaved !== null ? (
                      <span className="font-medium tabular-nums text-amex-text-dim">${costPerMinSaved.toFixed(2)}</span>
                    ) : (
                      <span className="text-amex-text-faint">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <BudgetPicker
        allRoutes={allRoutes}
        noTollMinutes={noTollMinutes}
        noTollIsHeavy={noTollIsHeavy}
        origin={origin}
        destination={destination}
      />
    </div>
  );
}

function BudgetPicker({
  allRoutes,
  noTollMinutes,
  noTollIsHeavy,
  origin,
  destination,
}: {
  allRoutes: CandidateRoute[];
  noTollMinutes: number;
  noTollIsHeavy: boolean;
  origin: LatLng | null;
  destination: LatLng | null;
}) {
  const maxCents = useMemo(() => {
    const max = allRoutes.reduce(
      (acc, r) => Math.max(acc, r.toll?.totalCents ?? 0),
      0,
    );
    return roundUpToStep(max);
  }, [allRoutes]);

  const [budgetCents, setBudgetCents] = useState<number>(maxCents);

  // If a new search produces a different toll ceiling, reset the slider so
  // it doesn't snap to an out-of-range value from a previous result set.
  useEffect(() => {
    setBudgetCents(maxCents);
  }, [maxCents]);

  const pick = useMemo(() => {
    const eligible = allRoutes.filter(
      (r) => (r.toll?.totalCents ?? 0) <= budgetCents,
    );
    if (eligible.length === 0) return null;
    return eligible.reduce((best, r) =>
      r.driveTimeMinutes < best.driveTimeMinutes ? r : best,
    );
  }, [allRoutes, budgetCents]);

  // No 407 candidates with a toll → slider has no meaningful range.
  if (maxCents <= 0 || allRoutes.length === 0) return null;

  const pickTollCents = pick?.toll?.totalCents ?? 0;
  const pickLevel = pick
    ? trafficLevel(pick.driveTimeMinutes, pick.staticDurationMinutes)
    : "unknown";
  const pickTimeColor = trafficColor(pickLevel);
  const pickTimeSaved = pick ? noTollMinutes - pick.driveTimeMinutes : 0;
  const pickMapsUrl = pick && origin && destination
    ? googleMapsUrl(pick, origin, destination)
    : null;

  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-amex-text-mute">
          Pick By Budget
        </p>
        <p className="text-[10px] uppercase tracking-[0.16em] text-amex-text-faint">
          Max toll{" "}
          <span className="font-semibold tabular-nums text-amex-gold">
            {formatDollars(budgetCents)}
          </span>
        </p>
      </div>

      <input
        type="range"
        min={0}
        max={maxCents}
        step={BUDGET_STEP_CENTS}
        value={budgetCents}
        onChange={(e) => setBudgetCents(Number(e.target.value))}
        aria-label="Maximum toll budget"
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-none bg-amex-line accent-amex-gold focus:outline-none focus-visible:ring-1 focus-visible:ring-amex-gold"
      />
      <div className="mt-1 flex justify-between text-[10px] uppercase tracking-[0.16em] text-amex-text-faint">
        <span>$0</span>
        <span>{formatDollars(maxCents)}</span>
      </div>

      {pick ? (
        <div className="mt-4 border-t border-amex-line pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold uppercase tracking-[0.12em] text-sm text-amex-text">
              {routeKindLabel(pick)}
            </span>
            <Badge variant="warning">Your Pick</Badge>
          </div>

          {pick.kind === "partial_407" && pick.onRamp && pick.offRamp && (
            <div className="mt-1 space-y-0.5 text-[10px] uppercase tracking-[0.14em] text-amex-text-mute">
              <p><span className="text-amex-text-faint">Enter</span> {pick.onRamp.name}</p>
              <p><span className="text-amex-text-faint">Exit</span> {pick.offRamp.name}</p>
            </div>
          )}
          {pick.kind === "full_407" && pick.onRamp && pick.offRamp && (
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-amex-text-mute">
              {pick.onRamp.name} → {pick.offRamp.name}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-amex-text-faint">Time</p>
              <p className={`font-semibold tabular-nums ${pickTimeColor}`}>
                {formatMinutes(pick.driveTimeMinutes)}
                {noTollMinutes > 0 && pickTimeSaved !== 0 && (
                  <span className={`ml-2 text-[11px] tabular-nums ${
                    pickTimeSaved > 0
                      ? noTollIsHeavy ? "text-amex-emerald" : "text-amex-text-mute"
                      : "text-amex-text-mute"
                  }`}>
                    {pickTimeSaved > 0
                      ? `−${formatMinutes(pickTimeSaved)}`
                      : `+${formatMinutes(-pickTimeSaved)}`}
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-amex-text-faint">Cost</p>
              <p className="font-semibold tabular-nums text-amex-text">
                {formatDollars(pickTollCents)}
              </p>
            </div>
            {pickMapsUrl && (
              <a
                href={pickMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-amex-gold hover:text-amex-gold-hi"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
                </svg>
                Maps
              </a>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-3 border-t border-amex-line pt-3 text-xs text-amex-text-mute">
          No route fits this budget. Raise the slider to see options.
        </p>
      )}
    </Card>
  );
}

"use client";

import type { LatLng, RankedRoute } from "@407-tolls/core";
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
  if (level === "light") return "text-green-600";
  if (level === "moderate") return "text-amber-500";
  if (level === "heavy") return "text-red-500";
  return "text-slate-900";
}

function routeKindLabel(r: RankedRoute): string {
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
      return { label: "Most Optimal", variant: "warning" as const };
    case "second_best_value":
      return { label: "2nd Most Optimal", variant: "warning" as const };
  }
}

function llStr(p: LatLng): string {
  return `${p.lat},${p.lng}`;
}

function googleMapsUrl(r: RankedRoute, origin: LatLng, destination: LatLng): string {
  const params = new URLSearchParams({
    api: "1",
    origin: llStr(origin),
    destination: llStr(destination),
    travelmode: "driving",
  });
  if (r.kind === "no_407") {
    params.set("avoid", "tolls");
  } else if (r.onRamp && r.offRamp) {
    params.set("waypoints", `${llStr(r.onRamp.location)}|${llStr(r.offRamp.location)}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function RouteCards({
  routes,
  selectedId,
  onSelect,
  origin,
  destination,
}: {
  routes: RankedRoute[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  origin: LatLng | null;
  destination: LatLng | null;
}) {
  if (routes.length === 0) {
    return (
      <Card className="flex h-full items-center justify-center p-12">
        <div className="text-center">
          <p className="text-sm font-medium text-slate-500">No routes yet</p>
          <p className="mt-1 text-xs text-slate-400">Pick origin and destination to see options</p>
        </div>
      </Card>
    );
  }

  const cheapestCents = Math.min(...routes.map((r) => r.toll?.totalCents ?? 0));

  const noTollRoute = routes.find((r) => r.kind === "no_407");
  const noTollLevel = noTollRoute
    ? trafficLevel(noTollRoute.driveTimeMinutes, noTollRoute.staticDurationMinutes)
    : "unknown";
  const noTollIsHeavy = noTollLevel === "heavy";
  const noTollMinutes = noTollRoute?.driveTimeMinutes ?? 0;

  return (
    <div className="space-y-3">
      {noTollIsHeavy && (
        <div className="flex items-start gap-2.5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-orange-800">Heavy traffic on the no-toll route</p>
            <p className="mt-0.5 text-xs text-orange-700">
              Taking a 407 segment can save significant time right now.
            </p>
          </div>
        </div>
      )}

      {routes.map((r) => {
        const isSelected = r.id === selectedId;
        const tollCents = r.toll?.totalCents ?? 0;
        const mapsUrl = origin && destination ? googleMapsUrl(r, origin, destination) : null;
        const level = trafficLevel(r.driveTimeMinutes, r.staticDurationMinutes);
        const timeColor = trafficColor(level);

        const costDeltaCents = tollCents - cheapestCents;
        const timeSavedVsNoToll = noTollMinutes - r.driveTimeMinutes;

        // "Avoids traffic": no-toll is heavy, this 407 route is noticeably lighter
        const avoidsTraffic =
          r.kind !== "no_407" &&
          noTollIsHeavy &&
          (level === "light" || level === "moderate") &&
          timeSavedVsNoToll > 5;

        return (
          <div
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
            className={`
              w-full cursor-pointer rounded-xl border bg-white p-4 text-left transition-all
              ${isSelected
                ? "border-blue-400 shadow-md ring-2 ring-blue-100"
                : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
              }
            `}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {routeKindLabel(r)}
                  </span>
                  {r.badges.map((b) => {
                    const { label, variant } = badgeProps(b);
                    return <Badge key={b} variant={variant}>{label}</Badge>;
                  })}
                  {avoidsTraffic && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      Avoids traffic
                    </span>
                  )}
                </div>
                {r.onRamp && r.offRamp && (
                  <p className="mt-1 text-xs text-slate-500">
                    {r.onRamp.name} → {r.offRamp.name}
                  </p>
                )}
                {r.kind === "no_407" && (
                  <p className="mt-1 text-xs text-slate-500">Avoid all tolls</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-slate-900">
                  {formatDollars(tollCents)}
                </div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">
                  {costDeltaCents > 0
                    ? <span className="text-slate-500">+{formatDollars(costDeltaCents)} vs cheapest</span>
                    : "toll"}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <div>
                  <span className={`font-semibold ${timeColor}`}>{formatMinutes(r.driveTimeMinutes)}</span>
                  {r.kind !== "no_407" && noTollMinutes > 0 && timeSavedVsNoToll > 0 && (
                    <span className={`ml-1 ${noTollIsHeavy ? "font-medium text-green-600" : "text-slate-400"}`}>
                      {noTollIsHeavy
                        ? `saves ${formatMinutes(timeSavedVsNoToll)} vs no-toll`
                        : `−${formatMinutes(timeSavedVsNoToll)} vs no-toll`}
                    </span>
                  )}
                  {r.kind !== "no_407" && noTollMinutes > 0 && timeSavedVsNoToll <= 0 && (
                    <span className="ml-1 text-slate-400">
                      +{formatMinutes(-timeSavedVsNoToll)} vs no-toll
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">{r.distanceKm.toFixed(1)}</span> km
                </div>
              </div>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="
                    inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white
                    px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm
                    transition-colors hover:border-slate-300 hover:bg-slate-50
                  "
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
                  </svg>
                  Open in Google Maps
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

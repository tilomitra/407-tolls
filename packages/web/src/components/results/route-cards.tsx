"use client";

import type { LatLng, RankedRoute } from "@407-tolls/core";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { formatDollars } from "@/lib/format";

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
      return { label: "Best value", variant: "warning" as const };
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

  return (
    <div className="space-y-3">
      {routes.map((r) => {
        const isSelected = r.id === selectedId;
        const tollCents = r.toll?.totalCents ?? 0;
        const mapsUrl = origin && destination ? googleMapsUrl(r, origin, destination) : null;
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
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {routeKindLabel(r)}
                  </span>
                  {r.badges.map((b) => {
                    const { label, variant } = badgeProps(b);
                    return (
                      <Badge key={b} variant={variant}>{label}</Badge>
                    );
                  })}
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
                <div className="text-[11px] uppercase tracking-wide text-slate-400">toll</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <div>
                  <span className="font-semibold text-slate-900">{r.driveTimeMinutes}</span> min
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

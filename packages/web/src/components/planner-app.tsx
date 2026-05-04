"use client";

import { useMemo, useState } from "react";
import type { TollPoint, Interchange, LatLng, PlannerResult } from "@407-tolls/core";
import { HighwayMap, type RoutePolyline } from "./map/highway-map";
import { ZoneLegend } from "./map/zone-legend";
import { PlannerForm, type PlannerFormValues } from "./form/planner-form";
import { RouteCards } from "./results/route-cards";
import { Card } from "./ui/card";
import { decodePolyline } from "@/lib/polyline";

export function PlannerApp({
  gantries,
  interchanges,
  highwayGeometry,
}: {
  gantries: TollPoint[];
  interchanges: Interchange[];
  highwayGeometry: Array<[number, number]>;
}) {
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [endpoints, setEndpoints] = useState<{
    origin: [number, number];
    destination: [number, number];
  } | null>(null);
  const [coords, setCoords] = useState<{ origin: LatLng; destination: LatLng } | null>(null);

  async function handleSubmit(values: PlannerFormValues) {
    setLoading(true);
    setError(null);
    setEndpoints({
      origin: [values.origin.lng, values.origin.lat],
      destination: [values.destination.lng, values.destination.lat],
    });
    setCoords({
      origin: { lat: values.origin.lat, lng: values.origin.lng },
      destination: { lat: values.destination.lat, lng: values.destination.lng },
    });
    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleClassId: values.vehicleClassId,
          origin: { lat: values.origin.lat, lng: values.origin.lng },
          destination: { lat: values.destination.lat, lng: values.destination.lng },
          timeSlot: values.timeSlot,
          hasTransponder: values.hasTransponder,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `Request failed: ${res.status}`);
      }
      const data = (await res.json()) as PlannerResult;
      setResult(data);
      setSelectedId(data.routes[0]?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const polylines: RoutePolyline[] = useMemo(() => {
    if (!result) return [];
    return result.routes
      .map((r) => ({ id: r.id, coordinates: decodePolyline(r.polyline) }))
      .filter((p) => p.coordinates.length >= 2);
  }, [result]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-1">
          <HighwayMap
            gantries={gantries}
            interchanges={interchanges}
            highwayGeometry={highwayGeometry}
            selectedRoute={null}
            routePolylines={polylines}
            selectedRouteId={selectedId}
            onRouteSelect={setSelectedId}
            endpointMarkers={endpoints}
          />
        </div>
        <div className="px-5 py-3">
          <ZoneLegend />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <PlannerForm onSubmit={handleSubmit} loading={loading} />
          {error && (
            <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
        <div className="lg:col-span-3">
          {result ? (
            <RouteCards
              routes={result.routes}
              selectedId={selectedId}
              onSelect={setSelectedId}
              origin={coords?.origin ?? null}
              destination={coords?.destination ?? null}
            />
          ) : (
            <Card className="flex h-full items-center justify-center p-12">
              <div className="text-center">
                <p className="text-sm font-medium text-slate-500">
                  Plan your trip
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Enter origin and destination to compare 407 vs. no-toll routes
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}


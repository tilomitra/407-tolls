"use client";

import { useRef, useState } from "react";
import type { LatLng, PlannerResult } from "@407-tolls/core";
import { PlannerForm, type PlannerFormValues } from "./form/planner-form";
import { RouteCards } from "./results/route-cards";
import { Card } from "./ui/card";

export function PlannerApp() {
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ origin: LatLng; destination: LatLng } | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(values: PlannerFormValues) {
    setLoading(true);
    setError(null);
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
      if (window.innerWidth < 1024) {
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <PlannerForm onSubmit={handleSubmit} loading={loading} />
        {error && (
          <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
      <div ref={resultsRef} className="lg:col-span-3">
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
              <p className="text-sm font-medium text-slate-500">Plan your trip</p>
              <p className="mt-1 text-xs text-slate-400">
                Enter origin and destination to compare 407 vs. no-toll routes
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

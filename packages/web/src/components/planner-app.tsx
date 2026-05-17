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
          <div className="mt-3 rounded-2xl border border-[color:var(--color-ab-ruby)]/30 bg-ab-ruby-deep px-4 py-3 text-sm text-ab-ruby">
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
            <div className="max-w-sm text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ab-gold-mist">
                <svg className="h-7 w-7 text-ab-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                  <path d="M17.657 16.657L13.414 20.9a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-ab-text">
                Compare your routes
              </h3>
              <p className="mt-2 text-sm text-ab-text-dim">
                Enter an origin and destination to see toll, time, and distance for every route option.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

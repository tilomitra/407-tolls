"use client";

import { useEffect, useRef, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { TollPoint, Interchange } from "@407-etr/core";
import { PolylineSpatialIndex } from "@407-etr/core";
import { zoneColors, FREE_DOT_COLOR } from "@/lib/design/tokens";

function getZoneColor(zone: number): string {
  return zoneColors[zone as keyof typeof zoneColors]?.dot ?? "#94a3b8";
}

export function HighwayMap({
  tollPoints,
  interchanges,
  highwayGeometry,
  selectedRoute,
}: {
  tollPoints: TollPoint[];
  interchanges: Interchange[];
  highwayGeometry: Array<[number, number]>;
  selectedRoute: { entryId: string; exitId: string } | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const selectedRouteRef = useRef(selectedRoute);
  selectedRouteRef.current = selectedRoute;

  const spatialIndex = useMemo(
    () => highwayGeometry.length > 0 ? new PolylineSpatialIndex(highwayGeometry) : null,
    [highwayGeometry],
  );

  const updateRouteRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [-79.5, 43.7],
      zoom: 9,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      // Highway base line
      if (highwayGeometry.length > 0) {
        map.addSource("highway-line", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "LineString", coordinates: highwayGeometry },
            properties: {},
          },
        });
        map.addLayer({
          id: "highway-line",
          type: "line",
          source: "highway-line",
          paint: { "line-color": "#cbd5e1", "line-width": 3, "line-opacity": 0.6 },
        });
      }

      // Selected route source (updated dynamically)
      map.addSource("selected-route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "selected-route-outline",
        type: "line",
        source: "selected-route",
        paint: { "line-color": "#1e293b", "line-width": 7, "line-opacity": 0.2 },
      });
      map.addLayer({
        id: "selected-route-line",
        type: "line",
        source: "selected-route",
        paint: { "line-color": "#3b82f6", "line-width": 4 },
      });

      // Route markers (A/B)
      map.addSource("route-markers", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "route-markers",
        type: "circle",
        source: "route-markers",
        paint: {
          "circle-radius": 10,
          "circle-color": "#1e293b",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
        },
      });
      map.addLayer({
        id: "route-markers-labels",
        type: "symbol",
        source: "route-markers",
        layout: {
          "text-field": ["get", "label"],
          "text-size": 12,
          "text-allow-overlap": true,
        },
        paint: { "text-color": "#ffffff" },
      });

      // Gantry dots
      map.addSource("gantries", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: tollPoints.map((p) => ({
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: [p.location.lng, p.location.lat] },
            properties: { color: p.isFree ? FREE_DOT_COLOR : getZoneColor(p.zone) },
          })),
        },
      });
      map.addLayer({
        id: "gantries",
        type: "circle",
        source: "gantries",
        paint: { "circle-radius": 2.5, "circle-color": ["get", "color"], "circle-opacity": 0.4 },
      });

      // Interchange dots
      map.addSource("interchanges", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: interchanges.map((ic) => ({
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: [ic.location.lng, ic.location.lat] },
            properties: { id: ic.id, name: ic.name, zone: ic.zone, color: ic.isFree ? FREE_DOT_COLOR : getZoneColor(ic.zone) },
          })),
        },
      });
      map.addLayer({
        id: "interchanges-dots",
        type: "circle",
        source: "interchanges",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 4, 12, 7],
          "circle-color": ["get", "color"],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 8, 1, 12, 2],
        },
      });

      // Interchange labels (on zoom)
      map.addLayer({
        id: "interchanges-labels",
        type: "symbol",
        source: "interchanges",
        layout: {
          "text-field": ["get", "name"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 13, 12],
          "text-offset": [0, 1.4],
          "text-anchor": "top",
          "text-optional": true,
          "text-max-width": 8,
        },
        paint: { "text-color": "#334155", "text-halo-color": "#ffffff", "text-halo-width": 1.5 },
        minzoom: 10.5,
      });

      // Hover popup
      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });
      map.on("mouseenter", "interchanges-dots", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const f = e.features?.[0];
        if (!f || f.geometry.type !== "Point") return;
        popup
          .setLngLat(f.geometry.coordinates.slice() as [number, number])
          .setHTML(`<div style="font-size:13px;font-weight:500">${f.properties.name}</div><div style="font-size:11px;color:#64748b">Zone ${f.properties.zone}</div>`)
          .addTo(map);
      });
      map.on("mouseleave", "interchanges-dots", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });

      // Define the updateRoute function now that sources exist
      updateRouteRef.current = () => {
        const route = selectedRouteRef.current;
        const routeSource = map.getSource("selected-route") as maplibregl.GeoJSONSource;
        const markerSource = map.getSource("route-markers") as maplibregl.GeoJSONSource;

        if (!route) {
          routeSource.setData({ type: "FeatureCollection", features: [] });
          markerSource.setData({ type: "FeatureCollection", features: [] });
          return;
        }

        const entry = interchanges.find((ic) => ic.id === route.entryId);
        const exit = interchanges.find((ic) => ic.id === route.exitId);
        if (!entry || !exit) return;

        const entryCoord: [number, number] = [entry.location.lng, entry.location.lat];
        const exitCoord: [number, number] = [exit.location.lng, exit.location.lat];

        const entryIdx = spatialIndex ? spatialIndex.findNearest(entryCoord) : 0;
        const exitIdx = spatialIndex ? spatialIndex.findNearest(exitCoord) : 0;
        const startIdx = Math.min(entryIdx, exitIdx);
        const endIdx = Math.max(entryIdx, exitIdx);
        const segment = highwayGeometry.slice(startIdx, endIdx + 1);

        if (segment.length >= 2) {
          routeSource.setData({
            type: "Feature",
            geometry: { type: "LineString", coordinates: segment },
            properties: {},
          });
        }

        markerSource.setData({
          type: "FeatureCollection",
          features: [
            { type: "Feature", geometry: { type: "Point", coordinates: entryCoord }, properties: { label: "A" } },
            { type: "Feature", geometry: { type: "Point", coordinates: exitCoord }, properties: { label: "B" } },
          ],
        });

        const lngs = segment.map((p) => p[0]);
        const lats = segment.map((p) => p[1]);
        if (lngs.length > 0) {
          map.fitBounds(
            [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
            { padding: 80, duration: 800 },
          );
        }
      };

      // Run it immediately in case selectedRoute was set before map loaded
      updateRouteRef.current();
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; updateRouteRef.current = null; };
  }, [tollPoints, interchanges, highwayGeometry]);

  // When selectedRoute changes, call updateRoute
  useEffect(() => {
    updateRouteRef.current?.();
  }, [selectedRoute]);

  return (
    <div ref={containerRef} className="h-[350px] w-full rounded-t-xl sm:h-[400px]" />
  );
}

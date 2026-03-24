"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { TollPoint, Interchange } from "@407-tolls/core";
import { PolylineSpatialIndex } from "@407-tolls/core";
import { zoneColors, FREE_DOT_COLOR } from "@/lib/design/tokens";

function getZoneColor(zone: number): string {
  return zoneColors[zone as keyof typeof zoneColors]?.dot ?? "#94a3b8";
}

function getAccessLabel(ic: Interchange): string {
  const eb = ic.eastbound.hasOnRamp || ic.eastbound.hasOffRamp;
  const wb = ic.westbound.hasOnRamp || ic.westbound.hasOffRamp;
  if (eb && wb) return "";
  if (eb) return "Eastbound only";
  if (wb) return "Westbound only";
  return "";
}

export function HighwayMap({
  gantries,
  interchanges,
  highwayGeometry,
  selectedRoute,
  onInterchangeClick,
  entryId,
  exitId,
}: {
  gantries: TollPoint[];
  interchanges: Interchange[];
  highwayGeometry: Array<[number, number]>;
  selectedRoute: { entryId: string; exitId: string } | null;
  onInterchangeClick?: (interchangeId: string) => void;
  entryId?: string;
  exitId?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const onClickRef = useRef(onInterchangeClick);
  onClickRef.current = onInterchangeClick;
  const updateHighlightRef = useRef<((entry?: string, exit?: string) => void) | null>(null);

  const spatialIndex = useMemo(
    () => highwayGeometry.length > 0 ? new PolylineSpatialIndex(highwayGeometry) : null,
    [highwayGeometry],
  );

  const updateRouteRef = useRef<((route: { entryId: string; exitId: string } | null) => void) | null>(null);

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
        paint: { "line-color": "#1e293b", "line-width": 7, "line-opacity": 0.15 },
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
          features: gantries.map((p) => ({
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

      // Classify interchanges for rendering
      const icFeatures = interchanges.map((ic) => {
        const eb = ic.eastbound.hasOnRamp || ic.eastbound.hasOffRamp;
        const wb = ic.westbound.hasOnRamp || ic.westbound.hasOffRamp;
        const access = eb && wb ? "full" : eb ? "eb-only" : wb ? "wb-only" : "none";
        const accessLabel = getAccessLabel(ic);

        return {
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [ic.location.lng, ic.location.lat] },
          properties: {
            id: ic.id,
            name: ic.name,
            zone: ic.zone,
            color: ic.isFree ? FREE_DOT_COLOR : getZoneColor(ic.zone),
            access,
            accessLabel,
            note: ic.note ?? "",
          },
        };
      });

      map.addSource("interchanges", {
        type: "geojson",
        data: { type: "FeatureCollection", features: icFeatures },
      });

      // Full interchanges: solid circle
      map.addLayer({
        id: "interchanges-dots",
        type: "circle",
        source: "interchanges",
        filter: ["==", ["get", "access"], "full"],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 4, 12, 7],
          "circle-color": ["get", "color"],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 8, 1, 12, 2],
        },
      });

      // Partial interchanges (EB-only or WB-only): smaller dot with dashed ring
      map.addLayer({
        id: "interchanges-partial-outer",
        type: "circle",
        source: "interchanges",
        filter: ["any", ["==", ["get", "access"], "eb-only"], ["==", ["get", "access"], "wb-only"]],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 5, 12, 9],
          "circle-color": "transparent",
          "circle-stroke-color": ["get", "color"],
          "circle-stroke-width": 1.5,
          "circle-stroke-opacity": 0.5,
        },
      });
      map.addLayer({
        id: "interchanges-partial-inner",
        type: "circle",
        source: "interchanges",
        filter: ["any", ["==", ["get", "access"], "eb-only"], ["==", ["get", "access"], "wb-only"]],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 3, 12, 5],
          "circle-color": ["get", "color"],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1,
        },
      });

      // Direction arrows for partial interchanges (show at higher zoom)
      map.addLayer({
        id: "interchanges-direction-labels",
        type: "symbol",
        source: "interchanges",
        filter: ["any", ["==", ["get", "access"], "eb-only"], ["==", ["get", "access"], "wb-only"]],
        layout: {
          "text-field": ["case",
            ["==", ["get", "access"], "eb-only"], "→",
            ["==", ["get", "access"], "wb-only"], "←",
            "",
          ],
          "text-size": 14,
          "text-offset": [1.2, 0],
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": ["get", "color"],
          "text-opacity": 0.7,
        },
        minzoom: 10,
      });

      // Interchange name labels (on zoom)
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

      // Hover popup with access info
      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });

      function showPopup(e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) {
        map.getCanvas().style.cursor = "pointer";
        const f = e.features?.[0];
        if (!f || f.geometry.type !== "Point") return;
        const note = f.properties.note;
        const noteHtml = note
          ? `<div style="font-size:10px;color:#f59e0b;font-weight:500;margin-top:2px">${note}</div>`
          : "";
        const clickHint = onClickRef.current
          ? `<div style="font-size:10px;color:#3b82f6;margin-top:3px">Click to select</div>`
          : "";
        popup
          .setLngLat(f.geometry.coordinates.slice() as [number, number])
          .setHTML(
            `<div style="font-size:13px;font-weight:500">${f.properties.name}</div>` +
            `<div style="font-size:11px;color:#64748b">Zone ${f.properties.zone}</div>` +
            noteHtml +
            clickHint,
          )
          .addTo(map);
      }

      function hidePopup() {
        map.getCanvas().style.cursor = "";
        popup.remove();
      }

      // Attach hover and click to all interchange layers
      const icLayers = ["interchanges-dots", "interchanges-partial-inner"];
      for (const layerId of icLayers) {
        map.on("mouseenter", layerId, showPopup);
        map.on("mouseleave", layerId, hidePopup);
        map.on("click", layerId, (e) => {
          const id = e.features?.[0]?.properties.id;
          if (id && onClickRef.current) onClickRef.current(id);
        });
      }

      // Entry/exit selection markers (green A, red B)
      map.addSource("selection-markers", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "selection-markers-ring",
        type: "circle",
        source: "selection-markers",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 10, 12, 14],
          "circle-color": ["get", "color"],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
        },
      });
      map.addLayer({
        id: "selection-markers-labels",
        type: "symbol",
        source: "selection-markers",
        layout: {
          "text-field": ["get", "label"],
          "text-size": 12,
          "text-font": ["Open Sans Bold"],
          "text-allow-overlap": true,
        },
        paint: { "text-color": "#ffffff" },
      });

      updateHighlightRef.current = (entry?: string, exit?: string) => {
        const src = map.getSource("selection-markers") as maplibregl.GeoJSONSource;
        const features: GeoJSON.Feature[] = [];
        if (entry) {
          const ic = interchanges.find((i) => i.id === entry);
          if (ic) {
            features.push({
              type: "Feature",
              geometry: { type: "Point", coordinates: [ic.location.lng, ic.location.lat] },
              properties: { label: "A", color: "#16a34a" },
            });
          }
        }
        if (exit) {
          const ic = interchanges.find((i) => i.id === exit);
          if (ic) {
            features.push({
              type: "Feature",
              geometry: { type: "Point", coordinates: [ic.location.lng, ic.location.lat] },
              properties: { label: "B", color: "#dc2626" },
            });
          }
        }
        src.setData({ type: "FeatureCollection", features });
      };

      // Draws the blue route line and A/B markers on the map.
      // Called by useEffect whenever selectedRoute changes.
      updateRouteRef.current = (route) => {
        const routeSource = map.getSource("selected-route") as maplibregl.GeoJSONSource;
        const markerSource = map.getSource("route-markers") as maplibregl.GeoJSONSource;

        // No route selected — clear the line and markers
        if (!route) {
          routeSource.setData({ type: "FeatureCollection", features: [] });
          markerSource.setData({ type: "FeatureCollection", features: [] });
          return;
        }

        // Look up the two interchanges by ID
        const entry = interchanges.find((ic) => ic.id === route.entryId);
        const exit = interchanges.find((ic) => ic.id === route.exitId);
        if (!entry || !exit) return;

        const entryCoord: [number, number] = [entry.location.lng, entry.location.lat];
        const exitCoord: [number, number] = [exit.location.lng, exit.location.lat];

        // Find the closest points on the highway polyline to snap the route to the road.
        // spatialIndex lets us find the nearest point without looping through every coordinate.
        const entryIdx = spatialIndex ? spatialIndex.findNearest(entryCoord) : 0;
        const exitIdx = spatialIndex ? spatialIndex.findNearest(exitCoord) : 0;

        // Extract the highway segment between entry and exit
        const startIdx = Math.min(entryIdx, exitIdx);
        const endIdx = Math.max(entryIdx, exitIdx);
        const segment = highwayGeometry.slice(startIdx, endIdx + 1);

        // Draw the blue route line along the highway
        if (segment.length >= 2) {
          routeSource.setData({
            type: "Feature",
            geometry: { type: "LineString", coordinates: segment },
            properties: {},
          });
        }

        // Place A and B markers at entry and exit
        markerSource.setData({
          type: "FeatureCollection",
          features: [
            { type: "Feature", geometry: { type: "Point", coordinates: entryCoord }, properties: { label: "A" } },
            { type: "Feature", geometry: { type: "Point", coordinates: exitCoord }, properties: { label: "B" } },
          ],
        });

        // Zoom the map to fit the route with padding
        const lngs = segment.map((p) => p[0]);
        const lats = segment.map((p) => p[1]);
        if (lngs.length > 0) {
          map.fitBounds(
            [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
            { padding: 80, duration: 800 },
          );
        }
      };

      setMapReady(true);
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; updateRouteRef.current = null; };
  }, [gantries, interchanges, highwayGeometry]);

  useEffect(() => {
    if (mapReady) updateRouteRef.current?.(selectedRoute);
  }, [selectedRoute, mapReady]);

  useEffect(() => {
    if (mapReady) updateHighlightRef.current?.(entryId, exitId);
  }, [entryId, exitId, mapReady]);

  return (
    <div ref={containerRef} className="h-[280px] w-full rounded-t-xl sm:h-[320px]" />
  );
}

"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { LatestLocation, ShuttleRoute } from "@/lib/shuttle";

// Leaflet draws SVG attributes, so CSS tokens cannot be used here; named colors keep UI-01 (no raw hex).
const ROUTE_COLORS = ["royalblue", "seagreen", "darkorange", "darkviolet", "crimson"];

type Props = { routes: ShuttleRoute[]; latest: LatestLocation[] };

/** Leaflet map (plain leaflet, no react-leaflet — see tech-stack.md 1.4.2). */
export function ShuttleMap({ routes, latest }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;
      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current).setView([18.8925, 99.002], 15);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(mapRef.current);
        layerRef.current = L.layerGroup().addTo(mapRef.current);
      }
      const layer = layerRef.current!;
      layer.clearLayers();
      routes.forEach((route, index) => {
        const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
        const points = route.stops.map((stop) => [stop.latitude, stop.longitude] as [number, number]);
        if (points.length > 1) L.polyline(points, { color, weight: 4, opacity: 0.6 }).addTo(layer);
        route.stops.forEach((stop) =>
          L.circleMarker([stop.latitude, stop.longitude], { radius: 6, color, fillOpacity: 0.9 })
            .bindPopup(`${stop.name}<br/>${route.name}`)
            .addTo(layer),
        );
        const bus = latest.find((item) => item.routeId === route.id)?.location;
        if (bus) {
          L.marker([bus.latitude, bus.longitude], {
            icon: L.divIcon({
              html: '<span class="block h-5 w-5 rounded-full border-2 border-white bg-blue-700 shadow"></span>',
              className: "",
              iconSize: [20, 20],
            }),
          })
            .bindPopup(`รถ ${route.name}${bus.currentStop ? `<br/>ที่ ${bus.currentStop.name}` : ""}`)
            .addTo(layer);
        }
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [routes, latest]);

  useEffect(
    () => () => {
      mapRef.current?.remove();
      mapRef.current = null;
    },
    [],
  );

  return <div ref={containerRef} className="h-80 w-full rounded-xl border border-gray-200 z-0" />;
}

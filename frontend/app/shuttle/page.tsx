"use client";

import { useCallback, useEffect, useState } from "react";
import { clientFetch } from "@/lib/client-fetch";
import {
  PASSENGER_LABEL,
  POLL_INTERVAL_MS,
  timeAgo,
  type LatestLocation,
  type ShuttleRoute,
} from "@/lib/shuttle";
import { ShuttleMap } from "@/components/shuttle/shuttle-map";

export default function ShuttlePage() {
  const [routes, setRoutes] = useState<ShuttleRoute[]>([]);
  const [latest, setLatest] = useState<LatestLocation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLatest = useCallback(async () => {
    const result = await clientFetch<LatestLocation[]>("/api/v1/bus-locations/latest");
    if (result.ok) setLatest(result.data);
  }, []);

  useEffect(() => {
    (async () => {
      const result = await clientFetch<ShuttleRoute[]>("/api/v1/shuttle-routes?limit=100&isActive=true");
      if (result.ok) setRoutes(result.data);
      else if (result.status !== 401) setError(result.message);
      await loadLatest();
      setLoading(false);
    })();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadLatest();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [loadLatest]);

  if (loading) return <p className="p-8 text-gray-500">กำลังโหลดข้อมูลรถรับส่ง...</p>;
  if (error) return <p className="p-8 text-red-600">โหลดข้อมูลไม่สำเร็จ: {error}</p>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">ตารางและตำแหน่งรถรับส่ง</h1>
        <p className="text-sm text-gray-600">
          ตำแหน่งรถอัปเดตอัตโนมัติทุก {POLL_INTERVAL_MS / 1000} วินาที
        </p>
      </header>

      <ShuttleMap routes={routes} latest={latest} />

      {routes.length === 0 && <p className="text-gray-500">ยังไม่มีเส้นทางที่เปิดให้บริการ</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {routes.map((route) => {
          const bus = latest.find((item) => item.routeId === route.id)?.location ?? null;
          return (
            <section key={route.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="font-semibold text-gray-900">{route.name}</h2>
              {route.departureTimes.length > 0 && (
                <p className="mt-1 text-sm text-gray-600">รอบรถ: {route.departureTimes.join(" · ")}</p>
              )}
              <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm">
                {bus ? (
                  <>
                    <p className="font-medium text-blue-900">
                      {bus.currentStop ? `อยู่ที่ ${bus.currentStop.name}` : "กำลังวิ่ง"}
                    </p>
                    <p className="text-blue-800">
                      ผู้โดยสาร: {PASSENGER_LABEL[bus.passengerLevel]} · อัปเดต {timeAgo(bus.reportedAt)}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-600">ยังไม่มีรายงานตำแหน่งรถของสายนี้</p>
                )}
              </div>
              <ol className="mt-3 space-y-1 text-sm">
                {route.stops.map((stop) => (
                  <li
                    key={stop.id}
                    className={
                      bus?.currentStop?.id === stop.id ? "font-semibold text-blue-700" : "text-gray-700"
                    }
                  >
                    {stop.sequence}. {stop.name}
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}

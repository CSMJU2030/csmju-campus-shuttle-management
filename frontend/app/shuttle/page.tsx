"use client";

import { useCallback, useEffect, useState } from "react";
import { clientFetch } from "@/lib/client-fetch";
import {
  PASSENGER_LABEL,
  POLL_INTERVAL_MS,
  SERVICE_STATUS_LABEL,
  isRider,
  timeAgo,
  type Announcement,
  type LatestLocation,
  type Me,
  type ShuttleRoute,
  type WaitingSummary,
} from "@/lib/shuttle";
import { ShuttleMap } from "@/components/shuttle/shuttle-map";
import { LostBoard, ProblemForm, ReviewForm } from "@/components/shuttle/rider-tools";

type MyRequest = { id: string; stopId: string; routeId: string } | null;

const TABS = [
  { key: "quick", label: "แผงด่วน" },
  { key: "track", label: "ติดตามรถ" },
  { key: "schedule", label: "ตารางเดินรถ" },
  { key: "problem", label: "แจ้งปัญหา" },
  { key: "lost", label: "ของหาย" },
  { key: "review", label: "ประเมิน" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function ShuttlePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [routes, setRoutes] = useState<ShuttleRoute[]>([]);
  const [latest, setLatest] = useState<LatestLocation[]>([]);
  const [waiting, setWaiting] = useState<WaitingSummary[]>([]);
  const [news, setNews] = useState<Announcement[]>([]);
  const [myRequest, setMyRequest] = useState<MyRequest>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("track");
  const [quickStop, setQuickStop] = useState("");

  const refresh = useCallback(async (rider: boolean) => {
    const [loc, wait, ann] = await Promise.all([
      clientFetch<LatestLocation[]>("/api/v1/bus-locations/latest"),
      clientFetch<WaitingSummary[]>("/api/v1/ride-requests/summary"),
      clientFetch<Announcement[]>("/api/v1/announcements?limit=3"),
    ]);
    if (loc.ok) setLatest(loc.data);
    if (wait.ok) setWaiting(wait.data);
    if (ann.ok) setNews(ann.data);
    if (rider) {
      const mine = await clientFetch<MyRequest>("/api/v1/ride-requests/mine");
      if (mine.ok) setMyRequest(mine.data);
    }
  }, []);

  useEffect(() => {
    let rider = false;
    (async () => {
      const [meRes, routeRes] = await Promise.all([
        clientFetch<Me>("/api/v1/me"),
        clientFetch<ShuttleRoute[]>("/api/v1/shuttle-routes?limit=100&isActive=true"),
      ]);
      if (meRes.ok) {
        setMe(meRes.data);
        rider = isRider(meRes.data.subsystemRole);
      }
      if (routeRes.ok) setRoutes(routeRes.data);
      else if (routeRes.status !== 401) setError(routeRes.message);
      await refresh(rider);
      setLoading(false);
    })();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh(rider);
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function callBus(routeId: string, stopId: string) {
    const result = await clientFetch<MyRequest>("/api/v1/ride-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routeId, stopId }),
    });
    if (result.ok) {
      setMyRequest(result.data);
      void refresh(true);
    }
  }

  async function cancelBus() {
    if (!myRequest) return;
    const result = await clientFetch(`/api/v1/ride-requests/${myRequest.id}`, { method: "DELETE" });
    if (result.ok) {
      setMyRequest(null);
      void refresh(true);
    }
  }

  if (loading) return <p className="p-8 text-on-surface-variant">กำลังโหลดข้อมูลรถรับส่ง...</p>;
  if (error) return <p className="p-8 text-error">โหลดข้อมูลไม่สำเร็จ: {error}</p>;

  const rider = isRider(me?.subsystemRole);
  const waitingAt = (stopId: string) => waiting.find((item) => item.stopId === stopId)?.waiting ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-bold text-on-surface">ตารางและตำแหน่งรถรับส่ง</h1>
        <p className="text-sm text-on-surface-variant">ตำแหน่งรถอัปเดตอัตโนมัติทุก {POLL_INTERVAL_MS / 1000} วินาที</p>
      </header>

      {news.length > 0 && (
        <section className="space-y-1 rounded-xl border border-brand-amber bg-surface-container p-3">
          <p className="text-sm font-semibold text-on-surface">ประกาศล่าสุด</p>
          {news.map((item) => (
            <p key={item.id} className="text-sm text-on-surface">
              {item.route ? `[${item.route.name}] ` : ""}
              {item.message} <span className="text-brand-amber">· {timeAgo(item.createdAt)}</span>
            </p>
          ))}
        </section>
      )}

      {rider && myRequest && (
        <section className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-success bg-surface-container p-3">
          <p className="text-sm text-success">
            เรียกรถแล้วที่{" "}
            <b>
              {routes.flatMap((route) => route.stops).find((stop) => stop.id === myRequest.stopId)?.name ?? "ป้ายที่เลือก"}
            </b>{" "}
            — คนขับเห็นคำขอของคุณแล้ว
          </p>
          <button type="button" onClick={cancelBus} className="rounded-lg border border-success px-3 py-1 text-sm text-success">
            ยกเลิกการเรียกรถ
          </button>
        </section>
      )}

      {rider && (
        <nav className="flex flex-wrap gap-2 border-b border-outline-variant pb-3">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`rounded-lg px-3 py-1.5 text-sm ${tab === item.key ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-variant"}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}

      {rider && tab === "quick" && (
        <section className="space-y-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-on-surface">ระบุจุดขึ้นรถของคุณ</h2>
          <p className="text-sm text-on-surface-variant">เลือกป้ายที่ยืนรอ แล้วส่งสัญญาณเรียกรถให้คนขับเห็น</p>
          <select className="w-full rounded-lg border border-outline-variant p-2 text-sm" value={quickStop} onChange={(e) => setQuickStop(e.target.value)}>
            <option value="">— เลือกป้ายรถเมล์ —</option>
            {routes.map((route) => (
              <optgroup key={route.id} label={route.name}>
                {route.stops.map((stop) => (
                  <option key={stop.id} value={`${route.id}|${stop.id}`}>{stop.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            type="button"
            disabled={!quickStop}
            onClick={() => {
              const [routeId, stopId] = quickStop.split("|");
              void callBus(routeId, stopId);
            }}
            className="w-full rounded-lg bg-success py-3 text-on-primary disabled:opacity-50"
          >
            ส่งคำขอเรียกรถ (แจ้งคนขับว่าฉันรออยู่)
          </button>
        </section>
      )}

      {(!rider || tab === "track") && (
        <>
          <ShuttleMap routes={routes} latest={latest} />

          {routes.length === 0 && <p className="text-on-surface-variant">ยังไม่มีเส้นทางที่เปิดให้บริการ</p>}

          <div className="grid gap-4 md:grid-cols-2">
            {routes.map((route) => {
              const bus = latest.find((item) => item.routeId === route.id)?.location ?? null;
              return (
                <section key={route.id} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
                  <h2 className="font-semibold text-on-surface">{route.name}</h2>
                  {route.departureTimes.length > 0 && (
                    <p className="mt-1 text-sm text-on-surface-variant">รอบรถ: {route.departureTimes.join(" · ")}</p>
                  )}
                  <div className="mt-3 rounded-lg bg-surface-container p-3 text-sm">
                    {bus ? (
                      <>
                        <p className="font-medium text-primary">
                          {SERVICE_STATUS_LABEL[bus.serviceStatus]}
                          {bus.serviceStatus === "RUNNING" && bus.currentStop ? ` · อยู่ที่ ${bus.currentStop.name}` : ""}
                        </p>
                        <p className="text-primary">
                          ผู้โดยสาร: {bus.passengerCount ?? "-"} คน ({PASSENGER_LABEL[bus.passengerLevel]}) · อัปเดต{" "}
                          {timeAgo(bus.reportedAt)}
                        </p>
                      </>
                    ) : (
                      <p className="text-on-surface-variant">ยังไม่มีรายงานตำแหน่งรถของสายนี้</p>
                    )}
                  </div>
                  <ol className="mt-3 space-y-1 text-sm">
                    {route.stops.map((stop) => {
                      const count = waitingAt(stop.id);
                      const mine = myRequest?.stopId === stop.id;
                      return (
                        <li key={stop.id} className="flex items-center justify-between gap-2">
                          <span className={bus?.currentStop?.id === stop.id ? "font-semibold text-primary" : "text-on-surface-variant"}>
                            {stop.sequence}. {stop.name}
                            {count > 0 && <span className="ml-1 text-xs text-brand-amber">(รอ {count} คน)</span>}
                          </span>
                          {rider && !mine && (
                            <button
                              type="button"
                              onClick={() => callBus(route.id, stop.id)}
                              className="shrink-0 rounded-full border border-primary px-2 py-0.5 text-xs text-primary hover:bg-surface-variant"
                            >
                              ฉันรอที่ป้ายนี้
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </section>
              );
            })}
          </div>

        </>
      )}

      {rider && tab === "schedule" && (
        <section className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-primary text-on-primary">
              <tr>
                <th className="p-3">สายรถ</th>
                <th className="p-3">เวลาออกรอบ</th>
                <th className="p-3">สถานะปัจจุบัน</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => {
                const bus = latest.find((item) => item.routeId === route.id)?.location ?? null;
                return (
                  <tr key={route.id} className="border-t border-outline-variant">
                    <td className="p-3 font-medium text-on-surface">{route.name}</td>
                    <td className="p-3 text-on-surface-variant">{route.departureTimes.join(", ") || "-"}</td>
                    <td className="p-3 text-on-surface-variant">{bus ? SERVICE_STATUS_LABEL[bus.serviceStatus] : "ยังไม่ออกให้บริการ"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {rider && tab === "problem" && <ProblemForm routes={routes} />}
      {rider && tab === "lost" && <LostBoard />}
      {rider && tab === "review" && <ReviewForm routes={routes} />}

    </div>
  );
}

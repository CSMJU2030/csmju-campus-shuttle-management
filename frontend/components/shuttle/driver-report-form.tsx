"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clientFetch } from "@/lib/client-fetch";
import {
  PASSENGER_LABEL,
  POLL_INTERVAL_MS,
  SERVICE_STATUS_LABEL,
  nearestStop,
  type PassengerLevel,
  type ServiceStatus,
  type ShuttleRoute,
  type ShuttleStop,
  type WaitingSummary,
} from "@/lib/shuttle";

const box = "rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm space-y-3";
const input = "w-full rounded-lg border border-outline-variant p-2 text-sm";
const STATUSES: ServiceStatus[] = ["RUNNING", "BREAK", "OFF_DUTY"];

function levelFor(count: number): PassengerLevel {
  if (count >= 30) return "FULL";
  if (count >= 20) return "HIGH";
  if (count >= 10) return "MEDIUM";
  return "LOW";
}

export function DriverReportForm() {
  const [routes, setRoutes] = useState<ShuttleRoute[]>([]);
  const [routeId, setRouteId] = useState("");
  const [stopIndex, setStopIndex] = useState(0);
  const [status, setStatus] = useState<ServiceStatus>("RUNNING");
  const [passengers, setPassengers] = useState(0);
  const [waiting, setWaiting] = useState<WaitingSummary[]>([]);
  const [tracking, setTracking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [found, setFound] = useState("");
  const coordsRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const route = useMemo(() => routes.find((item) => item.id === routeId), [routes, routeId]);
  const stops = route?.stops ?? [];
  const stop: ShuttleStop | undefined = stops[stopIndex];

  const [waitingVersion, setWaitingVersion] = useState(0);
  const loadWaiting = useCallback(() => setWaitingVersion((v) => v + 1), []);

  useEffect(() => {
    (async () => {
      const result = await clientFetch<ShuttleRoute[]>("/api/v1/shuttle-routes?limit=100&isActive=true");
      if (result.ok) {
        setRoutes(result.data);
        if (result.data[0]) setRouteId(result.data[0].id);
      }
    })();
  }, []);

  useEffect(() => {
    if (!routeId) return;
    const fetchWaiting = async () => {
      const result = await clientFetch<WaitingSummary[]>(`/api/v1/ride-requests/summary?routeId=${routeId}`);
      if (result.ok) setWaiting(result.data);
    };
    void fetchWaiting();
    const timer = window.setInterval(() => void fetchWaiting(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [routeId, waitingVersion]);

  /** Sends one location report with the current trip state. */
  async function report(
    position: { latitude: number; longitude: number },
    atStop: ShuttleStop | undefined,
    nextStatus: ServiceStatus = status,
    quiet = false,
  ) {
    if (!route) return;
    const result = await clientFetch("/api/v1/bus-locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        routeId: route.id,
        currentStopId: atStop?.id,
        latitude: position.latitude,
        longitude: position.longitude,
        passengerCount: passengers,
        passengerLevel: levelFor(passengers),
        serviceStatus: nextStatus,
      }),
    });
    if (result.ok) {
      setLastSent(new Date().toLocaleTimeString("th-TH"));
      if (!quiet) setMessage(null);
    } else {
      setMessage(`ส่งไม่สำเร็จ: ${result.message}`);
    }
  }

  const stopPos = (target?: ShuttleStop) =>
    target ? { latitude: target.latitude, longitude: target.longitude } : coordsRef.current;

  function checkIn() {
    const position = stopPos(stop);
    if (position) void report(position, stop);
    setMessage(stop ? `เช็คอินที่ ${stop.name} แล้ว` : null);
  }

  function departNext() {
    if (stops.length === 0) return;
    const next = (stopIndex + 1) % stops.length;
    const from = stops[stopIndex];
    const to = stops[next];
    // On the way: report the midpoint between the two stops, without a current stop.
    void report({ latitude: (from.latitude + to.latitude) / 2, longitude: (from.longitude + to.longitude) / 2 }, undefined);
    setStopIndex(next);
    setMessage(`ออกเดินทางไป ${to.name}`);
  }

  function changeStatus(next: ServiceStatus) {
    setStatus(next);
    const position = stopPos(stop);
    if (position) void report(position, next === "RUNNING" ? stop : undefined, next);
  }

  async function clearStop(stopId: string) {
    const result = await clientFetch("/api/v1/ride-requests/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stopId }),
    });
    if (result.ok) loadWaiting();
  }

  async function sendNotice() {
    if (!notice.trim()) return;
    const result = await clientFetch("/api/v1/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: notice.trim(), routeId: routeId || undefined }),
    });
    setMessage(result.ok ? "ส่งประกาศถึงนักศึกษาแล้ว" : `ส่งไม่สำเร็จ: ${result.message}`);
    if (result.ok) setNotice("");
  }

  async function sendFound() {
    if (!found.trim()) return;
    const result = await clientFetch("/api/v1/lost-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "FOUND", description: found.trim(), routeId: routeId || undefined }),
    });
    setMessage(result.ok ? "บันทึกของที่พบแล้ว ส่งต่อศูนย์ของหาย" : `ส่งไม่สำเร็จ: ${result.message}`);
    if (result.ok) setFound("");
  }

  // Live GPS tracking (latest report() kept in a ref for the timer).
  const reportRef = useRef(report);
  useEffect(() => {
    reportRef.current = report;
  });
  useEffect(() => {
    if (!tracking || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        coordsRef.current = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      },
      () => {
        setMessage("อ่านตำแหน่ง GPS ไม่ได้ — กดอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์");
        setTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    const timer = window.setInterval(() => {
      const position = coordsRef.current;
      if (position && route) void reportRef.current(position, nearestStop(route.stops, position, 150), undefined, true);
    }, POLL_INTERVAL_MS);
    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.clearInterval(timer);
    };
  }, [tracking, route]);

  const waitingAt = (id: string) => waiting.find((item) => item.stopId === id)?.waiting ?? 0;
  const totalWaiting = waiting.reduce((sum, item) => sum + item.waiting, 0);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-on-surface">แผงควบคุมคนขับรถ</h1>
        <span className="rounded-full bg-surface-container px-3 py-1 text-sm text-primary">{SERVICE_STATUS_LABEL[status]}</span>
      </div>

      <section className={`rounded-xl border p-3 text-sm ${totalWaiting > 0 ? "border-error bg-error-container text-error" : "border-outline-variant bg-surface-container-low text-on-surface-variant"}`}>
        สัญญาณเรียกรถจากนักศึกษา: {totalWaiting > 0 ? `มีผู้รอ ${totalWaiting} คนบนสายนี้` : "ยังไม่มีคำขอเรียกรถ"}
      </section>

      <section className={box}>
        <h2 className="font-semibold text-on-surface">สายรถและสถานะ</h2>
        <select
          className={input}
          value={routeId}
          onChange={(e) => {
            setRouteId(e.target.value);
            setStopIndex(0);
          }}
        >
          {routes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => changeStatus(item)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${status === item ? "border-primary bg-primary text-on-primary" : "border-outline-variant text-on-surface-variant"}`}
            >
              {item === "RUNNING" ? "เริ่ม/กลับมาเดินรถ" : item === "BREAK" ? "พักรถ" : "จบกะ"}
            </button>
          ))}
        </div>
      </section>

      <section className={box}>
        <h2 className="font-semibold text-on-surface">เดินรถตามเส้นทาง</h2>
        <ol className="space-y-1 text-sm">
          {stops.map((item, index) => (
            <li key={item.id} className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setStopIndex(index)}
                className={index === stopIndex ? "font-semibold text-primary" : "text-on-surface-variant"}
              >
                {index === stopIndex ? "▶ " : ""}
                {item.sequence}. {item.name}
                {waitingAt(item.id) > 0 && <span className="ml-1 text-xs text-error">(รอ {waitingAt(item.id)} คน)</span>}
              </button>
              {waitingAt(item.id) > 0 && (
                <button type="button" onClick={() => clearStop(item.id)} className="shrink-0 rounded-full border border-success px-2 py-0.5 text-xs text-success">
                  รับผู้โดยสารแล้ว
                </button>
              )}
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={checkIn} disabled={!stop} className="rounded-lg bg-primary px-4 py-2 text-sm text-on-primary disabled:opacity-50">
            เช็คอินป้ายนี้
          </button>
          <button type="button" onClick={departNext} disabled={stops.length < 2} className="rounded-lg border border-primary px-4 py-2 text-sm text-primary disabled:opacity-50">
            ออกเดินทางไปป้ายถัดไป
          </button>
        </div>
      </section>

      <section className={box}>
        <h2 className="font-semibold text-on-surface">จำนวนผู้โดยสารบนรถ</h2>
        <p className="text-sm text-on-surface-variant">
          ตอนนี้ <b className="text-lg text-primary">{passengers}</b> คน ({PASSENGER_LABEL[levelFor(passengers)]}) — ส่งไปพร้อมรายงานตำแหน่งครั้งถัดไป
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPassengers((n) => n + 1)} className="flex-1 rounded-lg bg-success py-2 text-on-primary">ขึ้น (+1)</button>
          <button type="button" onClick={() => setPassengers((n) => Math.max(0, n - 1))} className="flex-1 rounded-lg bg-error py-2 text-on-primary">ลง (-1)</button>
        </div>
      </section>

      <section className={box}>
        <h2 className="font-semibold text-on-surface">ติดตามรถอัตโนมัติ (GPS)</h2>
        <p className="text-sm text-on-surface-variant">เปิดหน้านี้ไว้บนมือถือ ระบบส่งตำแหน่งทุก {POLL_INTERVAL_MS / 1000} วินาที (ต้องเปิดหน้าจอและอนุญาตตำแหน่ง)</p>
        <button
          type="button"
          onClick={() => {
            if (!tracking && !navigator.geolocation) return setMessage("เบราว์เซอร์นี้ไม่รองรับ GPS");
            setTracking((value) => !value);
          }}
          className={`rounded-lg px-4 py-2 text-sm text-on-primary ${tracking ? "bg-error" : "bg-success"}`}
        >
          {tracking ? "หยุดติดตาม" : "เริ่มติดตามอัตโนมัติ"}
        </button>
      </section>

      <section className={box}>
        <h2 className="font-semibold text-on-surface">ส่งประกาศถึงนักศึกษา</h2>
        <input className={input} maxLength={300} placeholder="เช่น รถออกช้ากว่ากำหนด 5 นาที" value={notice} onChange={(e) => setNotice(e.target.value)} />
        <button type="button" onClick={sendNotice} className="rounded-lg bg-brand-amber px-4 py-2 text-sm text-on-primary">ส่งประกาศ</button>
      </section>

      <section className={box}>
        <h2 className="font-semibold text-on-surface">แจ้งของที่พบบนรถ</h2>
        <input className={input} maxLength={300} placeholder="เช่น ร่มสีน้ำเงินที่เบาะแถวหลัง" value={found} onChange={(e) => setFound(e.target.value)} />
        <button type="button" onClick={sendFound} className="rounded-lg bg-primary px-4 py-2 text-sm text-on-primary">บันทึกส่งศูนย์ของหาย</button>
      </section>

      {lastSent && <p className="text-sm text-on-surface-variant">ส่งตำแหน่งล่าสุดเมื่อ {lastSent}</p>}
      {message && <p className="text-sm text-on-surface-variant">{message}</p>}
    </div>
  );
}

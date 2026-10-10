"use client";

import { useEffect, useMemo, useState } from "react";
import { clientFetch } from "@/lib/client-fetch";
import { PASSENGER_LABEL, type PassengerLevel, type ShuttleRoute } from "@/lib/shuttle";

const LEVELS: PassengerLevel[] = ["LOW", "MEDIUM", "HIGH", "FULL"];

export function DriverReportForm() {
  const [routes, setRoutes] = useState<ShuttleRoute[]>([]);
  const [routeId, setRouteId] = useState("");
  const [stopId, setStopId] = useState("");
  const [level, setLevel] = useState<PassengerLevel>("LOW");
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const result = await clientFetch<ShuttleRoute[]>("/api/v1/shuttle-routes?limit=100&isActive=true");
      if (result.ok) {
        setRoutes(result.data);
        if (result.data[0]) setRouteId(result.data[0].id);
      }
    })();
  }, []);

  const route = useMemo(() => routes.find((item) => item.id === routeId), [routes, routeId]);
  const stop = route?.stops.find((item) => item.id === stopId);

  async function send(coords?: { latitude: number; longitude: number }) {
    const position = coords ?? (stop ? { latitude: stop.latitude, longitude: stop.longitude } : null);
    if (!route || !position) {
      setMessage("เลือกจุดจอด หรือกดใช้ตำแหน่ง GPS ก่อน");
      return;
    }
    setSending(true);
    const result = await clientFetch("/api/v1/bus-locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        routeId: route.id,
        currentStopId: stop?.id,
        latitude: position.latitude,
        longitude: position.longitude,
        passengerLevel: level,
      }),
    });
    setSending(false);
    setMessage(result.ok ? "รายงานตำแหน่งแล้ว" : `ส่งไม่สำเร็จ: ${result.message}`);
  }

  function useGps() {
    if (!navigator.geolocation) {
      setMessage("เบราว์เซอร์นี้ไม่รองรับ GPS");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => void send({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => setMessage("อ่านตำแหน่ง GPS ไม่ได้"),
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900">รายงานตำแหน่งรถ</h1>

      <label className="block text-sm font-medium text-gray-700">
        เส้นทาง
        <select
          className="mt-1 w-full rounded-lg border border-gray-300 p-2"
          value={routeId}
          onChange={(event) => {
            setRouteId(event.target.value);
            setStopId("");
          }}
        >
          {routes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-gray-700">
        จุดจอดปัจจุบัน
        <select
          className="mt-1 w-full rounded-lg border border-gray-300 p-2"
          value={stopId}
          onChange={(event) => setStopId(event.target.value)}
        >
          <option value="">— เลือกจุดจอด —</option>
          {route?.stops.map((item) => (
            <option key={item.id} value={item.id}>
              {item.sequence}. {item.name}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="text-sm text-gray-700">
        <legend className="font-medium">ความหนาแน่นผู้โดยสาร</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {LEVELS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLevel(item)}
              className={`rounded-full border px-3 py-1 ${
                level === item ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 text-gray-700"
              }`}
            >
              {PASSENGER_LABEL[item]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={sending}
          onClick={() => void send()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          รายงานที่จุดจอดที่เลือก
        </button>
        <button
          type="button"
          disabled={sending}
          onClick={useGps}
          className="rounded-lg border border-blue-600 px-4 py-2 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
        >
          ใช้ตำแหน่ง GPS ปัจจุบัน
        </button>
      </div>

      {message && <p className="text-sm text-gray-700">{message}</p>}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { clientFetch } from "@/lib/client-fetch";
import { timeAgo, type Announcement, type ShuttleRoute } from "@/lib/shuttle";

const box = "rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm space-y-3";
const input = "w-full rounded-lg border border-outline-variant p-2 text-sm";

type Review = { id: string; rating: number; comment: string | null; createdAt: string; route: { name: string } | null };
type LostItem = {
  id: string;
  type: "LOST" | "FOUND";
  description: string;
  status: "OPEN" | "RETURNED" | "CLOSED";
  createdAt: string;
  route: { name: string } | null;
};
type Problem = { id: string; category: string; message: string; status: "OPEN" | "RESOLVED"; createdAt: string; route: { name: string } | null };
const PROBLEM_LABEL: Record<string, string> = { LATE: "รถมาช้า", DRIVER: "คนขับ", VEHICLE: "สภาพรถ", SAFETY: "ความปลอดภัย", OTHER: "อื่น ๆ" };
type Demand = { stopId: string; stopName: string; routeName: string; requests: number };

const LOST_STATUS: Record<LostItem["status"], string> = { OPEN: "รอดำเนินการ", RETURNED: "คืนเจ้าของแล้ว", CLOSED: "ปิดเรื่อง" };

/** Parses "ชื่อป้าย, lat, lng" lines into stops. */
function parseStops(text: string) {
  return text
    .split("\n")
    .map((line) => line.split(",").map((part) => part.trim()))
    .filter((parts) => parts.length >= 3 && parts[0])
    .map(([name, lat, lng]) => ({ name, latitude: Number(lat), longitude: Number(lng) }));
}

export function AdminPanel() {
  const [summary, setSummary] = useState<{ average: number; count: number } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [lost, setLost] = useState<LostItem[]>([]);
  const [demand, setDemand] = useState<Demand[]>([]);
  const [routes, setRoutes] = useState<ShuttleRoute[]>([]);
  const [news, setNews] = useState<Announcement[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [form, setForm] = useState({ name: "", times: "", stops: "" });
  const [notice, setNotice] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const [version, setVersion] = useState(0);
  const load = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    (async () => {
      const [s, r, l, d, rt, n, p] = await Promise.all([
        clientFetch<{ average: number; count: number }>("/api/v1/service-reviews/summary"),
        clientFetch<Review[]>("/api/v1/service-reviews?limit=20"),
        clientFetch<LostItem[]>("/api/v1/lost-items?limit=50"),
        clientFetch<Demand[]>("/api/v1/ride-requests/stats"),
        clientFetch<ShuttleRoute[]>("/api/v1/shuttle-routes?limit=100"),
        clientFetch<Announcement[]>("/api/v1/announcements?limit=10"),
        clientFetch<Problem[]>("/api/v1/problem-reports?limit=30"),
      ]);
      if (s.ok) setSummary(s.data);
      if (r.ok) setReviews(r.data);
      if (l.ok) setLost(l.data);
      if (d.ok) setDemand(d.data);
      if (rt.ok) setRoutes(rt.data);
      if (n.ok) setNews(n.data);
      if (p.ok) setProblems(p.data);
    })();
  }, [version]);

  async function send(path: string, method: string, body?: unknown, ok = "บันทึกแล้ว") {
    const result = await clientFetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    setMessage(result.ok ? ok : `ไม่สำเร็จ: ${result.message}`);
    if (result.ok) load();
    return result.ok;
  }

  async function addRoute() {
    const departureTimes = form.times.split(",").map((t) => t.trim()).filter(Boolean);
    const done = await send("/api/v1/shuttle-routes", "POST", { name: form.name.trim(), departureTimes, stops: parseStops(form.stops) }, "เพิ่มเส้นทางแล้ว");
    if (done) setForm({ name: "", times: "", stops: "" });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-8">
      <h1 className="text-2xl font-bold text-on-surface">แผงผู้ดูแลระบบรถรับส่ง</h1>
      {message && <p className="text-sm text-on-surface-variant">{message}</p>}

      <section className={box}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold text-on-surface">คะแนนรีวิวการบริการ</h2>
          <p className="text-2xl font-bold text-brand-amber">
            {summary ? `${summary.average.toFixed(1)} / 5.0` : "-"}
            <span className="ml-2 text-sm font-normal text-on-surface-variant">({summary?.count ?? 0} รีวิว)</span>
          </p>
        </div>
        {reviews.length === 0 && <p className="text-sm text-on-surface-variant">ยังไม่มีรีวิว</p>}
        <ul className="divide-y divide-outline-variant text-sm">
          {reviews.map((item) => (
            <li key={item.id} className="py-2">
              <span className="font-medium text-brand-amber">{item.rating}/5</span>
              {item.route && <span className="ml-2 text-on-surface-variant">{item.route.name}</span>}
              <span className="ml-2 text-on-surface-variant">{timeAgo(item.createdAt)}</span>
              {item.comment && <p className="text-on-surface-variant">{item.comment}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className={box}>
        <h2 className="font-semibold text-on-surface">กล่องแจ้งปัญหาจากนักศึกษา ({problems.filter((item) => item.status === "OPEN").length} รอดำเนินการ)</h2>
        {problems.length === 0 && <p className="text-sm text-on-surface-variant">ยังไม่มีการแจ้งปัญหา</p>}
        <ul className="divide-y divide-outline-variant text-sm">
          {problems.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="text-on-surface-variant">
                <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs text-primary">{PROBLEM_LABEL[item.category] ?? item.category}</span>{" "}
                {item.message} {item.route && <span className="text-on-surface-variant">· {item.route.name}</span>} <span className="text-on-surface-variant">· {timeAgo(item.createdAt)}</span>
              </span>
              <button
                type="button"
                onClick={() => send(`/api/v1/problem-reports/${item.id}`, "PATCH", { status: item.status === "OPEN" ? "RESOLVED" : "OPEN" }, "อัปเดตสถานะแล้ว")}
                className={`shrink-0 rounded-lg px-2 py-1 text-xs ${item.status === "OPEN" ? "bg-success text-on-primary" : "border border-outline-variant text-on-surface-variant"}`}
              >
                {item.status === "OPEN" ? "แก้ไขแล้ว" : "เปิดเรื่องอีกครั้ง"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={box}>
        <h2 className="font-semibold text-on-surface">ความหนาแน่นการเรียกรถ (30 วันล่าสุด)</h2>
        {demand.length === 0 && <p className="text-sm text-on-surface-variant">ยังไม่มีข้อมูลการเรียกรถ</p>}
        <ul className="space-y-1 text-sm">
          {demand.map((item) => (
            <li key={item.stopId} className="flex justify-between gap-2">
              <span className="text-on-surface-variant">{item.stopName} <span className="text-on-surface-variant">· {item.routeName}</span></span>
              <span className={item.requests >= 20 ? "font-semibold text-error" : item.requests >= 10 ? "text-brand-amber" : "text-success"}>
                {item.requests} ครั้ง
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className={box}>
        <h2 className="font-semibold text-on-surface">จัดการเส้นทางเดินรถ</h2>
        <ul className="divide-y divide-outline-variant text-sm">
          {routes.map((route) => (
            <li key={route.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                <b className="text-on-surface">{route.name}</b>
                <span className="ml-2 text-on-surface-variant">{route.stops.length} ป้าย · {route.departureTimes.join(", ")}</span>
                {!route.isActive && <span className="ml-2 text-error">(ปิดให้บริการ)</span>}
              </span>
              <span className="flex gap-2">
                <button type="button" onClick={() => send(`/api/v1/shuttle-routes/${route.id}`, "PATCH", { isActive: !route.isActive })} className="rounded-lg border border-outline-variant px-2 py-1 text-xs">
                  {route.isActive ? "ปิดสาย" : "เปิดสาย"}
                </button>
                <button type="button" onClick={() => window.confirm(`ลบ ${route.name}?`) && send(`/api/v1/shuttle-routes/${route.id}`, "DELETE", undefined, "ลบเส้นทางแล้ว")} className="rounded-lg bg-error px-2 py-1 text-xs text-on-primary">
                  ลบ
                </button>
              </span>
            </li>
          ))}
        </ul>
        <div className="space-y-2 border-t border-outline-variant pt-3">
          <p className="text-sm font-medium text-on-surface-variant">เพิ่มเส้นทางใหม่</p>
          <input className={input} placeholder="ชื่อเส้นทาง เช่น สาย 4 (หอพัก - สนามกีฬา)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={input} placeholder="รอบออก คั่นด้วยจุลภาค เช่น 08:30, 11:30" value={form.times} onChange={(e) => setForm({ ...form, times: e.target.value })} />
          <textarea className={input} rows={4} placeholder={"จุดจอด บรรทัดละ 1 ป้าย: ชื่อ, ละติจูด, ลองจิจูด\nเช่น ประตูหน้ามหาวิทยาลัย, 18.894923, 99.009869"} value={form.stops} onChange={(e) => setForm({ ...form, stops: e.target.value })} />
          <button type="button" onClick={addRoute} disabled={!form.name.trim()} className="rounded-lg bg-success px-4 py-2 text-sm text-on-primary disabled:opacity-50">
            บันทึกเส้นทางใหม่
          </button>
        </div>
      </section>

      <section className={box}>
        <h2 className="font-semibold text-on-surface">ประกาศถึงนักศึกษา</h2>
        <textarea className={input} rows={2} maxLength={300} placeholder="พิมพ์ข้อความประกาศ..." value={notice} onChange={(e) => setNotice(e.target.value)} />
        <button type="button" onClick={async () => (await send("/api/v1/announcements", "POST", { message: notice.trim() }, "ส่งประกาศแล้ว")) && setNotice("")} disabled={!notice.trim()} className="rounded-lg bg-primary px-4 py-2 text-sm text-on-primary disabled:opacity-50">
          ส่งประกาศ
        </button>
        <ul className="divide-y divide-outline-variant text-sm">
          {news.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 py-2">
              <span className="text-on-surface-variant">{item.route ? `[${item.route.name}] ` : ""}{item.message} <span className="text-on-surface-variant">· {timeAgo(item.createdAt)}</span></span>
              <button type="button" onClick={() => send(`/api/v1/announcements/${item.id}`, "DELETE", undefined, "ลบประกาศแล้ว")} className="shrink-0 text-xs text-error">ลบ</button>
            </li>
          ))}
        </ul>
      </section>

      <section className={box}>
        <h2 className="font-semibold text-on-surface">ของหาย / ของที่พบ ({lost.length} รายการ)</h2>
        {lost.length === 0 && <p className="text-sm text-on-surface-variant">ยังไม่มีรายการ</p>}
        <ul className="divide-y divide-outline-variant text-sm">
          {lost.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="text-on-surface-variant">
                <span className={item.type === "LOST" ? "text-error" : "text-success"}>{item.type === "LOST" ? "ของหาย" : "ของที่พบ"}</span>{" "}
                {item.description} {item.route && <span className="text-on-surface-variant">· {item.route.name}</span>}{" "}
                <span className="text-on-surface-variant">· {timeAgo(item.createdAt)}</span>
              </span>
              <select className="rounded-lg border border-outline-variant p-1 text-xs" value={item.status} onChange={(e) => send(`/api/v1/lost-items/${item.id}`, "PATCH", { status: e.target.value }, "อัปเดตสถานะแล้ว")}>
                {Object.entries(LOST_STATUS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

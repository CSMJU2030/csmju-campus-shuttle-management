"use client";

import { useEffect, useState } from "react";
import { clientFetch } from "@/lib/client-fetch";
import { timeAgo, type ShuttleRoute } from "@/lib/shuttle";

const box = "rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm space-y-3";
const input = "w-full rounded-lg border border-outline-variant p-2 text-sm";

async function postJson(path: string, body: unknown) {
  return clientFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function RouteSelect({ routes, value, onChange }: { routes: ShuttleRoute[]; value: string; onChange: (v: string) => void }) {
  return (
    <select className={input} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">— ไม่ระบุสาย —</option>
      {routes.map((route) => (
        <option key={route.id} value={route.id}>
          {route.name}
        </option>
      ))}
    </select>
  );
}

/** ประเมินความพึงพอใจการใช้บริการ */
export function ReviewForm({ routes }: { routes: ShuttleRoute[] }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [routeId, setRouteId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function send() {
    const result = await postJson("/api/v1/service-reviews", { rating, comment: comment || undefined, routeId: routeId || undefined });
    setMsg(result.ok ? "ขอบคุณสำหรับการประเมิน" : `ส่งไม่สำเร็จ: ${result.message}`);
    if (result.ok) setComment("");
  }

  return (
    <section className={`${box} text-center`}>
      <h2 className="text-lg font-semibold text-on-surface">ประเมินความพึงพอใจการใช้บริการ</h2>
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${value} ดาว`}
            onClick={() => setRating(value)}
            className={`h-10 w-10 rounded-full border text-base font-semibold ${value <= rating ? "border-brand-amber bg-brand-amber text-on-primary" : "border-outline-variant text-on-surface-variant"}`}
          >
            {value}
          </button>
        ))}
      </div>
      <RouteSelect routes={routes} value={routeId} onChange={setRouteId} />
      <textarea className={input} rows={2} maxLength={500} placeholder="ความคิดเห็นถึงคนขับ/การบริการ (ไม่บังคับ)" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button type="button" onClick={send} className="rounded-lg bg-primary px-5 py-2 text-sm text-on-primary">ส่งคะแนนประเมิน</button>
      {msg && <p className="text-sm text-on-surface-variant">{msg}</p>}
    </section>
  );
}

const CATEGORIES = [
  { value: "LOST", label: "ลืมของบนรถ" },
  { value: "LATE", label: "รถมาช้า / ไม่ตรงเวลา" },
  { value: "DRIVER", label: "พฤติกรรมคนขับ" },
  { value: "VEHICLE", label: "สภาพรถ" },
  { value: "SAFETY", label: "ความปลอดภัย" },
  { value: "OTHER", label: "อื่น ๆ" },
];

/** แจ้งปัญหาหรือลืมของไว้บนรถ → ส่งถึงผู้ดูแล */
export function ProblemForm({ routes }: { routes: ShuttleRoute[] }) {
  const [category, setCategory] = useState("LOST");
  const [routeId, setRouteId] = useState("");
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function send() {
    if (!text.trim()) return setMsg("กรอกรายละเอียดก่อน");
    const result =
      category === "LOST"
        ? await postJson("/api/v1/lost-items", { type: "LOST", description: text.trim(), routeId: routeId || undefined })
        : await postJson("/api/v1/problem-reports", { category, message: text.trim(), routeId: routeId || undefined });
    setMsg(result.ok ? "ส่งข้อมูลถึงผู้ดูแลแล้ว" : `ส่งไม่สำเร็จ: ${result.message}`);
    if (result.ok) setText("");
  }

  return (
    <section className={box}>
      <h2 className="text-center text-lg font-semibold text-on-surface">แจ้งปัญหาหรือลืมของไว้บนรถ</h2>
      <label className="block text-sm font-medium text-on-surface-variant">
        ประเภทปัญหา
        <select className={`${input} mt-1`} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </label>
      <RouteSelect routes={routes} value={routeId} onChange={setRouteId} />
      <textarea className={input} rows={3} maxLength={500} placeholder="ระบุรายละเอียด..." value={text} onChange={(e) => setText(e.target.value)} />
      <button type="button" onClick={send} className="w-full rounded-lg bg-success py-2 text-sm text-on-primary">ส่งข้อมูลไปยังผู้ดูแล</button>
      {msg && <p className="text-sm text-on-surface-variant">{msg}</p>}
    </section>
  );
}

type LostItem = { id: string; type: "LOST" | "FOUND"; description: string; status: "OPEN" | "RETURNED" | "CLOSED"; createdAt: string; route: { name: string } | null };
const STATUS_LABEL: Record<LostItem["status"], string> = { OPEN: "เก็บรักษาอยู่ที่ศูนย์", RETURNED: "คืนเจ้าของแล้ว", CLOSED: "ปิดเรื่อง" };

/** กระดานประกาศของหาย (ของที่คนขับพบ) + รายการที่ฉันแจ้ง */
export function LostBoard() {
  const [items, setItems] = useState<LostItem[]>([]);
  useEffect(() => {
    (async () => {
      const result = await clientFetch<LostItem[]>("/api/v1/lost-items?limit=50");
      if (result.ok) setItems(result.data);
    })();
  }, []);
  const found = items.filter((item) => item.type === "FOUND");
  const mine = items.filter((item) => item.type === "LOST");

  return (
    <section className={box}>
      <h2 className="text-center text-lg font-semibold text-on-surface">กระดานประกาศของหายและติดตามสิ่งของ</h2>
      {found.length === 0 && <p className="text-center text-sm text-on-surface-variant">ยังไม่มีของที่พบบนรถ</p>}
      {found.map((item) => (
        <div key={item.id} className="rounded-lg border border-outline-variant p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <b className="text-on-surface">{item.description}</b>
            <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs text-success">{STATUS_LABEL[item.status]}</span>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">{item.route ? `รถ: ${item.route.name} · ` : ""}พบเมื่อ {timeAgo(item.createdAt)}</p>
        </div>
      ))}
      {mine.length > 0 && (
        <div className="border-t border-outline-variant pt-3">
          <p className="text-sm font-medium text-on-surface-variant">ของหายที่ฉันแจ้ง</p>
          {mine.map((item) => (
            <p key={item.id} className="text-sm text-on-surface-variant">
              {item.description} — <span className="text-on-surface-variant">{STATUS_LABEL[item.status] === "เก็บรักษาอยู่ที่ศูนย์" ? "รอดำเนินการ" : STATUS_LABEL[item.status]}</span>
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

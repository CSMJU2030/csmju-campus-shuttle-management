"use client";

import { loginHref } from "@/lib/sign-in";

/**
 * Client-side fetch helper with automatic 401 Silent re-SSO and 30s loop guard.
 * auth-contract 7: Top-level navigation to /auth/login?next=...
 */
export async function clientFetch<T>(
  input: string | URL,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  try {
    const res = await fetch(input, init);

    if (res.status === 401) {
      if (typeof window !== "undefined") {
        const next = `${window.location.pathname}${window.location.search}`;
        const renewedKey = "csmju-sso-renewed-at";
        const last = Number(window.sessionStorage.getItem(renewedKey));
        const now = Date.now();

        // 30s loop guard (auth-contract 7: top-level navigation)
        if (Number.isFinite(last) && now - last < 30_000) {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.assign(`/signin-again?next=${encodeURIComponent(next)}`);
        } else {
          try {
            window.sessionStorage.setItem(renewedKey, String(now));
          } catch {}
          window.location.assign(loginHref(next));
        }
      }
      return { ok: false, status: 401, message: "การเข้าสู่ระบบหมดอายุ กำลังนำทางไปต่ออายุ..." };
    }

    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) {
      return { ok: true, data: json.data as T };
    }

    return {
      ok: false,
      status: res.status,
      message: json?.error?.message ?? `HTTP ${res.status}`,
    };
  } catch {
    return { ok: false, status: 503, message: "เชื่อมต่อเครือข่ายไม่ได้" };
  }
}

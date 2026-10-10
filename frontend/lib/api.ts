import { cookies } from "next/headers";
import { loginHref } from "./sign-in";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:4206";
const SUBSYSTEM_ID = process.env.SUBSYSTEM_ID ?? "csmju-campus-shuttle-management";

/**
 * Session cookie set by backend at /auth/callback: `<name>_access_token`
 * where `-` is replaced with `_` (auth-contract 5.1, 6).
 */
export const SSO_COOKIE = `${SUBSYSTEM_ID.replace(/-/g, "_")}_access_token`;

type Envelope<T> =
  | { success: true; data: T; meta?: Record<string, unknown> }
  | { success: false; error: { code: string; message: string } };

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

export type Me = {
  id: string;
  email: string;
  coreRole: string;
  subsystemRole: "STUDENT" | "ALUMNI" | "STAFF" | "LECTURER" | "ADMIN";
  session: { expiresAt: string | null };
};

/**
 * Checks whether one or more API results received 401 UNAUTHORIZED.
 */
export const isUnauthorized = (...results: ApiResult<unknown>[]) =>
  results.some((result) => !result.ok && result.status === 401);

/**
 * Server-side API client that forwards the HttpOnly SSO session cookie.
 */
export async function call<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<ApiResult<T>> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SSO_COOKIE)?.value;

  if (!token) {
    return { ok: false, status: 401, message: "ยังไม่ได้เข้าสู่ระบบ" };
  }

  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}${path}`, {
      method: init.method ?? "GET",
      headers: {
        Cookie: `${SSO_COOKIE}=${encodeURIComponent(token)}`,
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 503, message: "เชื่อมต่อ backend ของระบบย่อยไม่ได้" };
  }

  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (res.ok && body?.success) return { ok: true, data: body.data };
  return {
    ok: false,
    status: res.status,
    message: body && !body.success ? body.error.message : `HTTP ${res.status}`,
  };
}

/**
 * GET /api/v1/me — verifies identity from Core Hub token.
 */
export const getMe = () => call<Me>("/api/v1/me");

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

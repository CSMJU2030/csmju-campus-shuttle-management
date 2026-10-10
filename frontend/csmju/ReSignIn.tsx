"use client";

import { useEffect, useRef, useState } from "react";
import { loginHref } from "../lib/sign-in";
import { primaryButtonClass, cardClass } from "./ui";

/**
 * Silent re-SSO (auth-contract 7).
 * The session is a Core Hub token that lives 15 minutes; when the backend answers 401
 * this sends the whole page to /auth/login?next=<this page>, Core Hub renews the sign-in
 * without asking while its own session lasts, and the browser is back within a second.
 *
 * - A top-level navigation (`window.location`), never `fetch`.
 * - Loop guard: a 401 less than 30 s after this tab last left to renew means
 *   renewing does not help, so the user gets a "เข้าสู่ระบบอีกครั้ง" button instead
 *   of another round trip loop.
 * - `ask`: a form was just sent - ask before leaving instead of renewing automatically.
 */

const RENEWED_AT_KEY = "csmju-sso-renewed-at";
const LOOP_GUARD_MS = 30_000;

function renewedAt(): number | null {
  try {
    const value = Number(window.sessionStorage.getItem(RENEWED_AT_KEY));
    return Number.isFinite(value) ? value : 0;
  } catch {
    return null;
  }
}

function markRenewal(): boolean {
  try {
    window.sessionStorage.setItem(RENEWED_AT_KEY, String(Date.now()));
    return true;
  } catch {
    return false;
  }
}

export default function ReSignIn({
  next,
  ask = false,
}: {
  next?: string;
  ask?: boolean;
}) {
  const [asking, setAsking] = useState(ask);
  const [href, setHref] = useState(loginHref(next ?? "/"));
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const currentPath =
      next ?? `${window.location.pathname}${window.location.search}`;
    const target = loginHref(currentPath);
    setHref(target);

    if (ask) return;

    const last = renewedAt();
    // If renewal occurred less than 30s ago, prevent infinite loop
    if (last === null || Date.now() - last < LOOP_GUARD_MS || !markRenewal()) {
      setTimeout(() => setAsking(true), 0);
      return;
    }
    window.location.assign(target);
  }, [ask, next]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className={`max-w-md w-full p-8 text-center space-y-6 ${cardClass}`}>
        {asking ? (
          <>
            <div className="mx-auto w-12 h-12 rounded-full bg-brand-amber/10 text-brand-amber flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-headline-md text-on-surface">เข้าสู่ระบบอีกครั้ง</h1>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                {ask
                  ? "การเข้าสู่ระบบหมดอายุก่อนส่งข้อมูล — กรุณาเข้าสู่ระบบอีกครั้งเพื่อดำเนินการต่อ"
                  : "ต่ออายุการเข้าสู่ระบบไม่สำเร็จ — ตรวจสอบว่าเบราว์เซอร์รับคุกกี้ และเปิดระบบด้วย origin ที่ตรงกับที่ลงทะเบียน"}
              </p>
            </div>
            <div className="pt-2">
              <a
                className={`${primaryButtonClass} w-full`}
                href={href}
                onClick={() => markRenewal()}
              >
                เข้าสู่ระบบอีกครั้ง
              </a>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary-container/10 text-primary-container flex items-center justify-center animate-spin">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-headline-md text-on-surface">กำลังต่ออายุการเข้าสู่ระบบ…</h1>
              <p className="text-body-sm text-outline">กำลังยืนยันตัวตนผ่าน CSMJU Core Hub แล้วกลับมาที่หน้านี้</p>
            </div>
            <noscript>
              <div className="pt-2">
                <a className={`${primaryButtonClass} w-full`} href={href}>
                  เข้าสู่ระบบอีกครั้ง
                </a>
              </div>
            </noscript>
          </>
        )}
      </div>
    </div>
  );
}

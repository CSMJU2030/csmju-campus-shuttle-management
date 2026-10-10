import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { CsmjuAppShell } from "@/csmju";
import { getMe } from "@/lib/api";

const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = Noto_Sans_Thai({
  subsets: ["latin", "thai"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "UniRide รถรับส่งมหาวิทยาลัย | CSMJU",
  description: "ดูเส้นทาง รอบรถ และตำแหน่งรถรับส่งภายในมหาวิทยาลัยแม่โจ้",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const meResult = await getMe();
  const me = meResult.ok ? meResult.data : null;

  const roleLabelMap: Record<string, string> = {
    ADMIN: "ผู้ดูแลระบบ",
    STAFF: "เจ้าหน้าที่",
    LECTURER: "อาจารย์",
    STUDENT: "นักศึกษา",
    ALUMNI: "ศิษย์เก่า",
  };

  const getInitials = (email: string) => {
    if (!email) return "U";
    const namePart = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    if (namePart.length >= 2) {
      return namePart.slice(0, 2).toUpperCase();
    }
    return (namePart[0] || "U").toUpperCase();
  };

  const user = me
    ? {
        initials: getInitials(me.email),
        roleLabel: roleLabelMap[me.subsystemRole] || "ผู้ใช้งานทั่วไป",
      }
    : {
        initials: "?",
        roleLabel: "ยังไม่ได้เข้าสู่ระบบ",
      };

  const isStaffOrAdmin = me?.subsystemRole === "ADMIN" || me?.subsystemRole === "STAFF";

  const nav = [
    { label: "ตารางและตำแหน่งรถ", href: "/shuttle", icon: "dashboard" as const },
    ...(isStaffOrAdmin
      ? [{ label: "รายงานตำแหน่งรถ", href: "/driver", icon: "settings" as const }]
      : []),
  ];

  return (
    <html lang="th" className={`${displayFont.variable} ${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-body">
        <CsmjuAppShell
          displayName="CSMJU UniRide"
          nav={nav}
          user={user}
          coreHubUrl={process.env.CORE_HUB_WEB_URL}
        >
          {children}
        </CsmjuAppShell>
      </body>
    </html>
  );
}

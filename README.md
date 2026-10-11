# CSMJU UniRide — ระบบรถรับส่งภายในมหาวิทยาลัย (`csmju-campus-shuttle-management`)

ดูเส้นทาง รอบรถ จุดจอด และตำแหน่งรถรับส่งภายในมหาวิทยาลัยแม่โจ้ · เจ้าหน้าที่/คนขับรายงานตำแหน่งรถ · login ผ่าน CSMJU Core Hub (SSO)

- เว็บจริง: https://csmju-campus-shuttle-management.jowave.com
- มาตรฐาน: CSMJU2030 standards v1.8.4 (`standards/`)

## โครงสร้าง

| โฟลเดอร์ | อะไร |
|---|---|
| `backend/` | NestJS + Prisma (PostgreSQL) · SSO ตาม auth-contract (`/auth/login` · `/auth/callback` · `/auth/logout`) · API ใต้ `/api/v1` |
| `frontend/` | Next.js จาก `standards/templates/csmju-subsystem-web` (CsmjuAppShell) · แผนที่ leaflet |
| `docker-compose.yml` | db · api (:4000) · web (:3000 → 127.0.0.1:3206) |

## บทบาท (role mapping)

| Core Hub | ในระบบ | ทำอะไรได้ |
|---|---|---|
| student | STUDENT | ดูเส้นทาง/ตำแหน่งรถ · เรียกรถที่ป้าย · แจ้งของหาย · รีวิวคนขับ |
| lecturer | LECTURER | เหมือน student |
| staff | STAFF | คนขับ (เช็คอินป้าย · พักรถ/จบกะ · นับผู้โดยสาร · ประกาศ · แจ้งของที่พบ) + แผงผู้ดูแล (รีวิว · เส้นทาง · ของหาย · สถิติ) |
| admin | ADMIN | ทุกอย่าง |
| alumni · guest | — | ไม่ให้เข้า (403) |

## API

| Method | Path | สิทธิ์ |
|---|---|---|
| GET | `/api/v1/shuttle-routes` (page, limit, keyword, isActive) | shuttle:read:any |
| GET | `/api/v1/shuttle-routes/:id` | shuttle:read:any |
| POST · PATCH · DELETE | `/api/v1/shuttle-routes[/:id]` | shuttle:manage |
| GET | `/api/v1/bus-locations` (routeId, page, limit) | shuttle:read:any |
| GET | `/api/v1/bus-locations/latest` — หน้าเว็บ poll ทุก 15 วินาที | shuttle:read:any |
| POST | `/api/v1/bus-locations` (passengerCount, serviceStatus RUNNING/BREAK/OFF_DUTY) | bus-location:report |
| POST · DELETE | `/api/v1/ride-requests` · `/:id` — เรียกรถ / ยกเลิก | ride-request:create |
| GET | `/api/v1/ride-requests/summary` — จำนวนคนรอแต่ละป้าย | shuttle:read:any |
| POST · GET | `/api/v1/ride-requests/clear` · `/stats` — คนขับรับผู้โดยสารแล้ว / สถิติความหนาแน่น | ride-request:manage |
| POST · GET · PATCH | `/api/v1/lost-items` — แจ้งของหาย/ของที่พบ · จัดการสถานะ | lost-item:report / manage |
| POST · GET | `/api/v1/service-reviews` · `/summary` — รีวิวคนขับ | review:create / read:any |
| POST · GET · DELETE | `/api/v1/announcements` — ประกาศถึงนักศึกษา | announcement:create / shuttle:read:any |
| POST · GET · PATCH | `/api/v1/problem-reports` — แจ้งปัญหา (รถมาช้า คนขับ สภาพรถ ความปลอดภัย) | problem-report:create / manage |

ตำแหน่งรถใช้ **polling** (ไม่ใช้ WebSocket) · เก็บผู้รายงานเป็น `reported_by_core_user_id` เท่านั้น ไม่เก็บชื่อ/อีเมล

## รันในเครื่อง (Git Bash)

```bash
git submodule update --init standards
pnpm install
cp backend/.env.example backend/.env      # แก้ DATABASE_URL ให้ชี้ PostgreSQL ในเครื่อง
pnpm --filter backend prisma:deploy
pnpm --filter backend prisma:seed          # เส้นทางตัวอย่าง 3 สาย
pnpm --filter backend start:dev            # http://localhost:4206
pnpm --filter frontend dev                 # http://localhost:3206
```

หรือ `docker compose up -d --build` แล้วเปิด http://localhost:3206

## ตรวจก่อนเปิด PR

```bash
./standards/scripts/run-all-checks.sh .    # ต้องผ่านครบ 20 ข้อ
```

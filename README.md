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
| student | STUDENT | ดูเส้นทาง รอบรถ ตำแหน่งรถ |
| lecturer | LECTURER | ดูเส้นทาง รอบรถ ตำแหน่งรถ |
| staff | STAFF | ดู + รายงานตำแหน่งรถ + จัดการเส้นทาง/จุดจอด |
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
| POST | `/api/v1/bus-locations` | bus-location:report |

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

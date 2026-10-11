export type ShuttleStop = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  sequence: number;
};

export type ShuttleRoute = {
  id: string;
  name: string;
  description: string | null;
  departureTimes: string[];
  isActive: boolean;
  stops: ShuttleStop[];
};

export type PassengerLevel = "LOW" | "MEDIUM" | "HIGH" | "FULL";

export type BusLocation = {
  id: string;
  routeId: string;
  latitude: number;
  longitude: number;
  passengerLevel: PassengerLevel;
  passengerCount: number | null;
  serviceStatus: "RUNNING" | "BREAK" | "OFF_DUTY";
  reportedAt: string;
  currentStop: { id: string; name: string; sequence: number } | null;
};

export type LatestLocation = {
  routeId: string;
  routeName: string;
  location: BusLocation | null;
};

export const PASSENGER_LABEL: Record<PassengerLevel, string> = {
  LOW: "ว่าง",
  MEDIUM: "ปานกลาง",
  HIGH: "ค่อนข้างแน่น",
  FULL: "เต็ม",
};

/** Polling interval for bus locations (standards: polling 10–15 s, no WebSocket). */
export const POLL_INTERVAL_MS = 15_000;

export function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds} วินาทีที่แล้ว`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  return `${Math.round(minutes / 60)} ชั่วโมงที่แล้ว`;
}

/** Nearest stop to a point, if it is within maxMeters (haversine distance). */
export function nearestStop(
  stops: ShuttleStop[],
  point: { latitude: number; longitude: number },
  maxMeters: number,
): ShuttleStop | undefined {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  let best: { stop: ShuttleStop; meters: number } | undefined;
  for (const stop of stops) {
    const dLat = toRad(stop.latitude - point.latitude);
    const dLng = toRad(stop.longitude - point.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(point.latitude)) * Math.cos(toRad(stop.latitude)) * Math.sin(dLng / 2) ** 2;
    const meters = 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (!best || meters < best.meters) best = { stop, meters };
  }
  return best && best.meters <= maxMeters ? best.stop : undefined;
}

export type ServiceStatus = "RUNNING" | "BREAK" | "OFF_DUTY";

export const SERVICE_STATUS_LABEL: Record<ServiceStatus, string> = {
  RUNNING: "กำลังให้บริการ",
  BREAK: "พักรถ",
  OFF_DUTY: "จบกะ / ไม่ให้บริการ",
};

export type WaitingSummary = { stopId: string; waiting: number };

export type Announcement = {
  id: string;
  message: string;
  createdAt: string;
  route: { id: string; name: string } | null;
};

export type Me = { subsystemRole: "STUDENT" | "ALUMNI" | "LECTURER" | "STAFF" | "ADMIN" };

export const isRider = (role?: string) => role === "STUDENT" || role === "LECTURER";
export const isStaff = (role?: string) => role === "STAFF" || role === "ADMIN";

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

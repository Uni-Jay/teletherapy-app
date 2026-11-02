import { TIMEZONE } from "./constants";

export function naira(amount: number) {
  return "₦" + Math.round(amount).toLocaleString("en-NG");
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-NG", { timeZone: TIMEZONE, day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso)
  );
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-NG", { timeZone: TIMEZONE, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

/** Lagos is UTC+1 all year (no daylight saving), so local wall time → UTC is a fixed offset. */
export function lagosToUtc(dateYmd: string, timeHm: string) {
  return new Date(`${dateYmd}T${timeHm}:00+01:00`);
}

export function lagosYmd(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function lagosWeekday(dateYmd: string) {
  return new Date(`${dateYmd}T12:00:00+01:00`).getUTCDay();
}

export const STATUS_LABEL: Record<string, string> = {
  requested: "Awaiting therapist",
  accepted: "Confirmed",
  rejected: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
};

/** Current time in ms. Server pages here are rendered per request, so reading the clock is intended. */
export function nowMs() {
  return Date.now();
}

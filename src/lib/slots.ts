import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { lagosToUtc, lagosWeekday } from "@/lib/format";

export type Slot = { startsAt: string; endsAt: string; label: string };


/**
 * Free booking slots for a therapist on one day (Lagos time).
 * Slots start on the hour inside each availability window and last `session_minutes`.
 * `noticeHours` is how far ahead a slot must be (shorter with priority booking).
 */
export async function getSlots(therapistId: string, dateYmd: string, ignoreAppointmentId?: string, noticeHours = 24): Promise<Slot[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) return [];
  const admin = createAdminClient();
  const weekday = lagosWeekday(dateYmd);

  const [{ data: therapist }, { data: windows }, { data: blocked }] = await Promise.all([
    admin.from("therapist_profiles").select("session_minutes, status").eq("id", therapistId).single(),
    admin.from("availability").select("start_time, end_time").eq("therapist_id", therapistId).eq("weekday", weekday),
    admin.from("blocked_dates").select("id").eq("therapist_id", therapistId).eq("day", dateYmd),
  ]);
  if (!therapist || therapist.status !== "approved" || (blocked && blocked.length) || !windows?.length) return [];

  const dayStart = lagosToUtc(dateYmd, "00:00");
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  let q = admin
    .from("appointments")
    .select("id, starts_at, ends_at")
    .eq("therapist_id", therapistId)
    .in("status", ["requested", "accepted"])
    .gte("starts_at", dayStart.toISOString())
    .lt("starts_at", dayEnd.toISOString());
  if (ignoreAppointmentId) q = q.neq("id", ignoreAppointmentId);
  const { data: booked } = await q;

  const minutes = therapist.session_minutes || 50;
  const earliest = Date.now() + noticeHours * 60 * 60 * 1000;
  const slots: Slot[] = [];

  for (const w of windows) {
    const [sh, sm] = String(w.start_time).split(":").map(Number);
    const [eh, em] = String(w.end_time).split(":").map(Number);
    let cursor = sh * 60 + sm;
    const end = eh * 60 + em;
    // round up to the next hour
    if (cursor % 60) cursor += 60 - (cursor % 60);
    while (cursor + minutes <= end) {
      const hm = `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`;
      const start = lagosToUtc(dateYmd, hm);
      const finish = new Date(start.getTime() + minutes * 60000);
      const clash = (booked ?? []).some(
        (b) => new Date(b.starts_at) < finish && new Date(b.ends_at) > start
      );
      if (!clash && start.getTime() >= earliest) {
        const h = Math.floor(cursor / 60);
        const label = `${((h + 11) % 12) + 1}:${String(cursor % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
        slots.push({ startsAt: start.toISOString(), endsAt: finish.toISOString(), label });
      }
      cursor += 60;
    }
  }
  return slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

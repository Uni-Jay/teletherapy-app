import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addBlockedDate, removeBlockedDate } from "@/app/actions/therapist";
import { formatDate, lagosYmd } from "@/lib/format";
import { PageHeader } from "@/components/ui/misc";
import { AvailabilityForm } from "@/components/availability-form";
import { SubmitButton } from "@/components/ui/submit-button";

export const metadata = { title: "Availability" };

export default async function AvailabilityPage() {
  const user = await requireRole("therapist");
  const supabase = await createClient();
  const today = lagosYmd(new Date());
  const [{ data: hours }, { data: blocked }] = await Promise.all([
    supabase.from("availability").select("weekday, start_time, end_time").eq("therapist_id", user.id),
    supabase.from("blocked_dates").select("id, day").eq("therapist_id", user.id).gte("day", today).order("day"),
  ]);
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Availability" text="Set the weekly hours when patients can book you, and block off days you're away." />
      <div className="card"><AvailabilityForm current={hours ?? []} /></div>
      <div className="card">
        <p className="font-semibold">Days off</p>
        <form action={addBlockedDate} className="mt-3 flex gap-2">
          <input type="date" name="day" min={today} required className="input w-48" />
          <SubmitButton className="btn-secondary" pendingText="…">Block day</SubmitButton>
        </form>
        <ul className="mt-4 divide-y divide-black/5">
          {(blocked ?? []).length === 0 && <li className="py-2 text-sm text-muted">No days blocked.</li>}
          {(blocked ?? []).map((b) => (
            <li key={b.id} className="flex items-center justify-between py-2 text-sm">
              {formatDate(`${b.day}T12:00:00+01:00`)}
              <form action={removeBlockedDate}>
                <input type="hidden" name="id" value={b.id} />
                <button className="text-xs text-red-700">Remove</button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

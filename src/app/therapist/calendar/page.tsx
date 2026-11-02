import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { MonthCalendar, monthRange } from "@/components/month-calendar";

export const metadata = { title: "Calendar" };

export default async function TherapistCalendar({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requireRole("therapist");
  const { month, from, to } = monthRange((await searchParams).month);
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select("id, starts_at, type, status, patient:profiles!appointments_patient_id_fkey(full_name)")
    .eq("therapist_id", user.id)
    .gte("starts_at", from)
    .lt("starts_at", to)
    .order("starts_at");
  const events = (data ?? []).map((a) => ({
    id: a.id,
    starts_at: a.starts_at,
    type: a.type,
    status: a.status,
    title: (a.patient as unknown as { full_name: string } | null)?.full_name ?? "Patient",
    href: `/therapist/appointments/${a.id}`,
  }));
  return (
    <div>
      <PageHeader title="Calendar" text="Your sessions and requests by month. Times are Lagos time (WAT)." />
      <MonthCalendar month={month} events={events} basePath="/therapist/calendar" />
    </div>
  );
}

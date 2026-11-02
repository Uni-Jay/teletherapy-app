import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { MonthCalendar, monthRange } from "@/components/month-calendar";

export const metadata = { title: "Calendar" };

export default async function PatientCalendar({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requireRole("patient");
  const { month, from, to } = monthRange((await searchParams).month);
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select("id, starts_at, type, status, therapist:therapist_profiles(profiles!therapist_profiles_id_fkey(full_name))")
    .eq("patient_id", user.id)
    .gte("starts_at", from)
    .lt("starts_at", to)
    .order("starts_at");
  const events = (data ?? []).map((a) => ({
    id: a.id,
    starts_at: a.starts_at,
    type: a.type,
    status: a.status,
    title: (a.therapist as unknown as { profiles: { full_name: string } | null } | null)?.profiles?.full_name ?? "Session",
    href: a.status === "accepted" ? `/session/${a.id}` : "/patient/appointments",
  }));
  return (
    <div>
      <PageHeader title="Calendar" text="All your sessions at a glance. Times are Lagos time (WAT)." />
      <MonthCalendar month={month} events={events} basePath="/patient/calendar" />
    </div>
  );
}

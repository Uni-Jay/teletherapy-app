import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { firstName, formatDateTime, naira } from "@/lib/format";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/misc";
import { TherapistStatus } from "@/components/therapist-status";
import { BookingRequest, type RequestRow } from "@/components/booking-request";

export const metadata = { title: "Dashboard" };

export default async function TherapistHome() {
  const user = await requireRole("therapist");
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ data: tp }, { count: docCount }, { data: requests }, { data: upcoming }, { data: done }] = await Promise.all([
    supabase.from("therapist_profiles").select("status, rejection_reason, bio, specialties").eq("id", user.id).single(),
    supabase.from("therapist_documents").select("id", { count: "exact", head: true }).eq("therapist_id", user.id).eq("kind", "licence"),
    supabase
      .from("appointments")
      .select("id, starts_at, type, patient_note, rescheduled_from, patient:profiles!appointments_patient_id_fkey(full_name)")
      .eq("therapist_id", user.id)
      .eq("status", "requested")
      .gte("starts_at", now.toISOString())
      .order("starts_at"),
    supabase
      .from("appointments")
      .select("id, starts_at, type, patient:profiles!appointments_patient_id_fkey(full_name)")
      .eq("therapist_id", user.id)
      .eq("status", "accepted")
      .gte("ends_at", now.toISOString())
      .order("starts_at")
      .limit(5),
    supabase.from("appointments").select("therapist_fee").eq("therapist_id", user.id).eq("status", "completed").gte("starts_at", monthStart),
  ]);
  const earnings = (done ?? []).reduce((s, a) => s + (a.therapist_fee ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${firstName(user.fullName) || "back"}`} />
      {tp && <TherapistStatus status={tp.status} reason={tp.rejection_reason} hasLicence={(docCount ?? 0) > 0} profileDone={Boolean(tp.bio && tp.specialties?.length)} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="New requests" value={requests?.length ?? 0} href="/therapist/appointments" />
        <StatCard label="Upcoming sessions" value={upcoming?.length ?? 0} href="/therapist/appointments" />
        <StatCard label="Completed this month" value={done?.length ?? 0} />
        <StatCard label="Earned this month" value={naira(earnings)} href="/therapist/earnings" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-semibold">Booking requests</h2>
          {requests && requests.length > 0 ? (
            <div className="space-y-3">
              {(requests as unknown as RequestRow[]).map((r) => <BookingRequest key={r.id} r={r} />)}
            </div>
          ) : (
            <EmptyState title="No new requests" />
          )}
        </section>
        <section>
          <h2 className="mb-3 font-semibold">Next sessions</h2>
          {upcoming && upcoming.length > 0 ? (
            <div className="card divide-y divide-black/5 p-0">
              {(upcoming as unknown as { id: string; starts_at: string; type: string; patient: { full_name: string } | null }[]).map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="font-medium">{a.patient?.full_name}</p>
                    <p className="text-sm text-muted">{formatDateTime(a.starts_at)} · {a.type}</p>
                  </div>
                  <Link href={`/session/${a.id}`} className="btn-primary btn-sm">Start</Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No upcoming sessions" />
          )}
        </section>
      </div>
    </div>
  );
}

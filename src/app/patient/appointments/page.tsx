import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { formatDateTime, nowMs } from "@/lib/format";
import { cancelAppointment } from "@/app/actions/patient";
import { EmptyState, Notice, PageHeader, StatusBadge } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";

export const metadata = { title: "My sessions" };

type Appt = {
  id: string;
  starts_at: string;
  ends_at: string;
  type: string;
  status: string;
  status_reason: string | null;
  therapist_id: string;
  therapist: { profiles: { full_name: string } | null } | null;
};

export default async function PatientAppointments({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await requireRole("patient");
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at, type, status, status_reason, therapist_id, therapist:therapist_profiles(profiles!therapist_profiles_id_fkey(full_name))")
    .eq("patient_id", user.id)
    .order("starts_at", { ascending: false });
  const { cancellation_cutoff_hours } = await getSettings();
  const all = (data ?? []) as unknown as Appt[];
  const now = nowMs();
  const upcoming = all.filter((a) => ["requested", "accepted"].includes(a.status) && new Date(a.ends_at).getTime() > now).reverse();
  const history = all.filter((a) => !upcoming.includes(a));

  return (
    <div className="space-y-8">
      <PageHeader title="My sessions" action={<Link href="/patient/therapists" className="btn-primary">Book a session</Link>} />
      {sp.booked && <Notice kind="success">Session requested. We&apos;ll email you when your therapist confirms.</Notice>}
      {sp.rescheduled && <Notice kind="success">New time requested. Your therapist will confirm it.</Notice>}
      {sp.error === "cutoff" && (
        <Notice kind="error">Confirmed sessions can only be cancelled more than {cancellation_cutoff_hours} hours before they start.</Notice>
      )}

      <section>
        <h2 className="mb-3 font-semibold">Upcoming</h2>
        {upcoming.length === 0 ? (
          <EmptyState title="No upcoming sessions" />
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => {
              const hoursLeft = (new Date(a.starts_at).getTime() - now) / 3600000;
              const canChange = a.status === "requested" || hoursLeft >= cancellation_cutoff_hours;
              const joinable = a.status === "accepted" && hoursLeft < 0.25;
              return (
                <div key={a.id} className="card flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{formatDateTime(a.starts_at)}</p>
                    <p className="text-sm text-muted">
                      {a.type === "audio" ? "Audio" : "Video"} · {a.therapist?.profiles?.full_name}
                    </p>
                    <div className="mt-2"><StatusBadge status={a.status} /></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {a.status === "accepted" && (
                      <Link href={`/session/${a.id}`} className={joinable ? "btn-primary" : "btn-secondary"}>
                        {joinable ? "Join now" : "Session room"}
                      </Link>
                    )}
                    <Link href={`/patient/messages/${a.therapist_id}`} className="btn-secondary">Message</Link>
                    {canChange && (
                      <>
                        <Link href={`/patient/appointments/${a.id}/reschedule`} className="btn-secondary">Reschedule</Link>
                        <form action={cancelAppointment}>
                          <input type="hidden" name="id" value={a.id} />
                          <SubmitButton className="btn-danger" pendingText="Cancelling…">Cancel</SubmitButton>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Session history</h2>
        {history.length === 0 ? (
          <EmptyState title="No past sessions yet" />
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="table">
              <thead><tr><th>Date</th><th>Therapist</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>
                {history.map((a) => (
                  <tr key={a.id}>
                    <td>{formatDateTime(a.starts_at)}</td>
                    <td>{a.therapist?.profiles?.full_name}</td>
                    <td className="capitalize">{a.type}</td>
                    <td>
                      <StatusBadge status={a.status === "accepted" ? "completed" : a.status} />
                      {a.status_reason && <p className="mt-1 text-xs text-muted">{a.status_reason}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

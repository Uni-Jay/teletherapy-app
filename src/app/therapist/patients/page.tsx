import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { EmptyState, PageHeader } from "@/components/ui/misc";

export const metadata = { title: "Patients" };

export default async function TherapistPatients() {
  const user = await requireRole("therapist");
  const supabase = await createClient();
  const [{ data: appts }, { data: consents }] = await Promise.all([
    supabase
      .from("appointments")
      .select("patient_id, starts_at, status, patient:profiles!appointments_patient_id_fkey(full_name)")
      .eq("therapist_id", user.id)
      .in("status", ["requested", "accepted", "completed"])
      .order("starts_at", { ascending: false }),
    supabase.from("consents").select("patient_id, granted").eq("therapist_id", user.id),
  ]);
  const consent = new Map((consents ?? []).map((c) => [c.patient_id, c.granted]));
  const patients = new Map<string, { name: string; last: string; sessions: number }>();
  for (const a of (appts ?? []) as unknown as { patient_id: string; starts_at: string; status: string; patient: { full_name: string } | null }[]) {
    const p = patients.get(a.patient_id) ?? { name: a.patient?.full_name ?? "Patient", last: a.starts_at, sessions: 0 };
    if (a.status === "completed") p.sessions++;
    patients.set(a.patient_id, p);
  }
  return (
    <div>
      <PageHeader title="Patients" text="Patients who have booked with you. You can see their details only if they have given consent." />
      {patients.size === 0 ? (
        <EmptyState title="No patients yet" />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead><tr><th>Name</th><th>Last booking</th><th>Completed sessions</th><th>Access</th><th></th></tr></thead>
            <tbody>
              {[...patients].map(([id, p]) => (
                <tr key={id}>
                  <td className="font-medium">{p.name}</td>
                  <td>{formatDate(p.last)}</td>
                  <td>{p.sessions}</td>
                  <td>{consent.get(id) ? <span className="badge bg-brand-50 text-brand-800">Shared</span> : <span className="badge bg-ink/5 text-muted">Not shared</span>}</td>
                  <td className="text-right space-x-2">
                    <Link href={`/therapist/patients/${id}`} className="btn-secondary btn-sm">View</Link>
                    <Link href={`/therapist/messages/${id}`} className="btn-secondary btn-sm">Message</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

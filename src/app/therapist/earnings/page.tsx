import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, naira } from "@/lib/format";
import { EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/ui/misc";

export const metadata = { title: "Payments" };

export default async function Earnings() {
  const user = await requireRole("therapist");
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select("id, starts_at, therapist_fee, payout_status, patient:profiles!appointments_patient_id_fkey(full_name)")
    .eq("therapist_id", user.id)
    .eq("status", "completed")
    .order("starts_at", { ascending: false });
  const rows = (data ?? []) as unknown as { id: string; starts_at: string; therapist_fee: number; payout_status: string; patient: { full_name: string } | null }[];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const month = rows.filter((r) => new Date(r.starts_at) >= monthStart).reduce((s, r) => s + r.therapist_fee, 0);
  const unpaid = rows.filter((r) => r.payout_status === "unpaid").reduce((s, r) => s + r.therapist_fee, 0);
  const paid = rows.filter((r) => r.payout_status === "paid").reduce((s, r) => s + r.therapist_fee, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" text="Earnings from completed sessions. Payouts are made by the admin team." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="This month" value={naira(month)} />
        <StatCard label="Awaiting payout" value={naira(unpaid)} />
        <StatCard label="Paid out (all time)" value={naira(paid)} />
      </div>
      {rows.length === 0 ? (
        <EmptyState title="No completed sessions yet" text="Earnings appear here once sessions are marked as completed." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead><tr><th>Session</th><th>Patient</th><th>Fee</th><th>Payout</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}><td>{formatDateTime(r.starts_at)}</td><td>{r.patient?.full_name}</td><td>{naira(r.therapist_fee)}</td><td><StatusBadge status={r.payout_status} /></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

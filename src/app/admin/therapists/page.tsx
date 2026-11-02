import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui/misc";

export const metadata = { title: "Therapists" };

const TABS = ["pending", "approved", "rejected", "suspended"];

export default async function AdminTherapists({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireRole("admin");
  const { status: s } = await searchParams;
  const status = TABS.includes(s ?? "") ? s! : "pending";
  const db = createAdminClient();
  const { data } = await db
    .from("therapist_profiles")
    .select("id, title, status, created_at, specialties, licence_number, profiles!therapist_profiles_id_fkey(full_name, email), therapist_documents(id, kind)")
    .eq("status", status)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as {
    id: string; title: string | null; status: string; created_at: string; specialties: string[]; licence_number: string | null;
    profiles: { full_name: string; email: string } | null; therapist_documents: { id: string; kind: string }[];
  }[];

  return (
    <div>
      <PageHeader title="Therapists" text="Review applications and manage verified therapists." />
      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <Link key={t} href={`/admin/therapists?status=${t}`} className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${t === status ? "bg-brand-600 text-white" : "bg-white text-muted shadow-sm"}`}>
            {t}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState title={`No ${status} therapists`} />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead><tr><th>Name</th><th>Title</th><th>Licence</th><th>Documents</th><th>Applied</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((t) => {
                const hasLicence = t.therapist_documents.some((d) => d.kind === "licence");
                return (
                  <tr key={t.id}>
                    <td><p className="font-medium">{t.profiles?.full_name || "—"}</p><p className="text-xs text-muted">{t.profiles?.email}</p></td>
                    <td>{t.title ?? "—"}</td>
                    <td>{t.licence_number ?? "—"}</td>
                    <td>{t.therapist_documents.length} {hasLicence ? "" : <span className="badge ml-1 bg-amber-50 text-amber-800">No licence</span>}</td>
                    <td>{formatDate(t.created_at)}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="text-right"><Link href={`/admin/therapists/${t.id}`} className="btn-secondary btn-sm">Review</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

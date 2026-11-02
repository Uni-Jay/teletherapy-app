import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteDocument } from "@/app/actions/therapist";
import { formatDate } from "@/lib/format";
import { PageHeader, StatusBadge, Notice } from "@/components/ui/misc";
import { DocumentUpload } from "@/components/document-upload";
import { SubmitButton } from "@/components/ui/submit-button";

export const metadata = { title: "Licence & documents" };

const KIND: Record<string, string> = { licence: "Licence", qualification: "Qualification", certification: "Certification" };

export default async function DocumentsPage() {
  const user = await requireRole("therapist");
  const supabase = await createClient();
  const [{ data: tp }, { data: docs }] = await Promise.all([
    supabase.from("therapist_profiles").select("status, rejection_reason").eq("id", user.id).single(),
    supabase.from("therapist_documents").select("*").eq("therapist_id", user.id).order("created_at", { ascending: false }),
  ]);
  const links = await Promise.all(
    (docs ?? []).map(async (d) => (await supabase.storage.from("therapist-docs").createSignedUrl(d.storage_path, 600)).data?.signedUrl ?? null)
  );
  const hasLicence = (docs ?? []).some((d) => d.kind === "licence");

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Licence & documents" text="Upload your professional licence for verification, plus any qualifications and certifications." />
      <div className="card flex items-center justify-between">
        <span className="font-medium">Verification status</span>
        <StatusBadge status={tp?.status ?? "pending"} />
      </div>
      {tp?.status === "rejected" && tp.rejection_reason && <Notice kind="error">Reviewer note: {tp.rejection_reason}</Notice>}
      {!hasLicence && <Notice kind="warning">Upload your professional licence so our team can verify your account.</Notice>}
      <div className="card"><DocumentUpload userId={user.id} /></div>
      <div className="card p-0">
        <table className="table">
          <thead><tr><th>Document</th><th>Type</th><th>Uploaded</th><th></th></tr></thead>
          <tbody>
            {(docs ?? []).length === 0 && (
              <tr><td colSpan={4} className="text-center text-muted">No documents uploaded yet.</td></tr>
            )}
            {(docs ?? []).map((d, i) => (
              <tr key={d.id}>
                <td>{links[i] ? <a href={links[i]!} target="_blank" rel="noopener" className="text-brand-700">{d.title}</a> : d.title}</td>
                <td>{KIND[d.kind]}</td>
                <td>{formatDate(d.created_at)}</td>
                <td className="text-right">
                  <form action={deleteDocument}>
                    <input type="hidden" name="id" value={d.id} />
                    <SubmitButton className="btn-danger btn-sm" pendingText="…">Delete</SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

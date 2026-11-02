import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Avatar } from "@/components/avatar";

export const metadata = { title: "Messages" };

export default async function PatientMessages() {
  const user = await requireRole("patient");
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select("therapist_id, therapist:therapist_profiles(photo_url, profiles!therapist_profiles_id_fkey(full_name))")
    .eq("patient_id", user.id)
    .in("status", ["requested", "accepted", "completed"]);
  const { data: unread } = await supabase.from("messages").select("therapist_id").eq("patient_id", user.id).neq("sender_id", user.id).is("read_at", null);
  const seen = new Map<string, { name: string; photo: string | null }>();
  for (const row of (data ?? []) as unknown as { therapist_id: string; therapist: { photo_url: string | null; profiles: { full_name: string } | null } | null }[]) {
    seen.set(row.therapist_id, { name: row.therapist?.profiles?.full_name ?? "Therapist", photo: row.therapist?.photo_url ?? null });
  }
  return (
    <div className="max-w-2xl">
      <PageHeader title="Messages" text="Secure messages with your therapists." />
      {seen.size === 0 ? (
        <EmptyState title="No conversations yet" text="You can message a therapist after booking a session with them." />
      ) : (
        <div className="space-y-2">
          {[...seen].map(([id, t]) => {
            const count = (unread ?? []).filter((u) => u.therapist_id === id).length;
            return (
              <Link key={id} href={`/patient/messages/${id}`} className="card flex items-center gap-3 py-3 hover:border-brand-300">
                <Avatar name={t.name} url={t.photo} size={40} />
                <span className="flex-1 font-medium">{t.name}</span>
                {count > 0 && <span className="badge bg-brand-600 text-white">{count}</span>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Avatar } from "@/components/avatar";

export const metadata = { title: "Messages" };

export default async function TherapistMessages() {
  const user = await requireRole("therapist");
  const supabase = await createClient();
  const [{ data }, { data: unread }] = await Promise.all([
    supabase
      .from("appointments")
      .select("patient_id, patient:profiles!appointments_patient_id_fkey(full_name)")
      .eq("therapist_id", user.id)
      .in("status", ["requested", "accepted", "completed"]),
    supabase.from("messages").select("patient_id").eq("therapist_id", user.id).neq("sender_id", user.id).is("read_at", null),
  ]);
  const people = new Map<string, string>();
  for (const r of (data ?? []) as unknown as { patient_id: string; patient: { full_name: string } | null }[]) people.set(r.patient_id, r.patient?.full_name ?? "Patient");
  return (
    <div className="max-w-2xl">
      <PageHeader title="Messages" text="Secure messages with your patients." />
      {people.size === 0 ? (
        <EmptyState title="No conversations yet" />
      ) : (
        <div className="space-y-2">
          {[...people].map(([id, name]) => {
            const count = (unread ?? []).filter((u) => u.patient_id === id).length;
            return (
              <Link key={id} href={`/therapist/messages/${id}`} className="card flex items-center gap-3 py-3 hover:border-brand-300">
                <Avatar name={name} size={40} />
                <span className="flex-1 font-medium">{name}</span>
                {count > 0 && <span className="badge bg-brand-600 text-white">{count}</span>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

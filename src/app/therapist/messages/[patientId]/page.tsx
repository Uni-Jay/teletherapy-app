import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Chat } from "@/components/chat";

export const metadata = { title: "Conversation" };

export default async function TherapistChat({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const user = await requireRole("therapist");
  const supabase = await createClient();
  const [{ data: p }, { data: msgs }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", patientId).single(),
    supabase.from("messages").select("id, sender_id, body, created_at").eq("patient_id", patientId).eq("therapist_id", user.id).order("created_at").limit(500),
  ]);
  return (
    <div className="max-w-3xl">
      <Link href="/therapist/messages" className="text-sm text-brand-700">← Messages</Link>
      <div className="mt-4">
        <Chat patientId={patientId} therapistId={user.id} meId={user.id} otherName={p?.full_name ?? "Patient"} otherSubtitle="Your patient" initial={msgs ?? []} />
      </div>
    </div>
  );
}

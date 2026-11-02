import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Chat } from "@/components/chat";

export const metadata = { title: "Conversation" };

export default async function PatientChat({ params }: { params: Promise<{ therapistId: string }> }) {
  const { therapistId } = await params;
  const user = await requireRole("patient");
  const supabase = await createClient();
  const [{ data: t }, { data: msgs }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", therapistId).single(),
    supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("patient_id", user.id)
      .eq("therapist_id", therapistId)
      .order("created_at")
      .limit(500),
  ]);
  return (
    <div className="max-w-3xl">
      <Link href="/patient/messages" className="text-sm text-brand-700">← Messages</Link>
      <div className="mt-4">
        <Chat patientId={user.id} therapistId={therapistId} meId={user.id} otherName={t?.full_name ?? "Therapist"} initial={msgs ?? []} />
      </div>
    </div>
  );
}

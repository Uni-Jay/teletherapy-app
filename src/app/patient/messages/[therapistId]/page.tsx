import { getEntitlements, hasFeature } from "@/lib/plans";
import { UpgradeGate } from "@/components/upgrade-gate";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Chat } from "@/components/chat";

export const metadata = { title: "Conversation" };

export default async function PatientChat({ params, searchParams }: { params: Promise<{ therapistId: string }>; searchParams: Promise<{ call?: string }> }) {
  const { therapistId } = await params;
  const sp = await searchParams;
  const user = await requireRole("patient");
  const ent = await getEntitlements(user.id);
  if (!hasFeature(ent, "messaging")) return <UpgradeGate feature="messaging" ent={ent} />;
  const supabase = await createClient();
  
  const [{ data: t }, { data: tp }, { data: msgs }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", therapistId).single(),
    supabase.from("therapist_profiles").select("photo_url, title").eq("id", therapistId).maybeSingle(),
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
        <Chat patientId={user.id} therapistId={therapistId} meId={user.id} otherName={t?.full_name ?? "Therapist"} otherPhoto={tp?.photo_url ?? null} otherSubtitle={tp?.title ?? "Therapist"} initial={msgs ?? []} canMessage={ent.features.messaging} canCall={ent.features.chatCalls} callLocked={sp.call === "locked"} lockedNote={ent.active ? `Messaging is included in the Standard, Premium and Family plans. You're on ${ent.planName}.` : "Choose a plan to message your therapist."} />
      </div>
    </div>
  );
}

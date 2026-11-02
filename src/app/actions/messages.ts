"use server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function sendMessage(patientId: string, therapistId: string, body: string) {
  const user = await getCurrentUser();
  if (!user || (user.id !== patientId && user.id !== therapistId)) return { error: "Not allowed" };
  const text = body.trim().slice(0, 4000);
  if (!text) return { error: "Empty message" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ patient_id: patientId, therapist_id: therapistId, sender_id: user.id, body: text })
    .select("id, sender_id, body, created_at")
    .single();
  if (error) return { error: "You can message a therapist once you have booked a session with them." };
  return { message: data };
}

export async function markRead(patientId: string, therapistId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  const supabase = await createClient();
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("patient_id", patientId)
    .eq("therapist_id", therapistId)
    .neq("sender_id", user.id)
    .is("read_at", null);
}

import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications";

type Ctx = { params: Promise<{ id: string }> };

/** POST { action: "accept" | "decline" | "end" | "missed" } */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const raw = await request.text();
  const { action } = (JSON.parse(raw || "{}") as { action?: string }) ?? {};
  const { data: call } = await supabase.from("calls").select("id, caller_id, callee_id, status, type, appointment_id").eq("id", id).single();
  if (!call) return NextResponse.json({ error: "not found" }, { status: 404 });
  const now = new Date().toISOString();

  if (action === "accept" && call.callee_id === user.id && call.status === "ringing") {
    await supabase.from("calls").update({ status: "ongoing", answered_at: now }).eq("id", id);
  } else if (action === "decline" && call.callee_id === user.id && call.status === "ringing") {
    await supabase.from("calls").update({ status: "declined", ended_at: now }).eq("id", id);
  } else if (action === "missed" && call.caller_id === user.id && call.status === "ringing") {
    await supabase.from("calls").update({ status: "missed", ended_at: now }).eq("id", id);
    const { data: caller } = await createAdminClient().from("profiles").select("full_name").eq("id", user.id).single();
    await notify(call.callee_id, {
      kind: "missed_call",
      title: `Missed ${call.type === "audio" ? "voice" : "video"} call from ${caller?.full_name ?? "your contact"}`,
      body: "Open your messages to reply or call back.",
      link: "/" + (await roleHome(call.callee_id)) + "/messages",
    });
  } else if (action === "end" && ["ringing", "ongoing"].includes(call.status)) {
    await supabase.from("calls").update({ status: call.status === "ringing" && call.caller_id === user.id ? "cancelled" : "ended", ended_at: now }).eq("id", id);
  }
  return NextResponse.json({ ok: true });
}

async function roleHome(userId: string) {
  const { data } = await createAdminClient().from("profiles").select("role").eq("id", userId).single();
  return data?.role === "therapist" ? "therapist" : "patient";
}

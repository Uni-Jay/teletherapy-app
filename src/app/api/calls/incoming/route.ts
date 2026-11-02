import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Ringing calls for the signed-in person from the last minute. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ calls: [] }, { status: 401 });
  const { data } = await supabase
    .from("calls")
    .select("id, caller_id, type, appointment_id, created_at")
    .eq("callee_id", user.id)
    .eq("status", "ringing")
    .gte("created_at", new Date(Date.now() - 60000).toISOString())
    .order("created_at", { ascending: false })
    .limit(1);
  const call = data?.[0];
  if (!call) return NextResponse.json({ userId: user.id, calls: [] });
  const { data: caller } = await supabase.from("profiles").select("full_name").eq("id", call.caller_id).single();
  return NextResponse.json({ userId: user.id, calls: [{ ...call, caller_name: caller?.full_name ?? "Someone" }] });
}

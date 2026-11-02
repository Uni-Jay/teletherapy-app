import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET ?after=<id>  → new signals from the other person, plus the call's status.
 * GET ?after=-1    → just the current cursor, used when someone first joins.
 */
export async function GET(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const { data: call } = await supabase.from("calls").select("status, answered_at, ended_at").eq("id", id).single();
  if (!call) return NextResponse.json({ error: "not found" }, { status: 404 });

  const after = Number(request.nextUrl.searchParams.get("after") ?? "0");
  if (after < 0) {
    const { data: last } = await supabase.from("call_signals").select("id").eq("call_id", id).order("id", { ascending: false }).limit(1).maybeSingle();
    return NextResponse.json({ call, cursor: last?.id ?? 0, signals: [] });
  }
  const { data: signals } = await supabase
    .from("call_signals")
    .select("id, from_session, to_session, kind, payload")
    .eq("call_id", id)
    .gt("id", after)
    .neq("sender_id", user.id)
    .order("id")
    .limit(200);
  const { data: last } = await supabase.from("call_signals").select("id").eq("call_id", id).order("id", { ascending: false }).limit(1).maybeSingle();
  return NextResponse.json({ call, cursor: Math.max(after, last?.id ?? 0), signals: signals ?? [] });
}

/** POST { kind, payload, from, to } — sends one signal to the other person. */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "signed out" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { kind?: string; payload?: unknown; from?: string; to?: string | null } | null;
  if (!body?.kind || !body.from || !["hello", "offer", "answer", "ice", "bye"].includes(body.kind)) {
    return NextResponse.json({ error: "bad signal" }, { status: 400 });
  }
  const { error } = await supabase.from("call_signals").insert({
    call_id: id,
    sender_id: user.id,
    from_session: body.from.slice(0, 64),
    to_session: body.to ? String(body.to).slice(0, 64) : null,
    kind: body.kind,
    payload: body.payload ?? null,
  });
  if (error) return NextResponse.json({ error: "call is not active" }, { status: 409 });
  return NextResponse.json({ ok: true });
}

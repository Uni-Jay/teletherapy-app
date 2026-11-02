import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ items: [], unread: 0 }, { status: 401 });
  const [{ data: items }, { count }] = await Promise.all([
    supabase.from("notifications").select("id, kind, title, body, link, read_at, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
  ]);
  return NextResponse.json({ userId: user.id, items: items ?? [], unread: count ?? 0 });
}

/** Marks notifications as read: { ids: [...] } or { all: true } */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { ids?: string[]; all?: boolean };
  let q = supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
  if (!body.all) q = q.in("id", (body.ids ?? []).slice(0, 100));
  await q;
  return NextResponse.json({ ok: true });
}

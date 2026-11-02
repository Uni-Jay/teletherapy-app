import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";

/** Counts the click for the admin dashboard, then sends the visitor to the Telegram channel. */
export async function GET() {
  const settings = await getSettings();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await createAdminClient().from("events").insert({ user_id: user?.id ?? null, kind: "telegram_click" });
  return NextResponse.redirect(settings.telegram_link);
}

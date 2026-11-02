"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail, emailLayout } from "@/lib/notify";

export type ActionState = { error?: string; message?: string } | undefined;

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

export async function reviewTherapist(form: FormData) {
  await requireRole("admin");
  const id = String(form.get("id"));
  const decision = String(form.get("decision"));
  const reason = String(form.get("reason") ?? "").slice(0, 500) || null;
  const admin = createAdminClient();
  const status = decision === "approve" ? "approved" : decision === "suspend" ? "suspended" : "rejected";
  await admin
    .from("therapist_profiles")
    .update({ status, rejection_reason: status === "approved" ? null : reason, approved_at: status === "approved" ? new Date().toISOString() : null })
    .eq("id", id);

  const { data: p } = await admin.from("profiles").select("email, full_name").eq("id", id).single();
  if (p?.email) {
    const site = await siteUrl();
    if (status === "approved") {
      await sendEmail(p.email, "Your therapist account is approved", emailLayout("Welcome aboard!", "<p>Your licence has been verified. Patients can now find and book you. Make sure your working hours are up to date.</p>", { label: "Open your portal", url: `${site}/therapist` }));
    } else if (status === "rejected") {
      await sendEmail(p.email, "Update on your application", emailLayout("Your application needs attention", `<p>We couldn't verify your application${reason ? `: ${reason}` : "."}</p><p>Please update your documents and upload your licence again.</p>`, { label: "Update documents", url: `${site}/therapist/documents` }));
    }
  }
  revalidatePath("/admin", "layout");
}

export async function setUserActive(form: FormData) {
  const me = await requireRole("admin");
  const id = String(form.get("id"));
  if (id === me.id) return;
  const active = form.get("active") === "true";
  await createAdminClient().from("profiles").update({ is_active: active }).eq("id", id);
  revalidatePath("/admin", "layout");
}

export async function resolveReport(form: FormData) {
  const me = await requireRole("admin");
  await createAdminClient()
    .from("reports")
    .update({ status: "resolved", resolved_by: me.id, resolved_at: new Date().toISOString(), resolution_note: String(form.get("note") ?? "").slice(0, 1000) || null })
    .eq("id", String(form.get("id")));
  revalidatePath("/admin", "layout");
}

export async function markPayout(form: FormData) {
  await requireRole("admin");
  const ids = form.getAll("ids").map(String);
  if (!ids.length) return;
  await createAdminClient().from("appointments").update({ payout_status: "paid" }).in("id", ids).eq("status", "completed");
  revalidatePath("/admin", "layout");
}

export async function saveSettings(_: ActionState, form: FormData): Promise<ActionState> {
  await requireRole("admin");
  const telegram = String(form.get("telegram_link") ?? "").trim();
  const cutoff = Number(form.get("cancellation_cutoff_hours"));
  if (!/^https:\/\/(t\.me|telegram\.me)\//.test(telegram)) return { error: "Enter a Telegram link starting with https://t.me/" };
  if (!(cutoff >= 0 && cutoff <= 168)) return { error: "Cut-off must be between 0 and 168 hours." };
  const helplines = String(form.get("helplines") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.lastIndexOf(":");
      return i > 0 ? { name: l.slice(0, i).trim(), phone: l.slice(i + 1).trim() } : null;
    })
    .filter(Boolean);
  if (!helplines.length) return { error: "Add at least one helpline, one per line, as Name: number" };

  const admin = createAdminClient();
  const now = new Date().toISOString();
  await admin.from("settings").upsert([
    { key: "telegram_link", value: telegram, updated_at: now },
    { key: "cancellation_cutoff_hours", value: cutoff, updated_at: now },
    { key: "helplines", value: helplines, updated_at: now },
  ]);
  revalidatePath("/", "layout");
  return { message: "Settings saved." };
}

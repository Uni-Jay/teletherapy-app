import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail, sendSms, emailLayout } from "@/lib/notify";

export type NotifyInput = {
  kind: string;
  title: string;
  body?: string;
  link?: string;
  /** Also email the person (respects their email preference). */
  email?: boolean;
  /** Also text the person (respects their SMS preference). */
  sms?: string;
};

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "";
}

/** Creates an in-app notification and, where asked and allowed, an email and SMS. */
export async function notify(userId: string, n: NotifyInput) {
  const admin = createAdminClient();
  await admin.from("notifications").insert({ user_id: userId, kind: n.kind, title: n.title, body: n.body ?? null, link: n.link ?? null });
  if (!n.email && !n.sms) return;
  const { data: p } = await admin.from("profiles").select("email, phone, notify_email, notify_sms").eq("id", userId).single();
  if (!p) return;
  if (n.email && p.email && p.notify_email) {
    await sendEmail(
      p.email,
      n.title,
      emailLayout(n.title, n.body ? `<p>${n.body}</p>` : "", n.link ? { label: "Open", url: `${siteUrl()}${n.link}` } : undefined)
    );
  }
  if (n.sms && p.phone && p.notify_sms) await sendSms(p.phone, n.sms);
}

export async function notifyAdmins(n: NotifyInput) {
  const { data } = await createAdminClient().from("profiles").select("id").eq("role", "admin").eq("is_active", true);
  await Promise.all((data ?? []).map((a) => notify(a.id, n)));
}

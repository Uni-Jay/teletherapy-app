import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail, sendSms, emailLayout } from "@/lib/notify";
import { formatDateTime } from "@/lib/format";

/**
 * Sends appointment reminders 24 hours and 1 hour before each confirmed session.
 * Call every 15 minutes (Vercel Cron, cron-job.org, or your host's scheduler) with:
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const qs = request.nextUrl.searchParams.get("secret");
  if (!secret || (auth !== `Bearer ${secret}` && qs !== secret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const admin = createAdminClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const now = Date.now();
  let sent = 0;

  const windows = [
    { flag: "reminder_24h_sent", from: now + 60 * 60000, to: now + 24 * 3600000, label: "coming up" },
    { flag: "reminder_1h_sent", from: now, to: now + 60 * 60000, label: "in about an hour" },
  ] as const;

  for (const w of windows) {
    const { data: appts } = await admin
      .from("appointments")
      .select("id, starts_at, type, patient_id, therapist_id")
      .eq("status", "accepted")
      .eq(w.flag, false)
      .gte("starts_at", new Date(w.from).toISOString())
      .lte("starts_at", new Date(w.to).toISOString())
      .limit(200);

    for (const a of appts ?? []) {
      const { data: people } = await admin.from("profiles").select("id, full_name, email, phone").in("id", [a.patient_id, a.therapist_id]);
      const patient = people?.find((p) => p.id === a.patient_id);
      const therapist = people?.find((p) => p.id === a.therapist_id);
      const when = formatDateTime(a.starts_at);
      const link = `${site}/session/${a.id}`;

      for (const [person, other] of [
        [patient, therapist],
        [therapist, patient],
      ] as const) {
        if (!person) continue;
        if (person.email) {
          await sendEmail(
            person.email,
            `Reminder: session ${w.label}`,
            emailLayout(`Your ${a.type} session is ${w.label}`, `<p>Your session with ${other?.full_name ?? "your " + (person === patient ? "therapist" : "patient")} is on <b>${when}</b> (Lagos time).</p><p>The room opens 15 minutes before the start time.</p>`, { label: "Open session room", url: link })
          );
        }
        await sendSms(person.phone, `Reminder: your ${a.type} session is ${w.label}, ${when}. Join at ${link}`);
      }
      await admin.from("appointments").update({ [w.flag]: true, ...(w.flag === "reminder_1h_sent" ? { reminder_24h_sent: true } : {}) }).eq("id", a.id);
      sent++;
    }
  }
  return NextResponse.json({ ok: true, reminders: sent });
}

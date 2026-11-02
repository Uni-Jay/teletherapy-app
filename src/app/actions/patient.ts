"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import { requireRole } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { QUESTIONS, scoreAnswers, type Answers } from "@/lib/assessment";
import { summariseAssessment } from "@/lib/ai";
import { getSlots, type Slot } from "@/lib/slots";
import { getSettings } from "@/lib/settings";
import { sendEmail, emailLayout } from "@/lib/notify";
import { formatDateTime } from "@/lib/format";
import { PLANS, type PlanKey } from "@/lib/constants";
import { initializeTransaction, disableSubscription } from "@/lib/paystack";
import { headers } from "next/headers";

export type ActionState = { error?: string; message?: string } | undefined;

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

// ---------------- Assessment ----------------
export async function submitAssessment(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole("patient");
  const answers = {} as Answers;
  for (const q of QUESTIONS) {
    const v = Number(form.get(q.id));
    if (!(v >= 0 && v <= 3)) return { error: "Please answer every question." };
    answers[q.id] = v;
  }
  answers.notes = String(form.get("notes") ?? "").slice(0, 2000);

  const admin = createAdminClient();
  const { data: pp } = await admin
    .from("patient_profiles")
    .select("concerns, support_areas, preferred_support")
    .eq("id", user.id)
    .single();

  const scores = scoreAnswers(answers);
  const ai = await summariseAssessment({
    answers,
    scores,
    concerns: pp?.concerns ?? [],
    supportAreas: pp?.support_areas ?? [],
    preferred: pp?.preferred_support ?? "either",
  });
  const risk = ai.crisis_language ? "high" : scores.risk;

  const { data: row, error } = await admin
    .from("assessments")
    .insert({
      patient_id: user.id,
      answers,
      mood_score: scores.mood,
      anxiety_score: scores.anxiety,
      total_score: scores.total,
      risk,
      summary: ai.summary,
      recommended_specialties: ai.recommended_specialties,
      recommended_support: ai.recommended_support,
    })
    .select("id")
    .single();
  if (error || !row) return { error: "We couldn't save your assessment. Please try again." };

  await admin.from("events").insert({ user_id: user.id, kind: "assessment" });
  if (risk === "high") {
    await admin.from("reports").insert({
      reporter_id: null,
      subject_id: user.id,
      source: "ai",
      reason: "Assessment indicates possible risk of self-harm",
      details: `Assessment ${row.id}. Please review and reach out to this patient promptly.`,
    });
    if (process.env.ADMIN_ALERT_EMAIL) {
      await sendEmail(
        process.env.ADMIN_ALERT_EMAIL,
        "Urgent: high-risk assessment flagged",
        emailLayout("A patient's assessment was flagged", `<p>${user.fullName} submitted an assessment that indicates possible risk. Please review it in the admin dashboard.</p>`, {
          label: "Open reports",
          url: `${await siteUrl()}/admin/reports`,
        })
      );
    }
  }
  redirect(`/patient/assessment/${row.id}`);
}

// ---------------- Mood check-in ----------------
export async function addMoodCheckin(form: FormData) {
  const user = await requireRole("patient");
  const mood = Number(form.get("mood"));
  if (!(mood >= 1 && mood <= 10)) return;
  const supabase = await createClient();
  await supabase.from("mood_checkins").insert({ patient_id: user.id, mood, note: String(form.get("note") ?? "").slice(0, 500) || null });
  await supabase.from("events").insert({ user_id: user.id, kind: "checkin" });
  revalidatePath("/patient");
  revalidatePath("/patient/progress");
}

// ---------------- Booking ----------------
export async function fetchSlots(therapistId: string, dateYmd: string, ignoreAppointmentId?: string): Promise<Slot[]> {
  await requireRole("patient");
  return getSlots(therapistId, dateYmd, ignoreAppointmentId);
}

async function hasActiveSubscription(patientId: string) {
  const { data } = await createAdminClient()
    .from("subscriptions")
    .select("id")
    .eq("patient_id", patientId)
    .in("status", ["active", "cancelled"]) // cancelled plans stay usable until the paid period ends
    .gt("current_period_end", new Date().toISOString())
    .limit(1);
  return Boolean(data?.length);
}

export async function bookAppointment(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole("patient");
  const therapistId = String(form.get("therapist_id"));
  const startsAt = String(form.get("starts_at"));
  const type = form.get("type") === "audio" ? "audio" : "video";
  const note = String(form.get("note") ?? "").slice(0, 1000);
  const shareDetails = form.get("share") === "on";

  if (process.env.REQUIRE_SUBSCRIPTION_TO_BOOK !== "false" && !(await hasActiveSubscription(user.id))) {
    return { error: "You need an active plan to book a session. Choose a plan on the Subscription page." };
  }

  const dateYmd = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date(startsAt));
  const slot = (await getSlots(therapistId, dateYmd)).find((s) => s.startsAt === new Date(startsAt).toISOString());
  if (!slot) return { error: "That time is no longer available. Please pick another slot." };

  const admin = createAdminClient();
  const { data: therapist } = await admin.from("therapist_profiles").select("session_price").eq("id", therapistId).single();

  const supabase = await createClient();
  const { error } = await supabase.from("appointments").insert({
    patient_id: user.id,
    therapist_id: therapistId,
    starts_at: slot.startsAt,
    ends_at: slot.endsAt,
    type,
    patient_note: note || null,
    therapist_fee: therapist?.session_price ?? 0,
  });
  if (error) return { error: error.code === "23505" ? "Someone just booked that slot. Please pick another." : "Could not book. Please try again." };

  await supabase
    .from("consents")
    .upsert({ patient_id: user.id, therapist_id: therapistId, granted: shareDetails, updated_at: new Date().toISOString() });

  const { data: tp } = await admin.from("profiles").select("email, full_name").eq("id", therapistId).single();
  if (tp?.email) {
    await sendEmail(
      tp.email,
      "New session request",
      emailLayout(
        "You have a new booking request",
        `<p>${user.fullName} requested a ${type} session on <b>${formatDateTime(slot.startsAt)}</b>.</p><p>Please accept or decline it in your portal.</p>`,
        { label: "Review request", url: `${await siteUrl()}/therapist/appointments` }
      )
    );
  }
  redirect("/patient/appointments?booked=1");
}

export async function cancelAppointment(form: FormData) {
  const user = await requireRole("patient");
  const id = String(form.get("id"));
  const supabase = await createClient();
  const { data: appt } = await supabase.from("appointments").select("starts_at, status, therapist_id").eq("id", id).single();
  if (!appt || !["requested", "accepted"].includes(appt.status)) return;
  const { cancellation_cutoff_hours } = await getSettings();
  const hoursLeft = (new Date(appt.starts_at).getTime() - Date.now()) / 3600000;
  if (appt.status === "accepted" && hoursLeft < cancellation_cutoff_hours) {
    redirect(`/patient/appointments?error=cutoff`);
  }
  await supabase
    .from("appointments")
    .update({ status: "cancelled", status_reason: String(form.get("reason") ?? "") || "Cancelled by patient" })
    .eq("id", id);
  const { data: tp } = await createAdminClient().from("profiles").select("email").eq("id", appt.therapist_id).single();
  if (tp?.email) {
    await sendEmail(tp.email, "Session cancelled", emailLayout("A session was cancelled", `<p>${user.fullName} cancelled the session on ${formatDateTime(appt.starts_at)}.</p>`));
  }
  revalidatePath("/patient/appointments");
}

export async function rescheduleAppointment(_: ActionState, form: FormData): Promise<ActionState> {
  await requireRole("patient");
  const id = String(form.get("id"));
  const startsAt = String(form.get("starts_at"));
  const supabase = await createClient();
  const { data: appt } = await supabase.from("appointments").select("therapist_id, status, starts_at").eq("id", id).single();
  if (!appt || !["requested", "accepted"].includes(appt.status)) return { error: "This appointment can no longer be changed." };

  const { cancellation_cutoff_hours } = await getSettings();
  if (appt.status === "accepted" && (new Date(appt.starts_at).getTime() - Date.now()) / 3600000 < cancellation_cutoff_hours) {
    return { error: `Sessions can only be rescheduled more than ${cancellation_cutoff_hours} hours in advance.` };
  }
  const dateYmd = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date(startsAt));
  const slot = (await getSlots(appt.therapist_id, dateYmd, id)).find((s) => s.startsAt === new Date(startsAt).toISOString());
  if (!slot) return { error: "That time is no longer available." };

  const { error } = await supabase
    .from("appointments")
    .update({ starts_at: slot.startsAt, ends_at: slot.endsAt, reminder_24h_sent: false, reminder_1h_sent: false })
    .eq("id", id);
  if (error) return { error: "Could not reschedule. Please try another time." };
  redirect("/patient/appointments?rescheduled=1");
}

// ---------------- Consent ----------------
export async function setConsent(form: FormData) {
  const user = await requireRole("patient");
  const supabase = await createClient();
  await supabase.from("consents").upsert({
    patient_id: user.id,
    therapist_id: String(form.get("therapist_id")),
    granted: form.get("granted") === "true",
    updated_at: new Date().toISOString(),
  });
  revalidatePath("/patient/privacy");
}

// ---------------- Reports ----------------
export async function reportConcern(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole("patient");
  const reason = String(form.get("reason") ?? "").trim();
  if (!reason) return { error: "Please tell us what happened." };
  const supabase = await createClient();
  await supabase.from("reports").insert({
    reporter_id: user.id,
    subject_id: (form.get("subject_id") as string) || null,
    source: "user",
    reason: reason.slice(0, 200),
    details: String(form.get("details") ?? "").slice(0, 3000) || null,
  });
  return { message: "Thank you. Our team will review your report." };
}

// ---------------- Subscription ----------------
export async function startSubscription(form: FormData) {
  const user = await requireRole("patient");
  const planKey = String(form.get("plan")) as PlanKey;
  const plan = PLANS.find((p) => p.key === planKey);
  if (!plan || !user.email) redirect("/patient/subscription?error=plan");

  const reference = `sub_${crypto.randomUUID().replace(/-/g, "")}`;
  const admin = createAdminClient();
  await admin.from("payments").insert({ patient_id: user.id, reference, plan: plan.key, amount_kobo: plan.price * 100 });

  let url: string;
  try {
    const tx = await initializeTransaction({
      email: user.email,
      amountKobo: plan.price * 100,
      plan: process.env[plan.envCode],
      reference,
      callbackUrl: `${await siteUrl()}/patient/subscription/callback`,
      metadata: { patient_id: user.id, plan: plan.key },
    });
    url = tx.authorization_url;
  } catch (e) {
    console.error(e);
    redirect("/patient/subscription?error=paystack");
  }
  redirect(url);
}

export async function cancelSubscription() {
  const user = await requireRole("patient");
  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, paystack_subscription_code, paystack_email_token")
    .eq("patient_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (!sub) return;
  if (sub.paystack_subscription_code && sub.paystack_email_token) {
    try {
      await disableSubscription(sub.paystack_subscription_code, sub.paystack_email_token);
    } catch (e) {
      console.error("Paystack disable failed", e);
    }
  }
  // Access continues until the end of the paid period; it just won't renew.
  await admin.from("subscriptions").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", sub.id);
  revalidatePath("/patient/subscription");
}

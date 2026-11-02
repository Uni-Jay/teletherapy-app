"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { homeFor, type Role } from "@/lib/auth";
import { CONCERNS, GENDERS, NIGERIAN_STATES, SUPPORT_AREAS } from "@/lib/constants";

export type FormState = { error?: string; message?: string } | undefined;

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { error: error?.message === "Email not confirmed" ? "Please confirm your email first. Check your inbox." : "Incorrect email or password." };
  }
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", data.user.id).single();
  await admin.from("events").insert({ user_id: data.user.id, kind: "login" });
  await admin.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", data.user.id);
  redirect(safeNext(String(form.get("next") ?? "")) ?? homeFor((profile?.role ?? "patient") as Role));
}

const pickList = (form: FormData, key: string, allowed: string[]) =>
  form.getAll(key).map(String).filter((v) => allowed.includes(v));

export async function registerPatient(_: FormState, form: FormData): Promise<FormState> {
  const fullName = String(form.get("full_name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const phone = String(form.get("phone") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const age = Number(form.get("age"));
  const guardianConsent = form.get("guardian_consent") === "on";
  const genderRaw = String(form.get("gender") ?? "");
  const state = String(form.get("state") ?? "");
  const city = String(form.get("city") ?? "").trim();
  const emotional = Number(form.get("emotional_state"));
  const concerns = pickList(form, "concerns", CONCERNS);
  const prev = String(form.get("previous_support") ?? "");
  const prevDetails = String(form.get("previous_support_details") ?? "").trim();
  const areas = pickList(form, "support_areas", SUPPORT_AREAS);
  const preferred = String(form.get("preferred_support") ?? "either");

  if (!fullName || !email || password.length < 8) return { error: "Enter your name, email and a password of at least 8 characters." };
  if (!Number.isInteger(age) || age < 10 || age > 120) return { error: "Please enter a valid age." };
  if (age < 18 && !guardianConsent) return { error: "Users under 18 need a parent or guardian's consent to register." };
  if (!NIGERIAN_STATES.includes(state) || !city) return { error: "Please enter your state and city." };
  if (!(emotional >= 1 && emotional <= 10)) return { error: "Please tell us how you're feeling right now." };
  if (concerns.length === 0) return { error: "Choose at least one mental health concern." };
  if (areas.length === 0) return { error: "Choose at least one area where you need support." };
  if (!["video", "audio", "either"].includes(preferred)) return { error: "Choose your preferred type of support." };
  if (form.get("agree") !== "on") return { error: "Please agree to the privacy policy and terms to continue." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: "patient", full_name: fullName, phone },
      emailRedirectTo: `${await siteUrl()}/auth/confirm?next=/patient/assessment`,
    },
  });
  if (error || !data.user) return { error: error?.message ?? "Could not create your account." };
  if (data.user.identities && data.user.identities.length === 0) return { error: "An account with this email already exists. Please sign in." };

  const { error: pErr } = await createAdminClient().from("patient_profiles").insert({
    id: data.user.id,
    age,
    guardian_consent: guardianConsent,
    gender: GENDERS.includes(genderRaw) ? genderRaw : null,
    state,
    city,
    emotional_state: emotional,
    concerns,
    previous_support: prev === "yes" ? true : prev === "no" ? false : null,
    previous_support_details: prevDetails || null,
    support_areas: areas,
    preferred_support: preferred,
  });
  if (pErr) return { error: "Your account was created but we couldn't save your details. Please contact support." };

  if (data.session) redirect("/patient/assessment");
  return { message: `Almost done! We sent a confirmation link to ${email}. Open it to start your assessment.` };
}

export async function registerTherapist(_: FormState, form: FormData): Promise<FormState> {
  const fullName = String(form.get("full_name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const phone = String(form.get("phone") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!fullName || !email || password.length < 8) return { error: "Enter your name, email and a password of at least 8 characters." };
  if (form.get("agree") !== "on") return { error: "Please agree to the terms to continue." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: "therapist", full_name: fullName, phone },
      emailRedirectTo: `${await siteUrl()}/auth/confirm?next=/therapist/profile`,
    },
  });
  if (error || !data.user) return { error: error?.message ?? "Could not create your account." };
  if (data.user.identities && data.user.identities.length === 0) return { error: "An account with this email already exists. Please sign in." };
  if (data.session) redirect("/therapist/profile");
  return { message: `We sent a confirmation link to ${email}. Open it to complete your profile and submit your licence.` };
}

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${await siteUrl()}/auth/confirm?next=/reset-password` });
  return { message: "If that email has an account, a reset link is on its way." };
}

export async function updatePassword(_: FormState, form: FormData): Promise<FormState> {
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { error: "Use at least 8 characters." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/login?reset=1");
}

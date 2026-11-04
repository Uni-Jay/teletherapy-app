import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { PLANS, type PlanKey } from "@/lib/constants";

/** What each plan unlocks. Admins can change these in Admin → Settings. */
export type PlanFeatures = {
  sessionsPerMonth: number;
  messaging: boolean;
  chatCalls: boolean;
  priorityBooking: boolean;
};

export const DEFAULT_FEATURES: Record<PlanKey, PlanFeatures> = {
  basic: { sessionsPerMonth: 2, messaging: false, chatCalls: false, priorityBooking: false },
  standard: { sessionsPerMonth: 4, messaging: true, chatCalls: false, priorityBooking: false },
  premium: { sessionsPerMonth: 8, messaging: true, chatCalls: true, priorityBooking: true },
  family: { sessionsPerMonth: 12, messaging: true, chatCalls: true, priorityBooking: true },
};

/** How far ahead a slot must be. Priority booking lets people book closer to the time. */
export const NOTICE_HOURS = { standard: 24, priority: 2 };

export async function getPlanFeatures(): Promise<Record<PlanKey, PlanFeatures>> {
  let saved: Partial<Record<PlanKey, Partial<PlanFeatures>>> = {};
  try {
    const { data } = await createAdminClient().from("settings").select("value").eq("key", "plan_features").maybeSingle();
    saved = (data?.value ?? {}) as typeof saved;
  } catch {
    // Database not reachable (for example during a build): fall back to the defaults
  }
  const out = {} as Record<PlanKey, PlanFeatures>;
  for (const p of PLANS) out[p.key] = { ...DEFAULT_FEATURES[p.key], ...(saved[p.key] ?? {}) };
  return out;
}

export type Entitlements = {
  plan: PlanKey | null;
  planName: string | null;
  active: boolean;
  features: PlanFeatures;
  periodStart: string | null;
  periodEnd: string | null;
  sessionsUsed: number;
  sessionsLeft: number;
  noticeHours: number;
};

const NONE: PlanFeatures = { sessionsPerMonth: 0, messaging: false, chatCalls: false, priorityBooking: false };

/**
 * The patient's current plan and what it allows. A cancelled plan keeps working until its paid period ends.
 * Sessions are counted per billing period (requested, confirmed and completed; cancelled and declined don't count).
 */
export async function getEntitlements(patientId: string): Promise<Entitlements> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const [{ data: sub }, features] = await Promise.all([
    admin
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("patient_id", patientId)
      .in("status", ["active", "cancelled"])
      .gt("current_period_end", now)
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getPlanFeatures(),
  ]);

  if (!sub) {
    return { plan: null, planName: null, active: false, features: NONE, periodStart: null, periodEnd: null, sessionsUsed: 0, sessionsLeft: 0, noticeHours: NOTICE_HOURS.standard };
  }
  const plan = sub.plan as PlanKey;
  const f = features[plan] ?? NONE;
  const end = new Date(sub.current_period_end);
  const start = new Date(end);
  start.setMonth(start.getMonth() - 1);

  const { count } = await admin
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", patientId)
    .in("status", ["requested", "accepted", "completed"])
    .gte("starts_at", start.toISOString())
    .lt("starts_at", end.toISOString());

  const used = count ?? 0;
  return {
    plan,
    planName: PLANS.find((p) => p.key === plan)?.name ?? plan,
    active: true,
    features: f,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    sessionsUsed: used,
    sessionsLeft: Math.max(0, f.sessionsPerMonth - used),
    noticeHours: f.priorityBooking ? NOTICE_HOURS.priority : NOTICE_HOURS.standard,
  };
}

/** Human-readable list of what a plan includes, used on pricing and subscription pages. */
export function describeFeatures(f: PlanFeatures, key: PlanKey) {
  const list = [
    `${f.sessionsPerMonth} video or voice sessions a month${key === "family" ? ", shared by your household" : ""}`,
    "Verified, licensed therapists",
    "AI wellbeing assessment and progress tracker",
    "Appointment reminders by email and SMS",
  ];
  if (f.messaging) list.push("Private messaging with your therapist");
  if (f.chatCalls) list.push("Call your therapist from chat, outside booked sessions");
  if (f.priorityBooking) list.push(`Priority booking: book as little as ${NOTICE_HOURS.priority} hours ahead`);
  return list;
}

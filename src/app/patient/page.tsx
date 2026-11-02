import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { firstName, formatDateTime, formatDate } from "@/lib/format";
import { PageHeader, StatusBadge } from "@/components/ui/misc";
import { MoodCheckin } from "@/components/mood-checkin";
import { CrisisBanner } from "@/components/crisis-banner";

export const metadata = { title: "Home" };

export default async function PatientHome() {
  const user = await requireRole("patient");
  const supabase = await createClient();
  const now = new Date().toISOString();
  const [{ data: next }, { data: assessment }, { data: sub }, settings] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, starts_at, type, status, therapist:therapist_profiles(id, profiles!therapist_profiles_id_fkey(full_name))")
      .eq("patient_id", user.id)
      .in("status", ["requested", "accepted"])
      .gte("ends_at", now)
      .order("starts_at")
      .limit(1)
      .maybeSingle(),
    supabase.from("assessments").select("id, risk, summary, created_at").eq("patient_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("subscriptions").select("plan, status, current_period_end").eq("patient_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    getSettings(),
  ]);

  const therapistName = (next?.therapist as unknown as { profiles: { full_name: string } } | null)?.profiles?.full_name;
  const name = firstName(user.fullName) || "there";
  const subActive = sub && ["active", "cancelled"].includes(sub.status) && sub.current_period_end && sub.current_period_end > now;

  return (
    <div className="space-y-6">
      <PageHeader title={`Hello, ${name}`} text="Here's your space to check in, book sessions and track your progress." />

      {assessment?.risk === "high" && <CrisisBanner helplines={settings.helplines} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Next session</p>
          {next ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">{formatDateTime(next.starts_at)}</p>
                <p className="text-sm text-muted">
                  {next.type === "audio" ? "Audio" : "Video"} session with {therapistName ?? "your therapist"}
                </p>
                <div className="mt-2"><StatusBadge status={next.status} /></div>
              </div>
              {next.status === "accepted" && (
                <Link href={`/session/${next.id}`} className="btn-primary">Join session</Link>
              )}
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-muted">You have no upcoming sessions.</p>
              <Link href="/patient/therapists" className="btn-primary mt-4">Book a session</Link>
            </div>
          )}
        </div>
        <div className="card">
          <MoodCheckin />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your assessment</p>
          {assessment ? (
            <>
              <p className="mt-3 text-sm leading-relaxed">{assessment.summary}</p>
              <p className="mt-2 text-xs text-muted">Taken {formatDate(assessment.created_at)}</p>
              <div className="mt-4 flex gap-2">
                <Link href={`/patient/assessment/${assessment.id}`} className="btn-secondary btn-sm">View details</Link>
                <Link href="/patient/assessment" className="btn-secondary btn-sm">Retake</Link>
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-muted">Take a 2-minute assessment so we can suggest the right therapist for you.</p>
              <Link href="/patient/assessment" className="btn-primary mt-4">Start assessment</Link>
            </>
          )}
        </div>
        <div className="space-y-6">
          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Plan</p>
            {subActive ? (
              <p className="mt-2 font-semibold capitalize">{sub!.plan} plan</p>
            ) : (
              <p className="mt-2 text-sm text-muted">No active plan</p>
            )}
            <Link href="/patient/subscription" className="mt-3 inline-block text-sm text-brand-700">Manage plan →</Link>
          </div>
          <a href="/api/telegram" target="_blank" rel="noopener" className="card block bg-brand-700 text-white transition hover:bg-brand-800">
            <p className="font-semibold">Join our community</p>
            <p className="mt-1 text-sm text-brand-100">Connect with others on our Telegram channel →</p>
          </a>
        </div>
      </div>
    </div>
  );
}

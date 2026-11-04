import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { naira, nowMs } from "@/lib/format";
import { PageHeader, StatCard } from "@/components/ui/misc";
import { Activity, BadgeCheck, Banknote, CalendarDays, CalendarX, CircleCheck, ClipboardCheck, CreditCard, Flag, HeartPulse, Hourglass, Send, ShieldAlert, Users, Wallet } from "lucide-react";

export const metadata = { title: "Admin dashboard" };

const RANGES = { "7": "Last 7 days", "30": "Last 30 days", "90": "Last 90 days", all: "All time" } as const;

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requireRole("admin");
  const { range: r } = await searchParams;
  const range = (r && r in RANGES ? r : "30") as keyof typeof RANGES;
  const since = range === "all" ? "1970-01-01T00:00:00Z" : new Date(nowMs() - Number(range) * 86400000).toISOString();
  const db = createAdminClient();
  const count = { count: "exact" as const, head: true };

  const [
    users, newUsers, verified, pending, bookings, completed, cancelled,
    payments, unpaidPayout, activeUsers, logins, assessments, checkins, telegram, openReports, aiFlags, activeSubs,
  ] = await Promise.all([
    db.from("profiles").select("id", count).eq("role", "patient"),
    db.from("profiles").select("id", count).eq("role", "patient").gte("created_at", since),
    db.from("therapist_profiles").select("id", count).eq("status", "approved"),
    db.from("therapist_profiles").select("id", count).eq("status", "pending"),
    db.from("appointments").select("id", count).gte("created_at", since),
    db.from("appointments").select("id", count).eq("status", "completed").gte("starts_at", since),
    db.from("appointments").select("id", count).eq("status", "cancelled").gte("updated_at", since),
    db.from("payments").select("amount_kobo").eq("status", "success").gte("paid_at", since),
    db.from("appointments").select("therapist_fee").eq("status", "completed").eq("payout_status", "unpaid"),
    db.from("events").select("user_id").eq("kind", "login").gte("created_at", since).limit(10000),
    db.from("events").select("id", count).eq("kind", "login").gte("created_at", since),
    db.from("events").select("id", count).eq("kind", "assessment").gte("created_at", since),
    db.from("events").select("id", count).eq("kind", "checkin").gte("created_at", since),
    db.from("events").select("id", count).eq("kind", "telegram_click").gte("created_at", since),
    db.from("reports").select("id", count).eq("status", "open"),
    db.from("reports").select("id", count).eq("status", "open").eq("source", "ai"),
    db.from("subscriptions").select("id", count).eq("status", "active").gt("current_period_end", new Date().toISOString()),
  ]);

  const revenue = (payments.data ?? []).reduce((s, p) => s + p.amount_kobo, 0) / 100;
  const owed = (unpaidPayout.data ?? []).reduce((s, a) => s + a.therapist_fee, 0);
  const active = new Set((activeUsers.data ?? []).map((e) => e.user_id)).size;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        text={RANGES[range]}
        action={
          <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1">
            {Object.entries(RANGES).map(([k, label]) => (
              <Link key={k} href={`/admin?range=${k}`} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${k === range ? "bg-primary text-white" : "text-muted hover:bg-mist"}`}>
                {label}
              </Link>
            ))}
          </div>
        }
      />

      <section>
        <h2 className="eyebrow mb-3">Users and therapists</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="1 · Registered users" icon={Users} value={users.count ?? 0} sub={`${newUsers.count ?? 0} new in period`} href="/admin/users" />
          <StatCard label="2 · Verified therapists" icon={BadgeCheck} value={verified.count ?? 0} href="/admin/therapists?status=approved" />
          <StatCard label="3 · Pending applications" icon={Hourglass} tone="sun" value={pending.count ?? 0} href="/admin/therapists?status=pending" />
          <StatCard label="Active subscriptions" icon={CreditCard} tone="sky" value={activeSubs.count ?? 0} href="/admin/payments" />
        </div>
      </section>

      <section>
        <h2 className="eyebrow mb-3">Sessions</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="4 · Appointment bookings" icon={CalendarDays} value={bookings.count ?? 0} sub="Booked in period" href="/admin/appointments" />
          <StatCard label="5 · Completed sessions" icon={CircleCheck} value={completed.count ?? 0} href="/admin/appointments?status=completed" />
          <StatCard label="6 · Cancelled appointments" icon={CalendarX} tone="red" value={cancelled.count ?? 0} href="/admin/appointments?status=cancelled" />
        </div>
      </section>

      <section>
        <h2 className="eyebrow mb-3">Money</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="7 · Revenue" icon={Banknote} tone="sky" value={naira(revenue)} sub={`${payments.data?.length ?? 0} successful payments`} href="/admin/payments" />
          <StatCard label="Owed to therapists" icon={Wallet} tone="sun" value={naira(owed)} sub="Completed sessions not yet paid out" href="/admin/payments" />
        </div>
      </section>

      <section>
        <h2 className="eyebrow mb-3">Engagement and community</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="8 · Active users" icon={Activity} tone="violet" value={active} sub={`${logins.count ?? 0} sign-ins`} />
          <StatCard label="Assessments taken" icon={ClipboardCheck} value={assessments.count ?? 0} />
          <StatCard label="Mood check-ins" icon={HeartPulse} value={checkins.count ?? 0} />
          <StatCard label="9 · Telegram clicks" icon={Send} tone="sky" value={telegram.count ?? 0} sub="Visits to the community channel" href="/admin/settings" />
        </div>
      </section>

      <section>
        <h2 className="eyebrow mb-3">Safety</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="10 · Open reports" icon={Flag} tone="sun" value={openReports.count ?? 0} href="/admin/reports" />
          <StatCard label="High-risk assessments" icon={ShieldAlert} tone="red" value={aiFlags.count ?? 0} sub="Flagged automatically, not yet resolved" href="/admin/reports?source=ai" />
        </div>
      </section>
    </div>
  );
}

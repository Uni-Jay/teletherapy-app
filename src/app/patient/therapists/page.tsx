import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SPECIALTIES } from "@/lib/constants";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Avatar } from "@/components/avatar";
import { RatingSummary } from "@/components/stars";
import { BadgeCheck, Languages, Search, Sparkles } from "lucide-react";

export const metadata = { title: "Find a therapist" };

type Row = {
  id: string;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  specialties: string[];
  languages: string[];
  years_experience: number;
  rating_avg: number;
  rating_count: number;
  session_minutes: number;
  profiles: { full_name: string } | null;
};

export default async function TherapistsPage({ searchParams }: { searchParams: Promise<{ specialty?: string; q?: string }> }) {
  const user = await requireRole("patient");
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: latest } = await supabase
    .from("assessments")
    .select("recommended_specialties")
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const recommended: string[] = latest?.recommended_specialties ?? [];

  let query = supabase
    .from("therapist_profiles")
    .select("id, title, bio, photo_url, specialties, languages, years_experience, rating_avg, rating_count, session_minutes, profiles!therapist_profiles_id_fkey(full_name)")
    .eq("status", "approved")
    .order("years_experience", { ascending: false });
  if (sp.specialty) query = query.contains("specialties", [sp.specialty]);
  const { data } = await query;
  let rows = (data ?? []) as unknown as Row[];
  if (sp.q) {
    const q = sp.q.toLowerCase();
    rows = rows.filter((r) => r.profiles?.full_name.toLowerCase().includes(q) || r.bio?.toLowerCase().includes(q));
  }
  const score = (r: Row) => r.specialties.filter((s) => recommended.includes(s)).length;
  rows.sort((a, b) => score(b) - score(a));

  return (
    <div>
      <PageHeader title="Find a therapist" text="Every therapist here is licensed and verified by our team." />
      <form className="card mb-6 flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={sp.q} className="input border-0 bg-mist pl-10 shadow-none" placeholder="Search by name or keyword" />
        </div>
        <select name="specialty" defaultValue={sp.specialty ?? ""} className="input w-auto min-w-[200px] border-0 bg-mist">
          <option value="">All specialties</option>
          {SPECIALTIES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button className="btn-primary">Search</button>
      </form>
      {recommended.length > 0 && !sp.specialty && (
        <p className="mb-4 flex items-center gap-2 text-sm text-muted">
          <Sparkles className="size-4 text-sun-500" /> Sorted by your assessment: {recommended.join(", ")}
        </p>
      )}

      {rows.length === 0 ? (
        <EmptyState icon={Search} title="No therapists found" text="Try a different specialty, or check back soon as new therapists join." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {rows.map((t) => (
            <div key={t.id} className="card flex flex-col transition hover:border-brand-200 hover:shadow-[var(--shadow-lift)]">
              <div className="flex gap-4">
                <Avatar name={t.profiles?.full_name ?? "?"} url={t.photo_url} size={68} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-lg font-bold">{t.profiles?.full_name}</p>
                    <BadgeCheck className="size-4 text-brand-600" aria-label="Verified" />
                  </div>
                  <p className="text-sm text-muted">{t.title || "Therapist"} · {t.years_experience} yrs</p>
                  <div className="mt-1.5"><RatingSummary avg={t.rating_avg} count={t.rating_count} /></div>
                </div>
                {score(t) > 0 && <span className="badge h-fit bg-sun-100 text-sun-700"><Sparkles className="size-3" /> Match</span>}
              </div>
              <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink/80">{t.bio}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.specialties.slice(0, 4).map((s) => (
                  <span key={s} className={`badge ${recommended.includes(s) ? "bg-brand-100 text-brand-800" : "bg-mist text-ink"}`}>{s}</span>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                <span className="flex items-center gap-1.5 text-xs text-muted"><Languages className="size-3.5" /> {t.languages.join(", ")} · {t.session_minutes} min</span>
                <Link href={`/patient/therapists/${t.id}`} className="btn-primary btn-sm">View & book</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

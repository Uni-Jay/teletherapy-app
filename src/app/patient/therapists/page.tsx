import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SPECIALTIES } from "@/lib/constants";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Avatar } from "@/components/avatar";

export const metadata = { title: "Find a therapist" };

type Row = {
  id: string;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  specialties: string[];
  languages: string[];
  years_experience: number;
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
    .select("id, title, bio, photo_url, specialties, languages, years_experience, profiles!therapist_profiles_id_fkey(full_name)")
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
      <PageHeader title="Find a therapist" text="All therapists are licensed and verified by our team." />
      <form className="mb-6 flex flex-wrap gap-3">
        <input name="q" defaultValue={sp.q} className="input max-w-xs" placeholder="Search by name or keyword" />
        <select name="specialty" defaultValue={sp.specialty ?? ""} className="input max-w-xs">
          <option value="">All specialties</option>
          {SPECIALTIES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button className="btn-secondary">Filter</button>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="No therapists found" text="Try a different specialty, or check back soon as new therapists join." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((t) => (
            <Link key={t.id} href={`/patient/therapists/${t.id}`} className="card flex gap-4 transition hover:border-brand-300">
              <Avatar name={t.profiles?.full_name ?? "?"} url={t.photo_url} size={64} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{t.profiles?.full_name}</p>
                  {score(t) > 0 && <span className="badge bg-brand-100 text-brand-800">Recommended for you</span>}
                </div>
                <p className="text-sm text-muted">
                  {t.title || "Therapist"} · {t.years_experience} yrs experience
                </p>
                <p className="mt-2 line-clamp-2 text-sm">{t.bio}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.specialties.slice(0, 4).map((s) => (
                    <span key={s} className="badge bg-black/5 text-ink">{s}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-muted">Sessions are covered by your subscription plan.</p>
    </div>
  );
}

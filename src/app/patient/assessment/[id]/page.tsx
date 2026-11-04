import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { formatDate } from "@/lib/format";
import { QUESTIONS, SCALE } from "@/lib/assessment";
import { PageHeader } from "@/components/ui/misc";
import { CrisisBanner } from "@/components/crisis-banner";

export const metadata = { title: "Assessment results" };

function band(score: number) {
  return score >= 5 ? "High" : score >= 3 ? "Moderate" : "Low";
}

export default async function AssessmentResult({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("patient");
  const supabase = await createClient();
  const { data: a } = await supabase.from("assessments").select("*").eq("id", id).eq("patient_id", user.id).single();
  if (!a) notFound();
  const settings = await getSettings();
  const answers = a.answers as Record<string, number>;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Your results" text={`Completed ${formatDate(a.created_at)}`} />
      {a.risk === "high" && <CrisisBanner helplines={settings.helplines} />}

      <div className="card">
        <p className="leading-relaxed">{a.summary}</p>
        {a.recommended_support && <p className="mt-3 text-sm text-muted">{a.recommended_support}</p>}
        <p className="mt-4 text-xs text-muted">
          This summary is generated to guide you and is not a medical diagnosis. Your therapist will talk through your needs with you.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Low mood</p>
          <p className="mt-1 text-2xl font-bold">{band(a.mood_score)}</p>
          <p className="text-xs text-muted">Score {a.mood_score} of 6</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Anxiety</p>
          <p className="mt-1 text-2xl font-bold">{band(a.anxiety_score)}</p>
          <p className="text-xs text-muted">Score {a.anxiety_score} of 6</p>
        </div>
      </div>

      {a.recommended_specialties?.length > 0 && (
        <div className="card">
          <p className="font-semibold">Therapists we recommend for you</p>
          <p className="mt-1 text-sm text-muted">Specialists in: {a.recommended_specialties.join(", ")}</p>
          <Link href={`/patient/therapists?specialty=${encodeURIComponent(a.recommended_specialties[0])}`} className="btn-primary mt-4">
            See matching therapists
          </Link>
        </div>
      )}

      <details className="card">
        <summary className="cursor-pointer font-medium">Your answers</summary>
        <ul className="mt-3 space-y-2 text-sm">
          {QUESTIONS.map((q) => (
            <li key={q.id} className="flex justify-between gap-4 border-b border-ink/5 pb-2">
              <span>{q.text}</span>
              <span className="shrink-0 text-muted">{SCALE[answers[q.id] ?? 0]}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

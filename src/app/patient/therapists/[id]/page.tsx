import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Avatar } from "@/components/avatar";
import { BookingForm } from "@/components/booking-form";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function TherapistDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("patient");
  const supabase = await createClient();
  const [{ data: t }, { data: hours }, { data: pp }] = await Promise.all([
    supabase
      .from("therapist_profiles")
      .select("id, title, bio, photo_url, specialties, languages, years_experience, session_minutes, profiles!therapist_profiles_id_fkey(full_name)")
      .eq("id", id)
      .eq("status", "approved")
      .single(),
    supabase.from("availability").select("weekday, start_time, end_time").eq("therapist_id", id).order("weekday"),
    supabase.from("patient_profiles").select("preferred_support").eq("id", user.id).single(),
  ]);
  if (!t) notFound();
  const name = (t.profiles as unknown as { full_name: string } | null)?.full_name ?? "Therapist";

  return (
    <div>
      <Link href="/patient/therapists" className="text-sm text-brand-700">← All therapists</Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <div className="card">
            <div className="flex items-center gap-4">
              <Avatar name={name} url={t.photo_url} size={72} />
              <div>
                <h1 className="text-xl font-bold">{name}</h1>
                <p className="text-sm text-muted">{t.title || "Therapist"}</p>
                <span className="badge mt-1 bg-brand-100 text-brand-800">Verified licence</span>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{t.bio}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-muted">Experience</dt><dd>{t.years_experience} years</dd></div>
              <div><dt className="text-muted">Specialties</dt><dd>{t.specialties.join(", ") || "–"}</dd></div>
              <div><dt className="text-muted">Languages</dt><dd>{t.languages.join(", ")}</dd></div>
              <div><dt className="text-muted">Session length</dt><dd>{t.session_minutes} minutes</dd></div>
            </dl>
          </div>
          {hours && hours.length > 0 && (
            <div className="card text-sm">
              <p className="font-semibold">Usual hours</p>
              <ul className="mt-2 space-y-1 text-muted">
                {hours.map((h, i) => (
                  <li key={i}>{WEEKDAYS[h.weekday]}: {String(h.start_time).slice(0, 5)} – {String(h.end_time).slice(0, 5)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="card lg:col-span-3">
          <PageHeader title="Book a session" />
          <BookingForm therapistId={t.id} preferred={pp?.preferred_support ?? "either"} />
        </div>
      </div>
    </div>
  );
}

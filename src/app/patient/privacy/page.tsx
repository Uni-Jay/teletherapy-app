import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { setConsent } from "@/app/actions/patient";
import { PageHeader } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { ReportForm } from "@/components/report-form";

export const metadata = { title: "Privacy & support" };

export default async function PrivacyPage() {
  const user = await requireRole("patient");
  const supabase = await createClient();
  const [{ data: appts }, { data: consents }, settings] = await Promise.all([
    supabase.from("appointments").select("therapist_id, therapist:therapist_profiles(profiles!therapist_profiles_id_fkey(full_name))").eq("patient_id", user.id),
    supabase.from("consents").select("therapist_id, granted").eq("patient_id", user.id),
    getSettings(),
  ]);
  const therapists = new Map<string, string>();
  for (const a of (appts ?? []) as unknown as { therapist_id: string; therapist: { profiles: { full_name: string } | null } | null }[]) {
    therapists.set(a.therapist_id, a.therapist?.profiles?.full_name ?? "Therapist");
  }
  const granted = new Map((consents ?? []).map((c) => [c.therapist_id, c.granted]));

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Privacy & support" />

      <div className="card">
        <p className="font-semibold">Who can see your information</p>
        <p className="mt-1 text-sm text-muted">
          Therapists can only see your registration details, assessments and progress if you allow it. You can change this at any time.
        </p>
        {therapists.size === 0 ? (
          <p className="mt-4 text-sm text-muted">You haven&apos;t booked with any therapists yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/5">
            {[...therapists].map(([id, name]) => {
              const on = granted.get(id) ?? false;
              return (
                <li key={id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-xs text-muted">{on ? "Can see your details" : "Cannot see your details"}</p>
                  </div>
                  <form action={setConsent}>
                    <input type="hidden" name="therapist_id" value={id} />
                    <input type="hidden" name="granted" value={on ? "false" : "true"} />
                    <SubmitButton className={on ? "btn-danger btn-sm" : "btn-secondary btn-sm"} pendingText="…">
                      {on ? "Stop sharing" : "Allow access"}
                    </SubmitButton>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="card">
        <p className="font-semibold">Need urgent help?</p>
        <p className="mt-1 text-sm text-muted">This service is not for emergencies. If you are in danger, contact:</p>
        <ul className="mt-3 space-y-1 text-sm">
          {settings.helplines.map((h) => (
            <li key={h.name + h.phone}>
              {h.name}: <a href={`tel:${h.phone.replace(/\s/g, "")}`} className="font-semibold text-brand-700">{h.phone}</a>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <p className="mb-3 font-semibold">Report a concern</p>
        <ReportForm therapists={[...therapists].map(([id, name]) => ({ id, name }))} />
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { registerPatient } from "@/app/actions/session";
import { AuthCard } from "@/components/auth/auth-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/ui/misc";
import { CONCERNS, EMOTIONAL_STATES, GENDERS, NIGERIAN_STATES, SUPPORT_AREAS } from "@/lib/constants";

const STEPS = ["About you", "How you feel", "Your support", "Account"];

export default function PatientRegister() {
  const [state, action] = useActionState(registerPatient, undefined);
  const [step, setStep] = useState(0);
  const [age, setAge] = useState("");
  const [mood, setMood] = useState(5);
  const [prev, setPrev] = useState("");

  if (state?.message) {
    return (
      <AuthCard title="Check your email">
        <Notice kind="success">{state.message}</Notice>
      </AuthCard>
    );
  }

  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    const fieldset = (e.currentTarget as HTMLElement).closest("fieldset");
    const invalid = fieldset?.querySelector<HTMLInputElement>(":invalid");
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    if (fieldset) {
      const groups = fieldset.querySelectorAll<HTMLElement>("[data-require-one]");
      for (const g of groups) {
        if (!g.querySelector("input:checked")) {
          alert(`Please choose at least one option for "${g.dataset.requireOne}".`);
          return;
        }
      }
    }
    setStep((s) => s + 1);
  };

  return (
    <AuthCard wide title="Create your account" text="Your answers are private and help us match you with the right therapist.">
      <ol className="mb-8 grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => (
          <li key={s} className="min-w-0">
            <div className={`h-1.5 rounded-full transition-colors ${i <= step ? "bg-brand-600" : "bg-line"}`} />
            <p className={`mt-2 truncate text-xs font-semibold ${i === step ? "text-ink" : "text-muted"}`}>
              <span className="tabular-nums">{i + 1}.</span> {s}
            </p>
          </li>
        ))}
      </ol>

      <form action={action} className="space-y-6">
        {state?.error && <Notice kind="error">{state.error}</Notice>}

        {/* Step 1 – About you */}
        <fieldset className={step === 0 ? "space-y-4" : "hidden"}>
          <div>
            <label className="label" htmlFor="full_name">Full name</label>
            <input className="input" id="full_name" name="full_name" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="age">Age</label>
              <input className="input" id="age" name="age" type="number" min={10} max={120} required value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="gender">Gender <span className="text-muted">(optional)</span></label>
              <select className="input" id="gender" name="gender" defaultValue="">
                <option value="">Select…</option>
                {GENDERS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
          {age !== "" && Number(age) < 18 && (
            <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              <input type="checkbox" name="guardian_consent" className="mt-1" required />
              <span>I confirm that my parent or guardian knows about and agrees to me using this service.</span>
            </label>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="state">State</label>
              <select className="input" id="state" name="state" required defaultValue="">
                <option value="" disabled>Select your state…</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="city">City / town</label>
              <input className="input" id="city" name="city" required />
            </div>
          </div>
          <button className="btn-primary w-full" onClick={next}>Continue</button>
        </fieldset>

        {/* Step 2 – How you feel */}
        <fieldset className={step === 1 ? "space-y-5" : "hidden"}>
          <div>
            <label className="label" htmlFor="emotional_state">How are you feeling right now?</label>
            <input
              id="emotional_state"
              name="emotional_state"
              type="range"
              min={1}
              max={10}
              value={mood}
              onChange={(e) => setMood(Number(e.target.value))}
              className="w-full accent-brand-600 h-2"
            />
            <div className="flex justify-between text-xs text-muted">
              <span>Very low</span>
              <span className="font-semibold text-ink">
                {mood}/10 · {EMOTIONAL_STATES[mood]}
              </span>
              <span>Very good</span>
            </div>
          </div>
          <div data-require-one="Mental health concerns">
            <p className="label">What are your main mental health concerns?</p>
            <div className="flex flex-wrap gap-2">
              {CONCERNS.map((c) => (
                <label key={c} className="chip">
                  <input type="checkbox" name="concerns" value={c} className="sr-only" />
                  {c}
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="label">Have you had mental health support before? <span className="text-muted">(optional)</span></p>
            <div className="flex gap-2">
              {[
                ["yes", "Yes"],
                ["no", "No"],
                ["", "Prefer not to say"],
              ].map(([v, l]) => (
                <label key={l} className="chip">
                  <input type="radio" name="previous_support" value={v} className="sr-only" checked={prev === v} onChange={() => setPrev(v)} />
                  {l}
                </label>
              ))}
            </div>
            {prev === "yes" && (
              <textarea className="input mt-3" name="previous_support_details" rows={2} placeholder="What kind of support, and was it helpful? (optional)" />
            )}
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={(e) => { e.preventDefault(); setStep(0); }}>Back</button>
            <button className="btn-primary flex-1" onClick={next}>Continue</button>
          </div>
        </fieldset>

        {/* Step 3 – Support */}
        <fieldset className={step === 2 ? "space-y-5" : "hidden"}>
          <div data-require-one="Areas where you need support">
            <p className="label">Which areas do you need support with?</p>
            <div className="flex flex-wrap gap-2">
              {SUPPORT_AREAS.map((a) => (
                <label key={a} className="chip">
                  <input type="checkbox" name="support_areas" value={a} className="sr-only" />
                  {a}
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="label">Preferred type of support</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                ["video", "Video sessions", "See your therapist face to face"],
                ["audio", "Audio sessions", "Voice only, uses less data"],
                ["either", "Either", "I'm happy with both"],
              ].map(([v, t, d]) => (
                <label key={v} className="chip flex-col items-start rounded-xl p-3">
                  <input type="radio" name="preferred_support" value={v} className="sr-only" defaultChecked={v === "either"} />
                  <span className="font-semibold">{t}</span>
                  <span className="text-xs text-muted">{d}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={(e) => { e.preventDefault(); setStep(1); }}>Back</button>
            <button className="btn-primary flex-1" onClick={next}>Continue</button>
          </div>
        </fieldset>

        {/* Step 4 – Account */}
        <fieldset className={step === 3 ? "space-y-4" : "hidden"}>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" required={step === 3} autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone number</label>
            <input className="input" id="phone" name="phone" type="tel" placeholder="e.g. 08012345678" />
            <p className="hint">Used for appointment reminders by SMS.</p>
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input className="input" id="password" name="password" type="password" minLength={8} required={step === 3} autoComplete="new-password" />
            <p className="hint">At least 8 characters.</p>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="agree" className="mt-1" required={step === 3} />
            <span>
              I agree to the <Link href="/terms" className="text-brand-700 underline">terms of use</Link> and{" "}
              <Link href="/privacy" className="text-brand-700 underline">privacy policy</Link>, and I understand this service
              is not for emergencies.
            </span>
          </label>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={(e) => { e.preventDefault(); setStep(2); }}>Back</button>
            <SubmitButton className="btn-primary flex-1" pendingText="Creating account…">Create account</SubmitButton>
          </div>
        </fieldset>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account? <Link href="/login" className="text-brand-700">Sign in</Link> · Are you a therapist?{" "}
        <Link href="/register/therapist" className="text-brand-700">Apply here</Link>
      </p>
    </AuthCard>
  );
}

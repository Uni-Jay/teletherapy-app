"use client";
import { useActionState } from "react";
import { reportConcern } from "@/app/actions/patient";
import { SubmitButton } from "./ui/submit-button";
import { Notice } from "./ui/misc";

export function ReportForm({ therapists }: { therapists: { id: string; name: string }[] }) {
  const [state, action] = useActionState(reportConcern, undefined);
  if (state?.message) return <Notice kind="success">{state.message}</Notice>;
  return (
    <form action={action} className="space-y-3">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <div>
        <label className="label" htmlFor="reason">What would you like to report?</label>
        <input id="reason" name="reason" className="input" required maxLength={200} placeholder="e.g. Therapist missed a session" />
      </div>
      {therapists.length > 0 && (
        <div>
          <label className="label" htmlFor="subject_id">About (optional)</label>
          <select id="subject_id" name="subject_id" className="input" defaultValue="">
            <option value="">General / not about a person</option>
            {therapists.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="label" htmlFor="details">Details</label>
        <textarea id="details" name="details" rows={4} className="input" maxLength={3000} />
      </div>
      <SubmitButton className="btn-primary" pendingText="Sending…">Send report</SubmitButton>
    </form>
  );
}

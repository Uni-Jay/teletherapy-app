"use client";
import { useActionState } from "react";
import { bookAppointment } from "@/app/actions/patient";
import { SlotPicker } from "./slot-picker";
import { SubmitButton } from "./ui/submit-button";
import { Notice } from "./ui/misc";

export function BookingForm({ therapistId, preferred }: { therapistId: string; preferred: string }) {
  const [state, action] = useActionState(bookAppointment, undefined);
  return (
    <form action={action} className="space-y-5">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <input type="hidden" name="therapist_id" value={therapistId} />
      <SlotPicker therapistId={therapistId} />
      <div>
        <p className="label">Session type</p>
        <div className="flex gap-2">
          {[
            ["video", "Video"],
            ["audio", "Audio only"],
          ].map(([v, l]) => (
            <label key={v} className="chip">
              <input type="radio" name="type" value={v} defaultChecked={preferred === "audio" ? v === "audio" : v === "video"} className="sr-only" />
              {l}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="note">What would you like to talk about? (optional)</label>
        <textarea id="note" name="note" rows={3} className="input" maxLength={1000} />
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="share" defaultChecked className="mt-1" />
        <span>Share my registration details, assessment results and progress with this therapist. You can change this any time.</span>
      </label>
      <SubmitButton className="btn-primary w-full" pendingText="Booking…">Request session</SubmitButton>
      <p className="text-xs text-muted">Your therapist will confirm the request. You&apos;ll get an email when it&apos;s accepted.</p>
    </form>
  );
}

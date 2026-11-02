"use client";
import { useActionState } from "react";
import { Lock } from "lucide-react";
import { saveSessionNote } from "@/app/actions/features";
import { SubmitButton } from "./ui/submit-button";

export function NotesForm({ appointmentId, body }: { appointmentId: string; body: string }) {
  const [state, action] = useActionState(saveSessionNote, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="appointment_id" value={appointmentId} />
      <div className="flex items-center justify-between">
        <label htmlFor="body" className="label !mb-0">Session notes</label>
        <span className="flex items-center gap-1 text-xs text-muted"><Lock className="size-3" /> Only you can see these</span>
      </div>
      <textarea
        id="body"
        name="body"
        rows={12}
        defaultValue={body}
        className="input font-[450] leading-relaxed"
        placeholder={"Presenting concerns\n\nWhat we worked on\n\nPlan and homework for next session"}
      />
      <div className="flex items-center gap-3">
        <SubmitButton pendingText="Saving…">Save notes</SubmitButton>
        {state?.message && <span className="text-sm text-brand-700">{state.message}</span>}
        {state?.error && <span className="text-sm text-red-700">{state.error}</span>}
      </div>
    </form>
  );
}

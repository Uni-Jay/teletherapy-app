"use client";
import { useActionState } from "react";
import { rescheduleAppointment } from "@/app/actions/patient";
import { SlotPicker } from "./slot-picker";
import { SubmitButton } from "./ui/submit-button";
import { Notice } from "./ui/misc";

export function RescheduleForm({ id, therapistId }: { id: string; therapistId: string }) {
  const [state, action] = useActionState(rescheduleAppointment, undefined);
  return (
    <form action={action} className="space-y-5">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <input type="hidden" name="id" value={id} />
      <SlotPicker therapistId={therapistId} ignoreAppointmentId={id} />
      <SubmitButton className="btn-primary" pendingText="Saving…">Request new time</SubmitButton>
    </form>
  );
}

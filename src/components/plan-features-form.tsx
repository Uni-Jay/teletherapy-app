"use client";
import { useActionState } from "react";
import { savePlanFeatures } from "@/app/actions/admin";
import { SubmitButton } from "./ui/submit-button";
import { Notice } from "./ui/misc";

type F = { sessionsPerMonth: number; messaging: boolean; progressTracker: boolean; chatCalls: boolean; priorityBooking: boolean };
const PLANS = [
  ["basic", "Basic", "₦10,000"],
  ["standard", "Standard", "₦20,000"],
  ["premium", "Premium", "₦30,000"],
  ["family", "Family", "₦50,000"],
] as const;

export function PlanFeaturesForm({ features }: { features: Record<string, F> }) {
  const [state, action] = useActionState(savePlanFeatures, undefined);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      {state?.message && <Notice kind="success">{state.message}</Notice>}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="table">
          <thead>
            <tr><th>Plan</th><th>Sessions / month</th><th>Messaging</th><th>Progress tracker</th><th>Calls from chat</th><th>Priority booking</th></tr>
          </thead>
          <tbody>
            {PLANS.map(([k, name, price]) => (
              <tr key={k}>
                <td><p className="font-semibold">{name}</p><p className="text-xs text-muted">{price}</p></td>
                <td><input type="number" name={`${k}_sessions`} min={0} max={100} defaultValue={features[k].sessionsPerMonth} className="input w-24" aria-label={`${name} sessions per month`} /></td>
                <td><input type="checkbox" name={`${k}_messaging`} defaultChecked={features[k].messaging} className="size-5 accent-brand-600" aria-label={`${name} messaging`} /></td>
                <td><input type="checkbox" name={`${k}_progressTracker`} defaultChecked={features[k].progressTracker} className="size-5 accent-brand-600" aria-label={`${name} progress tracker`} /></td>
                <td><input type="checkbox" name={`${k}_chatCalls`} defaultChecked={features[k].chatCalls} className="size-5 accent-brand-600" aria-label={`${name} calls from chat`} /></td>
                <td><input type="checkbox" name={`${k}_priorityBooking`} defaultChecked={features[k].priorityBooking} className="size-5 accent-brand-600" aria-label={`${name} priority booking`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint">Booking sessions, video and voice calls during booked sessions, the calendar, the assessment and reminders are included in every plan. Patients only see the features their plan includes.</p>
      <SubmitButton>Save plan features</SubmitButton>
    </form>
  );
}

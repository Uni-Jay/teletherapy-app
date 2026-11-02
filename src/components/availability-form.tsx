"use client";
import { useActionState } from "react";
import { saveAvailability } from "@/app/actions/therapist";
import { SubmitButton } from "./ui/submit-button";
import { Notice } from "./ui/misc";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function AvailabilityForm({ current }: { current: { weekday: number; start_time: string; end_time: string }[] }) {
  const [state, action] = useActionState(saveAvailability, undefined);
  const byDay = new Map(current.map((c) => [c.weekday, c]));
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      {state?.message && <Notice kind="success">{state.message}</Notice>}
      <div className="divide-y divide-black/5">
        {order.map((d) => {
          const row = byDay.get(d);
          return (
            <div key={d} className="flex flex-wrap items-center gap-3 py-3">
              <label className="flex w-36 items-center gap-2 font-medium">
                <input type="checkbox" name={`on_${d}`} defaultChecked={Boolean(row)} />
                {DAYS[d]}
              </label>
              <input type="time" name={`start_${d}`} defaultValue={row ? String(row.start_time).slice(0, 5) : "09:00"} className="input w-32" step={1800} />
              <span className="text-muted">to</span>
              <input type="time" name={`end_${d}`} defaultValue={row ? String(row.end_time).slice(0, 5) : "17:00"} className="input w-32" step={1800} />
            </div>
          );
        })}
      </div>
      <p className="hint">Times are in Lagos time (WAT). Sessions start on the hour within these hours.</p>
      <SubmitButton>Save hours</SubmitButton>
    </form>
  );
}

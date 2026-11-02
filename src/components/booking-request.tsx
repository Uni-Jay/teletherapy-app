import { respondToBooking } from "@/app/actions/therapist";
import { formatDateTime } from "@/lib/format";
import { SubmitButton } from "./ui/submit-button";

export type RequestRow = {
  id: string;
  starts_at: string;
  type: string;
  patient_note: string | null;
  rescheduled_from: string | null;
  patient: { full_name: string } | null;
};

export function BookingRequest({ r }: { r: RequestRow }) {
  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-display text-base font-bold">{r.patient?.full_name}</p>
          <p className="text-sm text-muted">{formatDateTime(r.starts_at)} · {r.type === "audio" ? "Audio" : "Video"}</p>
          {r.rescheduled_from && <p className="text-xs text-amber-700">Rescheduled from {formatDateTime(r.rescheduled_from)}</p>}
        </div>
      </div>
      {r.patient_note && <p className="mt-3 rounded-xl bg-mist p-3 text-sm leading-relaxed">“{r.patient_note}”</p>}
      <form action={respondToBooking} className="mt-3 flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={r.id} />
        <SubmitButton name="decision" value="accept" className="btn-primary btn-sm" pendingText="…">Accept</SubmitButton>
        <input name="reason" className="input max-w-56 py-1.5 text-xs" placeholder="Reason if declining (optional)" />
        <SubmitButton name="decision" value="reject" className="btn-danger btn-sm" pendingText="…">Decline</SubmitButton>
      </form>
    </div>
  );
}

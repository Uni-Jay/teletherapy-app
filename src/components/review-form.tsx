"use client";
import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReview } from "@/app/actions/features";
import { SubmitButton } from "./ui/submit-button";
import { Notice } from "./ui/misc";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export function ReviewForm({ appointmentId }: { appointmentId: string }) {
  const [state, action] = useActionState(submitReview, undefined);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const shown = hover || rating;
  return (
    <form action={action} className="space-y-5">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <input type="hidden" name="appointment_id" value={appointmentId} />
      <input type="hidden" name="rating" value={rating} />
      <div>
        <p className="label">Your rating</p>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              type="button"
              key={i}
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              className="rounded-lg p-1 transition hover:scale-110"
              aria-label={`${i} star${i > 1 ? "s" : ""}`}
              aria-pressed={rating === i}
            >
              <Star className={`size-9 ${i <= shown ? "text-sun-400" : "text-line"}`} fill="currentColor" strokeWidth={0} />
            </button>
          ))}
          <span className="ml-3 text-sm font-semibold text-muted">{LABELS[shown]}</span>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="comment">Tell others about your experience (optional)</label>
        <textarea id="comment" name="comment" rows={4} maxLength={1500} className="input" placeholder="What did you find helpful?" />
        <p className="hint">Please don&apos;t include personal or medical details.</p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="anonymous" /> Post anonymously
      </label>
      <SubmitButton className="btn-primary" pendingText="Posting…">Post review</SubmitButton>
    </form>
  );
}

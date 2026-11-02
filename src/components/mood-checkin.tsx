"use client";
import { useState } from "react";
import { addMoodCheckin } from "@/app/actions/patient";
import { SubmitButton } from "@/components/ui/submit-button";
import { EMOTIONAL_STATES } from "@/lib/constants";

export function MoodCheckin() {
  const [mood, setMood] = useState(5);
  return (
    <form action={addMoodCheckin} className="space-y-3">
      <p className="font-semibold">How are you feeling today?</p>
      <input type="range" name="mood" min={1} max={10} value={mood} onChange={(e) => setMood(Number(e.target.value))} className="w-full accent-brand-600" />
      <p className="text-center text-sm font-medium">
        {mood}/10 · {EMOTIONAL_STATES[mood]}
      </p>
      <input name="note" className="input" placeholder="Anything on your mind? (optional)" maxLength={500} />
      <SubmitButton className="btn-primary w-full" pendingText="Saving…">Save check-in</SubmitButton>
    </form>
  );
}

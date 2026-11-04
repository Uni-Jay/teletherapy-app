"use client";
import { useActionState } from "react";
import { verifyMfa } from "@/app/actions/mfa";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/ui/misc";

export function MfaForm({ factorId, next, label }: { factorId?: string; next?: string; label: string }) {
  const [state, action] = useActionState(verifyMfa, undefined);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      {factorId && <input type="hidden" name="factor_id" value={factorId} />}
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label" htmlFor="code">6-digit code</label>
        <input
          className="input text-center font-display text-2xl tracking-[0.5em] tabular-nums"
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          autoFocus
          placeholder="000000"
        />
      </div>
      <SubmitButton className="btn-primary w-full" pendingText="Checking…">{label}</SubmitButton>
    </form>
  );
}

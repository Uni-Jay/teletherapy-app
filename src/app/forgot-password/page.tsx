"use client";
import { useActionState } from "react";
import { requestPasswordReset } from "@/app/actions/session";
import { AuthCard } from "@/components/auth/auth-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/ui/misc";

export default function ForgotPassword() {
  const [state, action] = useActionState(requestPasswordReset, undefined);
  return (
    <AuthCard title="Reset your password" text="We'll email you a link to set a new password.">
      <form action={action} className="space-y-4">
        {state?.message && <Notice kind="success">{state.message}</Notice>}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
        <SubmitButton className="btn-primary w-full" pendingText="Sending…">Send reset link</SubmitButton>
      </form>
    </AuthCard>
  );
}

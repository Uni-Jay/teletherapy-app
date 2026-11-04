"use client";
import { useActionState } from "react";
import { updatePassword } from "@/app/actions/session";
import { AuthCard } from "@/components/auth/auth-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/ui/misc";

export default function ResetPassword() {
  const [state, action] = useActionState(updatePassword, undefined);
  return (
    <AuthCard title="Choose a new password">
      <form action={action} className="space-y-4">
        {state?.error && <Notice kind="error">{state.error}</Notice>}
        <div>
          <label className="label" htmlFor="password">New password</label>
          <input className="input" id="password" name="password" type="password" minLength={10} required />
        </div>
        <SubmitButton className="btn-primary w-full">Update password</SubmitButton>
      </form>
    </AuthCard>
  );
}

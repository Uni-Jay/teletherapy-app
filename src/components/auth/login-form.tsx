"use client";
import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/actions/session";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/ui/misc";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      {notice && <Notice>{notice}</Notice>}
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <SubmitButton className="btn-primary w-full" pendingText="Signing in…">Sign in</SubmitButton>
      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="text-brand-700">Forgot password?</Link>
        <Link href="/register" className="text-brand-700">Create an account</Link>
      </div>
    </form>
  );
}

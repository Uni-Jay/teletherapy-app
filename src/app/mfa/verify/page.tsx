import { redirect } from "next/navigation";
import { getCurrentUser, getMfaState, homeFor } from "@/lib/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { MfaForm } from "@/components/auth/mfa-form";
import { signOut } from "@/app/actions/auth";

export const metadata = { title: "Enter your code" };
export const dynamic = "force-dynamic";

export default async function MfaVerify({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect(homeFor(user.role));
  const state = await getMfaState();
  if (state === "none") redirect("/mfa/setup");
  if (state === "verified") redirect("/admin");
  const { next } = await searchParams;

  return (
    <AuthCard title="Enter your code" text="Open your authenticator app and enter the 6-digit code for MindGuide AI.">
      <MfaForm next={next} label="Continue" />
      <p className="mt-6 text-sm text-muted">Lost your phone? Ask another admin to reset your two-factor login from the Users page.</p>
      <form action={signOut} className="mt-4 text-center">
        <button className="text-sm text-muted underline">Sign out</button>
      </form>
    </AuthCard>
  );
}

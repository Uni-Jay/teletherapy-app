import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/constants";
import { naira, formatDate } from "@/lib/format";
import { startSubscription, cancelSubscription } from "@/app/actions/patient";
import { Notice, PageHeader, StatusBadge } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";

export const metadata = { title: "Subscription" };

const PERKS: Record<string, string> = {
  basic: "A great place to start",
  standard: "More time with your therapist",
  premium: "Our most complete support",
  family: "Support for the whole household",
};

export default async function SubscriptionPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await requireRole("patient");
  const supabase = await createClient();
  const [{ data: sub }, { data: payments }] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("patient_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("payments").select("reference, plan, amount_kobo, status, paid_at, created_at").eq("patient_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);
  const live = sub && sub.current_period_end && new Date(sub.current_period_end) > new Date() && ["active", "cancelled"].includes(sub.status);

  return (
    <div className="space-y-8">
      <PageHeader title="Subscription" text="Choose the plan that suits you. Plans renew monthly and you can cancel any time." />
      {sp.paid && <Notice kind="success">Payment received. Your plan is now active.</Notice>}
      {sp.pending && <Notice kind="warning">We&apos;re confirming your payment. This page will update shortly.</Notice>}
      {sp.error && <Notice kind="error">We couldn&apos;t start the payment. Please try again or contact support.</Notice>}

      {live && (
        <div className="card flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-muted">Current plan</p>
            <p className="text-lg font-semibold capitalize">{sub.plan}</p>
            <p className="text-sm text-muted">
              {sub.status === "cancelled" ? "Ends" : "Renews"} on {formatDate(sub.current_period_end)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={sub.status === "cancelled" ? "cancelled" : "active"} />
            {sub.status === "active" && (
              <form action={cancelSubscription}>
                <SubmitButton className="btn-danger btn-sm" pendingText="Cancelling…">Cancel renewal</SubmitButton>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => {
          const current = live && sub.plan === p.key && sub.status === "active";
          return (
            <div key={p.key} className={`card flex flex-col ${p.key === "standard" ? "border-brand-400 ring-1 ring-brand-200" : ""}`}>
              <p className="font-semibold">{p.name}</p>
              <p className="mt-2 text-3xl font-bold">{naira(p.price)}</p>
              <p className="text-xs text-muted">per month</p>
              <p className="mt-3 flex-1 text-sm text-muted">{PERKS[p.key]}</p>
              <form action={startSubscription} className="mt-4">
                <input type="hidden" name="plan" value={p.key} />
                <SubmitButton className={current ? "btn-secondary w-full" : "btn-primary w-full"} pendingText="Opening Paystack…">
                  {current ? "Current plan" : live ? "Switch to this plan" : "Choose plan"}
                </SubmitButton>
              </form>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted">Payments are processed securely by Paystack. We never see or store your card details.</p>

      {payments && payments.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <p className="px-5 pt-4 font-semibold">Payment history</p>
          <table className="table mt-2">
            <thead><tr><th>Date</th><th>Plan</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.reference}>
                  <td>{formatDate(p.paid_at ?? p.created_at)}</td>
                  <td className="capitalize">{p.plan}</td>
                  <td>{naira(p.amount_kobo / 100)}</td>
                  <td><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

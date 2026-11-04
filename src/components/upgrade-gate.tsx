import Link from "next/link";
import { ArrowRight, Check, LineChart, Lock, MessageCircle, Phone, CalendarDays } from "lucide-react";
import { cheapestPlanWith, FEATURE_INFO, type Entitlements, type GatedFeature } from "@/lib/plans";
import { naira } from "@/lib/format";

const ICON = { booking: CalendarDays, messaging: MessageCircle, progressTracker: LineChart, chatCalls: Phone };

/** Shown instead of a page when the patient's plan doesn't include the feature. */
export async function UpgradeGate({ feature, ent }: { feature: GatedFeature; ent: Entitlements }) {
  const info = FEATURE_INFO[feature];
  const plan = await cheapestPlanWith(feature);
  const Icon = ICON[feature];
  return (
    <div className="mx-auto max-w-xl py-6">
      <div className="card overflow-hidden p-0 text-center">
        <div className="relative bg-[linear-gradient(120deg,var(--color-brand-500),var(--color-brand-700)_55%,var(--color-sun-400))] px-6 py-10 text-white">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <Icon className="size-8" />
          </span>
          <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-1 text-xs font-semibold"><Lock className="size-3" /> Locked</span>
        </div>
        <div className="p-7">
          <h1 className="font-display text-2xl font-bold">{info.title}</h1>
          <p className="mx-auto mt-2 max-w-sm text-muted">{info.text}</p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-brand-800">
            <Check className="size-4" />
            {plan ? `Included from the ${plan.name} plan (${naira(plan.price)}/month)` : "Not included in any plan yet"}
          </p>
          <p className="mt-3 text-sm text-muted">
            {ent.active ? `You're on the ${ent.planName} plan.` : "You don't have an active plan yet."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/patient/subscription" className="btn-accent px-5 py-3">
              {ent.active ? "Upgrade plan" : "Choose a plan"} <ArrowRight className="size-4" />
            </Link>
            <Link href="/patient" className="btn-ghost px-5 py-3">Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { requireRole } from "@/lib/auth";
import { getEntitlements, hasFeature } from "@/lib/plans";
import { AppShell, type NavItem } from "@/components/app-shell";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("patient");
  const ent = await getEntitlements(user.id);
  const can = (f: Parameters<typeof hasFeature>[1]) => hasFeature(ent, f);

  // Patients only see what their plan includes
  const nav: NavItem[] = [
    { href: "/patient", label: "Home", icon: "home" },
    { href: "/patient/therapists", label: "Find a therapist", icon: "search" },
    { href: "/patient/appointments", label: "My sessions", icon: "video" },
    ...(can("booking") ? [{ href: "/patient/calendar", label: "Calendar", icon: "calendar" } as NavItem] : []),
    ...(can("messaging") ? [{ href: "/patient/messages", label: "Messages", icon: "message" } as NavItem] : []),
    ...(can("progressTracker") ? [{ href: "/patient/progress", label: "My progress", icon: "chart" } as NavItem] : []),
    { href: "/patient/assessment", label: "Assessment", icon: "pulse" },
    { href: "/patient/subscription", label: "Subscription", icon: "card" },
    { href: "/patient/privacy", label: "Privacy & support", icon: "help" },
    { href: "/patient/settings", label: "Settings", icon: "settings" },
  ];

  const plan = ent.active
    ? { label: `${ent.planName} plan`, sub: `${ent.sessionsLeft} of ${ent.features.sessionsPerMonth} sessions left`, cta: ent.plan === "family" || ent.plan === "premium" ? null : "Upgrade" }
    : { label: "No plan yet", sub: "Choose a plan to book sessions", cta: "Choose a plan" };

  return (
    <AppShell nav={nav} userName={user.fullName || user.email || "Patient"} roleLabel="Patient" userId={user.id} withCalls plan={plan}>
      {children}
    </AppShell>
  );
}

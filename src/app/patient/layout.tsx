import { requireRole } from "@/lib/auth";
import { AppShell, type NavItem } from "@/components/app-shell";

const NAV: NavItem[] = [
  { href: "/patient", label: "Home", icon: "home" },
  { href: "/patient/therapists", label: "Find a therapist", icon: "search" },
  { href: "/patient/appointments", label: "My sessions", icon: "video" },
  { href: "/patient/calendar", label: "Calendar", icon: "calendar" },
  { href: "/patient/messages", label: "Messages", icon: "message" },
  { href: "/patient/progress", label: "My progress", icon: "chart" },
  { href: "/patient/assessment", label: "Assessment", icon: "pulse" },
  { href: "/patient/subscription", label: "Subscription", icon: "card" },
  { href: "/patient/privacy", label: "Privacy & support", icon: "help" },
  { href: "/patient/settings", label: "Settings", icon: "settings" },
];

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("patient");
  return (
    <AppShell nav={NAV} userName={user.fullName || user.email || "Patient"} roleLabel="Patient" userId={user.id} withCalls>
      {children}
    </AppShell>
  );
}

import { requireRole } from "@/lib/auth";
import { AppShell, type NavItem } from "@/components/app-shell";

const NAV: NavItem[] = [
  { href: "/therapist", label: "Dashboard", icon: "gauge" },
  { href: "/therapist/appointments", label: "Appointments", icon: "video" },
  { href: "/therapist/calendar", label: "Calendar", icon: "calendar" },
  { href: "/therapist/patients", label: "Patients", icon: "users" },
  { href: "/therapist/messages", label: "Messages", icon: "message" },
  { href: "/therapist/availability", label: "Availability", icon: "clock" },
  { href: "/therapist/earnings", label: "Payments", icon: "wallet" },
  { href: "/therapist/profile", label: "My profile", icon: "user" },
  { href: "/therapist/documents", label: "Licence & documents", icon: "badge" },
  { href: "/therapist/settings", label: "Settings", icon: "settings" },
];

export default async function TherapistLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("therapist");
  return (
    <AppShell nav={NAV} userName={user.fullName || user.email || "Therapist"} roleLabel="Therapist portal" userId={user.id} withCalls>
      {children}
    </AppShell>
  );
}

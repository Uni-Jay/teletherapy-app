import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

const NAV = [
  { href: "/therapist", label: "Dashboard" },
  { href: "/therapist/appointments", label: "Appointments" },
  { href: "/therapist/patients", label: "Patients" },
  { href: "/therapist/messages", label: "Messages" },
  { href: "/therapist/availability", label: "Availability" },
  { href: "/therapist/earnings", label: "Payments" },
  { href: "/therapist/profile", label: "My profile" },
  { href: "/therapist/documents", label: "Licence & documents" },
];

export default async function TherapistLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("therapist");
  return (
    <AppShell nav={NAV} userName={user.fullName || user.email || "Therapist"} roleLabel="Therapist portal">
      {children}
    </AppShell>
  );
}

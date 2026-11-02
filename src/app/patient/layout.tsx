import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

const NAV = [
  { href: "/patient", label: "Home" },
  { href: "/patient/therapists", label: "Find a therapist" },
  { href: "/patient/appointments", label: "My sessions" },
  { href: "/patient/messages", label: "Messages" },
  { href: "/patient/progress", label: "My progress" },
  { href: "/patient/assessment", label: "Assessment" },
  { href: "/patient/subscription", label: "Subscription" },
  { href: "/patient/privacy", label: "Privacy & support" },
];

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("patient");
  return (
    <AppShell nav={NAV} userName={user.fullName || user.email || "Patient"} roleLabel="Patient">
      {children}
    </AppShell>
  );
}

import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/therapists", label: "Therapists" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/appointments", label: "Appointments" },
  { href: "/admin/payments", label: "Revenue & payouts" },
  { href: "/admin/reports", label: "Reports & flags" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin");
  return (
    <AppShell nav={NAV} userName={user.fullName || user.email || "Admin"} roleLabel="Admin">
      {children}
    </AppShell>
  );
}

import { signOut } from "@/app/actions/auth";
import { ShellChrome, type NavItem, type PlanChip } from "./shell-chrome";
import { IncomingCall } from "./calls/incoming-call";

export type { NavItem };

export function AppShell({
  nav,
  userName,
  roleLabel,
  userId,
  withCalls = false,
  plan,
  children,
}: {
  nav: NavItem[];
  userName: string;
  roleLabel: string;
  userId: string;
  withCalls?: boolean;
  plan?: PlanChip;
  children: React.ReactNode;
}) {
  return (
    <ShellChrome nav={nav} userName={userName} roleLabel={roleLabel} signOut={signOut} plan={plan}>
      {children}
      {withCalls && <IncomingCall userId={userId} />}
    </ShellChrome>
  );
}

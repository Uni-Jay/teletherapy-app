import { signOut } from "@/app/actions/auth";
import { ShellChrome, type NavItem } from "./shell-chrome";
import { IncomingCall } from "./calls/incoming-call";

export type { NavItem };

export function AppShell({
  nav,
  userName,
  roleLabel,
  userId,
  withCalls = false,
  children,
}: {
  nav: NavItem[];
  userName: string;
  roleLabel: string;
  userId: string;
  withCalls?: boolean;
  children: React.ReactNode;
}) {
  return (
    <ShellChrome nav={nav} userName={userName} roleLabel={roleLabel} signOut={signOut}>
      {children}
      {withCalls && <IncomingCall userId={userId} />}
    </ShellChrome>
  );
}

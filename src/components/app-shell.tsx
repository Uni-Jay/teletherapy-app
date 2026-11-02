import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { signOut } from "@/app/actions/auth";
import { NavLinks } from "./nav-links";

export type NavItem = { href: string; label: string };

export function AppShell({
  nav,
  userName,
  roleLabel,
  children,
}: {
  nav: NavItem[];
  userName: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-black/5 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-4 lg:block">
          <Link href="/" className="text-lg font-bold text-brand-700">
            {APP_NAME}
          </Link>
          <p className="text-xs text-muted lg:mt-1">{roleLabel}</p>
        </div>
        <NavLinks nav={nav} />
        <div className="hidden border-t border-black/5 px-5 py-4 lg:absolute lg:bottom-0 lg:block lg:w-64">
          <p className="truncate text-sm font-medium">{userName}</p>
          <form action={signOut}>
            <button className="mt-1 text-xs text-muted hover:text-ink">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
        {children}
        <form action={signOut} className="mt-10 lg:hidden">
          <button className="text-sm text-muted hover:text-ink">Sign out ({userName})</button>
        </form>
      </main>
    </div>
  );
}

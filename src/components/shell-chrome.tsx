"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell, CalendarDays, CreditCard, FileBadge2, Gauge, HeartPulse, Home, LifeBuoy, LineChart, LogOut, Menu,
  MessageCircle, Search, Settings, ShieldAlert, Stethoscope, UserRound, Users, Video, Wallet, X, ClipboardList, Clock,
} from "lucide-react";
import { Logo } from "./logo";
import { Avatar } from "./avatar";
import { NotificationBell } from "./notification-bell";

const ICONS = {
  home: Home, search: Search, video: Video, message: MessageCircle, chart: LineChart, pulse: HeartPulse,
  card: CreditCard, help: LifeBuoy, gauge: Gauge, users: Users, calendar: CalendarDays, clock: Clock, wallet: Wallet,
  user: UserRound, badge: FileBadge2, stethoscope: Stethoscope, alert: ShieldAlert, settings: Settings, list: ClipboardList, bell: Bell,
} as const;

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

function NavList({ nav, onNavigate }: { nav: NavItem[]; onNavigate?: () => void }) {
  const path = usePathname();
  const root = nav[0].href;
  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {nav.map((item) => {
        const Icon = ICONS[item.icon];
        const active = item.href === root ? path === root : path === item.href || path.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-white/12 text-white" : "text-brand-100/80 hover:bg-white/6 hover:text-white"
            }`}
          >
            <Icon className={`size-[18px] ${active ? "text-sun-400" : "text-brand-300 group-hover:text-brand-100"}`} strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ShellChrome({
  nav,
  userName,
  roleLabel,
  signOut,
  children,
}: {
  nav: NavItem[];
  userName: string;
  roleLabel: string;
  signOut: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col bg-brand-950 py-5">
      <div className="mb-6 flex items-center justify-between px-5">
        <Logo light href={nav[0].href} />
        {onNavigate && (
          <button onClick={onNavigate} className="rounded-lg p-1.5 text-brand-100 hover:bg-white/10" aria-label="Close menu">
            <X className="size-5" />
          </button>
        )}
      </div>
      <p className="eyebrow mb-2 px-6 !text-brand-300/70">{roleLabel}</p>
      <div className="flex-1 overflow-y-auto">
        <NavList nav={nav} onNavigate={onNavigate} />
      </div>
      <div className="mx-3 mt-4 flex items-center gap-3 rounded-2xl bg-white/6 p-3">
        <Avatar name={userName} size={36} dark />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{userName}</p>
          <p className="text-xs text-brand-300">{roleLabel}</p>
        </div>
        <form action={signOut}>
          <button className="rounded-lg p-2 text-brand-200 hover:bg-white/10 hover:text-white" aria-label="Sign out" title="Sign out">
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:w-[264px] lg:shrink-0">{sidebar()}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-brand-950/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] shadow-2xl">{sidebar(() => setOpen(false))}</div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-line/80 bg-mist/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-8">
            <button onClick={() => setOpen(true)} className="rounded-xl p-2 text-ink hover:bg-black/5 lg:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </button>
            <div className="lg:hidden">
              <Logo href={nav[0].href} />
            </div>
            <div className="flex-1" />
            <NotificationBell key={path} />
            <div className="hidden items-center gap-2.5 sm:flex">
              <Avatar name={userName} size={34} />
              <span className="text-sm font-semibold">{userName.split(" ").slice(0, 2).join(" ")}</span>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8 animate-fade-up">{children}</main>
      </div>
    </div>
  );
}

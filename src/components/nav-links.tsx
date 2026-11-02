"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./app-shell";

export function NavLinks({ nav }: { nav: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0">
      {nav.map((item) => {
        const root = nav[0].href;
        const active = item.href === root ? path === root : path === item.href || path.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
              active ? "bg-brand-50 text-brand-800" : "text-muted hover:bg-black/5 hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

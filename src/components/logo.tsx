import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function LogoMark({ size = 32, light = false }: { size?: number; light?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="12" fill={light ? "#ffffff" : "#195850"} />
      <path d="M11 24c0-6.6 4.6-11 10.5-11C26 13 29 16 29 20.2c0 4.6-3.6 7.8-8.6 7.8H15l-4 3.5V24z" fill={light ? "#195850" : "#ffffff"} />
      <circle cx="17.5" cy="20.5" r="1.6" fill="#f4a259" />
      <circle cx="22.5" cy="20.5" r="1.6" fill="#f4a259" />
    </svg>
  );
}

export function Logo({ light = false, href = "/" }: { light?: boolean; href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5">
      <LogoMark light={light} />
      <span className={`font-display text-xl font-bold ${light ? "text-white" : "text-brand-900"}`}>{APP_NAME}</span>
    </Link>
  );
}

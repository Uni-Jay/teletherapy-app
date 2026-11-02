import Link from "next/link";
import { STATUS_LABEL } from "@/lib/format";

export function StatCard({ label, value, sub, href }: { label: string; value: string | number; sub?: string; href?: string }) {
  const body = (
    <div className="card h-full">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block transition hover:-translate-y-0.5">
      {body}
    </Link>
  ) : (
    body
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center py-10 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  requested: "bg-amber-50 text-amber-800",
  accepted: "bg-brand-50 text-brand-800",
  completed: "bg-slate-100 text-slate-700",
  rejected: "bg-red-50 text-red-700",
  cancelled: "bg-red-50 text-red-700",
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-brand-50 text-brand-800",
  suspended: "bg-red-50 text-red-700",
  active: "bg-brand-50 text-brand-800",
  open: "bg-amber-50 text-amber-800",
  resolved: "bg-slate-100 text-slate-700",
  high: "bg-red-50 text-red-700",
  moderate: "bg-amber-50 text-amber-800",
  low: "bg-brand-50 text-brand-800",
  paid: "bg-brand-50 text-brand-800",
  unpaid: "bg-amber-50 text-amber-800",
  success: "bg-brand-50 text-brand-800",
  failed: "bg-red-50 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${STATUS_STYLE[status] ?? "bg-slate-100 text-slate-700"}`}>
      {STATUS_LABEL[status] ?? status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function PageHeader({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="page-title">{title}</h1>
        {text && <p className="mt-1 text-sm text-muted">{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function Notice({ kind = "info", children }: { kind?: "info" | "error" | "success" | "warning"; children: React.ReactNode }) {
  const styles = {
    info: "border-brand-200 bg-brand-50 text-brand-900",
    success: "border-brand-200 bg-brand-50 text-brand-900",
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
  }[kind];
  return <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}

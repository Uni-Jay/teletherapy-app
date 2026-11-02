import Link from "next/link";
import { ChevronLeft, ChevronRight, Phone, Video } from "lucide-react";
import { TIMEZONE } from "@/lib/constants";

export type CalEvent = { id: string; starts_at: string; type: string; status: string; title: string; href: string };

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ymd = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(d);
const time = (iso: string) => new Intl.DateTimeFormat("en-NG", { timeZone: TIMEZONE, hour: "numeric", minute: "2-digit" }).format(new Date(iso));

const TONE: Record<string, string> = {
  accepted: "bg-brand-700 text-white",
  requested: "bg-sun-100 text-sun-700 ring-1 ring-sun-300",
  completed: "bg-brand-50 text-brand-800",
  cancelled: "bg-red-50 text-red-700 line-through",
  rejected: "bg-red-50 text-red-700 line-through",
};

/** Month grid in Lagos time. `month` is "YYYY-MM". */
export function MonthCalendar({ month, events, basePath }: { month: string; events: CalEvent[]; basePath: string }) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1, 12));
  const startDow = (first.getUTCDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(Date.UTC(y, m - 1, d, 12)));
  while (cells.length % 7) cells.push(null);

  const byDay = new Map<string, CalEvent[]>();
  for (const e of events) {
    const k = ymd(new Date(e.starts_at));
    byDay.set(k, [...(byDay.get(k) ?? []), e]);
  }
  const today = ymd(new Date());
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const label = new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric", timeZone: "UTC" }).format(first);

  return (
    <div className="card overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-xl font-bold">{label}</h2>
        <div className="flex items-center gap-1">
          <Link href={`${basePath}?month=${prev}`} className="btn-ghost btn-sm" aria-label="Previous month"><ChevronLeft className="size-4" /></Link>
          <Link href={basePath} className="btn-secondary btn-sm">Today</Link>
          <Link href={`${basePath}?month=${next}`} className="btn-ghost btn-sm" aria-label="Next month"><ChevronRight className="size-4" /></Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-7 border-b border-line bg-mist/60">
            {DOW.map((d) => <div key={d} className="eyebrow px-3 py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              const k = d ? ymd(d) : "";
              const items = d ? byDay.get(k) ?? [] : [];
              return (
                <div key={i} className={`min-h-[112px] border-b border-r border-line/70 p-2 ${d ? "" : "bg-mist/40"} ${i % 7 === 6 ? "border-r-0" : ""}`}>
                  {d && (
                    <>
                      <span className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold ${k === today ? "bg-sun-400 text-brand-950" : "text-muted"}`}>
                        {d.getUTCDate()}
                      </span>
                      <div className="mt-1 space-y-1">
                        {items.slice(0, 3).map((e) => (
                          <Link key={e.id} href={e.href} className={`flex items-center gap-1 truncate rounded-md px-1.5 py-1 text-[11px] font-semibold transition hover:opacity-85 ${TONE[e.status] ?? "bg-mist"}`} title={`${time(e.starts_at)} · ${e.title}`}>
                            {e.type === "audio" ? <Phone className="size-3 shrink-0" /> : <Video className="size-3 shrink-0" />}
                            <span className="truncate">{time(e.starts_at)} {e.title}</span>
                          </Link>
                        ))}
                        {items.length > 3 && <p className="px-1 text-[11px] font-semibold text-muted">+{items.length - 3} more</p>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 border-t border-line px-5 py-3 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-brand-700" /> Confirmed</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-sun-300" /> Awaiting confirmation</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-brand-100" /> Completed</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-red-200" /> Cancelled</span>
      </div>
    </div>
  );
}

export function monthRange(month: string | undefined) {
  const now = new Date();
  const fallback = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit" }).format(now);
  const mm = month && /^\d{4}-\d{2}$/.test(month) ? month : fallback;
  const [y, m] = mm.split("-").map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1) - 3600000);
  const to = new Date(Date.UTC(y, m, 1) - 3600000);
  return { month: mm, from: from.toISOString(), to: to.toISOString() };
}

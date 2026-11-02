"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CalendarCheck, CalendarX, MessageCircle, PhoneMissed, Star, ShieldCheck, AlarmClock, CircleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Item = { id: string; kind: string; title: string; body: string | null; link: string | null; read_at: string | null; created_at: string };

const KIND_ICON: Record<string, typeof Bell> = {
  booking: CalendarCheck,
  confirmed: CalendarCheck,
  cancelled: CalendarX,
  declined: CalendarX,
  message: MessageCircle,
  missed_call: PhoneMissed,
  review: Star,
  approved: ShieldCheck,
  reminder: AlarmClock,
  alert: CircleAlert,
};

function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function NotificationBell() {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return null;
      const json = await res.json();
      setItems(json.items);
      setUnread(json.unread);
      return json.userId as string;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    const supabase = createClient();
    const first = setTimeout(() => load().then((userId) => {
      if (!userId) return;
      channel = supabase
        .channel(`notifications-${userId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => load())
        .subscribe();
    }), 0);
    const t = setInterval(load, 30000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
      if (channel) supabase.removeChannel(channel);
    };
  }, [load]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function markAll() {
    await fetch("/api/notifications", { method: "POST", body: JSON.stringify({ all: true }) });
    setUnread(0);
    setItems((prev) => prev.map((i) => ({ ...i, read_at: i.read_at ?? new Date().toISOString() })));
  }

  async function openItem(i: Item) {
    if (!i.read_at) {
      fetch("/api/notifications", { method: "POST", body: JSON.stringify({ ids: [i.id] }) });
      setUnread((u) => Math.max(0, u - 1));
    }
    setOpen(false);
  }

  return (
    <div className="relative" ref={box}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2.5 text-ink transition hover:bg-black/5"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-sun-500 px-1 text-[10px] font-bold leading-[18px] text-white ring-2 ring-mist">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-lift)]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-display font-bold">Notifications</p>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs font-semibold text-brand-700 hover:underline">
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted">You&apos;re all caught up.</p>
            ) : (
              items.map((i) => {
                const Icon = KIND_ICON[i.kind] ?? Bell;
                const inner = (
                  <div className={`flex gap-3 px-4 py-3 transition hover:bg-mist ${i.read_at ? "" : "bg-brand-50/60"}`}>
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug">{i.title}</p>
                      {i.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{i.body}</p>}
                      <p className="mt-1 text-[11px] text-muted">{ago(i.created_at)}</p>
                    </div>
                    {!i.read_at && <span className="mt-2 size-2 shrink-0 rounded-full bg-sun-500" />}
                  </div>
                );
                return i.link ? (
                  <Link key={i.id} href={i.link} onClick={() => openItem(i)} className="block">
                    {inner}
                  </Link>
                ) : (
                  <button key={i.id} onClick={() => openItem(i)} className="block w-full text-left">
                    {inner}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

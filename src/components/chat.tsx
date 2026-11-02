"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, markRead } from "@/app/actions/messages";

type Msg = { id: string; sender_id: string; body: string; created_at: string };

export function Chat({
  patientId,
  therapistId,
  meId,
  otherName,
  initial,
}: {
  patientId: string;
  therapistId: string;
  meId: string;
  otherName: string;
  initial: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markRead(patientId, therapistId);
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${patientId}-${therapistId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `patient_id=eq.${patientId}` },
        (payload) => {
          const m = payload.new as Msg & { therapist_id: string };
          if (m.therapist_id !== therapistId) return;
          setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
          if (m.sender_id !== meId) markRead(patientId, therapistId);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId, therapistId, meId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError("");
    const res = await sendMessage(patientId, therapistId, text);
    setSending(false);
    if (res.error) return setError(res.error);
    if (res.message) setMessages((prev) => (prev.some((p) => p.id === res.message!.id) ? prev : [...prev, res.message!]));
    setText("");
  }

  const time = (iso: string) =>
    new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

  return (
    <div className="card flex h-[70vh] flex-col p-0">
      <div className="border-b border-black/5 px-5 py-3">
        <p className="font-semibold">{otherName}</p>
        <p className="text-xs text-muted">Private conversation · only you and {otherName} can see these messages</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && <p className="text-center text-sm text-muted">No messages yet. Say hello.</p>}
        {messages.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-brand-600 text-white" : "bg-black/5"}`}>
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-brand-100" : "text-muted"}`}>{time(m.created_at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      <form onSubmit={onSend} className="flex gap-2 border-t border-black/5 p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) onSend(e);
          }}
          rows={1}
          className="input resize-none"
          placeholder="Write a message…"
        />
        <button className="btn-primary" disabled={sending}>{sending ? "…" : "Send"}</button>
      </form>
      {error && <p className="px-5 pb-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}

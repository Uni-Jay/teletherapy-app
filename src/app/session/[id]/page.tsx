import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { formatDateTime, nowMs } from "@/lib/format";
import { APP_NAME } from "@/lib/constants";
import { JitsiRoom } from "@/components/jitsi-room";

export const metadata = { title: "Session" };

const EARLY_MINUTES = 15;

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const { data: a } = await supabase.from("appointments").select("id, patient_id, therapist_id, starts_at, ends_at, type, status, room_name").eq("id", id).single();
  if (!a || (a.patient_id !== user.id && a.therapist_id !== user.id)) notFound();

  const back = user.role === "therapist" ? "/therapist/appointments" : "/patient/appointments";
  const now = nowMs();
  const opens = new Date(a.starts_at).getTime() - EARLY_MINUTES * 60000;
  const closes = new Date(a.ends_at).getTime() + 30 * 60000;

  let blocker: string | null = null;
  if (a.status !== "accepted") blocker = "This session is not confirmed, so the room is closed.";
  else if (now < opens) blocker = `The room opens ${EARLY_MINUTES} minutes before your session on ${formatDateTime(a.starts_at)}.`;
  else if (now > closes) blocker = "This session has ended.";

  if (blocker) {
    return (
      <main className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="page-title">Session room</h1>
        <p className="mt-3 text-muted">{blocker}</p>
        <Link href={back} className="btn-primary mt-6">Back to sessions</Link>
      </main>
    );
  }

  await createAdminClient().from("events").insert({ user_id: user.id, kind: "session_join" });

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between bg-brand-900 px-4 py-2 text-sm text-white">
        <span className="font-semibold">{APP_NAME} · {a.type === "audio" ? "Audio" : "Video"} session</span>
        <Link href={back} className="text-brand-100 hover:text-white">Leave</Link>
      </header>
      <div className="flex-1">
        <JitsiRoom
          domain={process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si"}
          room={`${(process.env.JITSI_ROOM_PREFIX || "mb").replace(/\W/g, "")}-${a.room_name}`}
          displayName={user.fullName || (user.role === "therapist" ? "Therapist" : "Patient")}
          email={user.email}
          audioOnly={a.type === "audio"}
          leaveHref={user.role === "therapist" ? "/therapist/appointments" : homeFor(user.role)}
        />
      </div>
    </div>
  );
}

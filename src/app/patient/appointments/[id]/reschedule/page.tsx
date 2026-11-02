import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/ui/misc";
import { RescheduleForm } from "@/components/reschedule-form";

export const metadata = { title: "Reschedule" };

export default async function Reschedule({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("patient");
  const supabase = await createClient();
  const { data: a } = await supabase.from("appointments").select("id, starts_at, therapist_id, status").eq("id", id).eq("patient_id", user.id).single();
  if (!a || !["requested", "accepted"].includes(a.status)) notFound();
  return (
    <div className="max-w-3xl">
      <Link href="/patient/appointments" className="text-sm text-brand-700">← My sessions</Link>
      <div className="card mt-4">
        <PageHeader title="Reschedule session" text={`Currently booked for ${formatDateTime(a.starts_at)}. Your therapist will need to confirm the new time.`} />
        <RescheduleForm id={a.id} therapistId={a.therapist_id} />
      </div>
    </div>
  );
}

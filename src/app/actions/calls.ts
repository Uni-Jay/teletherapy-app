"use server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createCall } from "@/lib/calls";

export async function startCall(form: FormData) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "patient" && user.role !== "therapist")) redirect("/login");
  const other = String(form.get("other_id") ?? "");
  const type = form.get("type") === "audio" ? "audio" : "video";
  const call = await createCall(user, other, type);
  if (!call) redirect(user.role === "therapist" ? `/therapist/messages/${other}?call=locked` : `/patient/messages/${other}?call=locked`);
  redirect(`/call/${call.id}`);
}

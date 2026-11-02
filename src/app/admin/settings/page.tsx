import { requireRole } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/misc";
import { SettingsForm } from "@/components/settings-form";

export const metadata = { title: "Settings" };

export default async function AdminSettings() {
  await requireRole("admin");
  const s = await getSettings();
  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" />
      <div className="card"><SettingsForm s={s} /></div>
      <p className="mt-4 text-sm text-muted">
        Plan prices are set in Paystack (Plans) and in <code>src/lib/constants.ts</code>. To make someone an admin, run this in the Supabase SQL editor:
        <code className="mt-2 block rounded bg-black/5 p-2 text-xs">update profiles set role = &apos;admin&apos; where email = &apos;person@example.com&apos;;</code>
      </p>
    </div>
  );
}

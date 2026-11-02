import Link from "next/link";
import { Notice } from "./ui/misc";

export function TherapistStatus({ status, reason, hasLicence, profileDone }: { status: string; reason: string | null; hasLicence: boolean; profileDone: boolean }) {
  if (status === "approved") return null;
  if (status === "rejected")
    return (
      <Notice kind="error">
        Your application was not approved{reason ? `: ${reason}` : "."} Update your documents and upload your licence again to be reviewed.{" "}
        <Link href="/therapist/documents" className="font-semibold underline">Update documents</Link>
      </Notice>
    );
  if (status === "suspended") return <Notice kind="error">Your account is suspended and hidden from patients. Please contact the admin team.</Notice>;
  return (
    <Notice kind="warning">
      <p className="font-semibold">Your application is under review.</p>
      <p className="mt-1">Patients will be able to find and book you once an admin verifies your licence. To be reviewed, please:</p>
      <ul className="mt-2 list-inside list-disc">
        <li className={profileDone ? "line-through opacity-60" : ""}><Link href="/therapist/profile" className="underline">Complete your profile</Link></li>
        <li className={hasLicence ? "line-through opacity-60" : ""}><Link href="/therapist/documents" className="underline">Upload your professional licence</Link></li>
        <li><Link href="/therapist/availability" className="underline">Set your working hours</Link></li>
      </ul>
    </Notice>
  );
}

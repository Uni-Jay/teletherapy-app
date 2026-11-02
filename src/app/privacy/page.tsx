import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const metadata = { title: "Privacy policy" };

export default function Privacy() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/" className="text-sm text-brand-700">
        ← {APP_NAME}
      </Link>
      <h1 className="page-title mt-4">Privacy policy</h1>
      <p className="mt-4 text-muted">
        Replace this page with your privacy policy. It should explain what personal and health data you collect, why,
        how long you keep it, who can see it, and how users can request access or deletion, in line with the Nigeria
        Data Protection Act 2023.
      </p>
    </main>
  );
}

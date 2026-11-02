import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const metadata = { title: "Terms of use" };

export default function Terms() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/" className="text-sm text-brand-700">
        ← {APP_NAME}
      </Link>
      <h1 className="page-title mt-4">Terms of use</h1>
      <p className="mt-4 text-muted">
        Replace this page with your terms of use. It should cover eligibility, subscriptions and refunds, cancellations, acceptable use, and the limits of online therapy (it is not an emergency service).
      </p>
    </main>
  );
}

import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function AuthCard({ title, text, children, wide }: { title: string; text?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-10">
      <Link href="/" className="mb-6 text-xl font-bold text-brand-700">
        {APP_NAME}
      </Link>
      <div className={`card w-full ${wide ? "max-w-2xl" : "max-w-md"} p-6 sm:p-8`}>
        <h1 className="text-xl font-bold">{title}</h1>
        {text && <p className="mt-1 text-sm text-muted">{text}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}

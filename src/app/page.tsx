import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

const steps = [
  { title: "Tell us how you feel", text: "Sign up and complete a short, private assessment so we understand what you need." },
  { title: "Choose a verified therapist", text: "Every therapist's licence is checked before they can see patients." },
  { title: "Talk from anywhere", text: "Join secure video or audio sessions from your phone or computer." },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <span className="text-xl font-bold text-brand-700">{APP_NAME}</span>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn-secondary btn-sm">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary btn-sm">
            Get started
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-10 lg:grid-cols-2 lg:pt-20">
        <div>
          <p className="badge bg-brand-100 text-brand-800">Private · Licensed therapists · Online</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
            Talk to a therapist who understands, from wherever you are.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Book video or audio sessions with verified mental health professionals, track how you&apos;re feeling, and
            get support that fits your life.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="btn-primary px-6 py-3 text-base">
              Find support
            </Link>
            <Link href="/register/therapist" className="btn-secondary px-6 py-3 text-base">
              I&apos;m a therapist
            </Link>
          </div>
        </div>
        <div className="card bg-brand-700 p-8 text-white">
          <p className="text-sm uppercase tracking-wide text-brand-100">How it works</p>
          <ol className="mt-4 space-y-6">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 font-semibold">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="mt-1 text-sm text-brand-100">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-black/5 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-14 sm:grid-cols-3">
          {[
            ["Secure and confidential", "Your details are encrypted and only shared with your therapist when you allow it."],
            ["Flexible plans", "Monthly plans from ₦10,000, including a Family plan."],
            ["Not alone", "Join our community channel for support between sessions."],
          ].map(([t, d]) => (
            <div key={t}>
              <p className="font-semibold">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-muted">
        <span>
          © {new Date().getFullYear()} {APP_NAME}
        </span>
        <div className="flex gap-4">
          <a href="/api/telegram" className="hover:text-ink">
            Join our Telegram community
          </a>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
        </div>
      </footer>
      <p className="mx-auto max-w-6xl px-5 pb-8 text-xs text-muted">
        If you are in immediate danger or thinking about harming yourself, call 112 now.
      </p>
    </div>
  );
}

import type { Helpline } from "@/lib/settings";

export function CrisisBanner({ helplines }: { helplines: Helpline[] }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
      <p className="font-semibold">You don&apos;t have to go through this alone.</p>
      <p className="mt-1 text-sm">
        If you are thinking about harming yourself or are in danger right now, please reach out immediately:
      </p>
      <ul className="mt-3 space-y-1 text-sm">
        {helplines.map((h) => (
          <li key={h.name + h.phone}>
            <span className="font-medium">{h.name}:</span>{" "}
            <a href={`tel:${h.phone.replace(/\s/g, "")}`} className="font-semibold underline">
              {h.phone}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm">Our team has been notified and will reach out to you.</p>
    </div>
  );
}

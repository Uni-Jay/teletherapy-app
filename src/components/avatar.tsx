/* eslint-disable @next/next/no-img-element */
import { initials } from "@/lib/format";

const TONES = [
  "bg-brand-100 text-brand-800",
  "bg-sun-100 text-sun-700",
  "bg-[#e7e4fa] text-[#4a3fa0]",
  "bg-[#dcefff] text-[#1d5a8a]",
  "bg-[#fbe3ea] text-[#9b2c4f]",
];

export function Avatar({ name, url, size = 48, dark = false }: { name: string; url?: string | null; size?: number; dark?: boolean }) {
  const letters = initials(name);
  const tone = dark ? "bg-sun-400 text-white" : TONES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % TONES.length];
  return url ? (
    <img src={url} alt={name} width={size} height={size} className="shrink-0 rounded-full object-cover ring-2 ring-white" style={{ width: size, height: size }} />
  ) : (
    <div className={`flex shrink-0 items-center justify-center rounded-full font-bold ${tone}`} style={{ width: size, height: size, fontSize: size / 2.7 }}>
      {letters || "?"}
    </div>
  );
}

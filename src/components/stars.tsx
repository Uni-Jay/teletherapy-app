import { Star } from "lucide-react";

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-line" style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="text-amber-400" style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function RatingSummary({ avg, count }: { avg: number; count: number }) {
  if (!count) return <span className="text-xs font-medium text-muted">New on the platform</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <Stars value={Number(avg)} size={14} />
      <span className="font-semibold">{Number(avg).toFixed(1)}</span>
      <span className="text-muted">({count})</span>
    </span>
  );
}

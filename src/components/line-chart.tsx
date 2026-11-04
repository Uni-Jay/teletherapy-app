"use client";
import { useEffect, useRef, useState } from "react";

type Point = { x: string; y: number; label?: string };

/** Small dependency-free line chart. It measures its container so text stays the same size at any width. */
export function LineChart({ points, max, min = 0, color = "#276e64", height = 200 }: { points: Point[]; max: number; min?: number; color?: string; height?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pad = { l: 30, r: 16, t: 12, b: 26 };
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const xs = (i: number) => pad.l + (points.length === 1 ? iw / 2 : (i * iw) / (points.length - 1));
  const ys = (v: number) => pad.t + ih - ((v - min) / (max - min)) * ih;
  const ticks = [min, Math.round((min + max) / 2), max];
  const path = points.map((p, i) => `${i ? "L" : "M"}${xs(i).toFixed(1)},${ys(p.y).toFixed(1)}`).join(" ");
  // Label roughly every 90px, always including the first and last point
  const every = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(iw / 90))));
  const shown = new Set<number>();
  for (let i = 0; i < points.length; i += every) shown.add(i);
  const last = points.length - 1;
  if (last > 0) {
    if ([...shown].some((i) => i !== last && last - i < every)) shown.delete([...shown].filter((i) => i !== last).pop()!);
    shown.add(last);
  }

  return (
    <div ref={box} className="w-full">
      <svg width={width} height={height} role="img" className="block">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={ys(t)} y2={ys(t)} stroke="var(--color-line)" />
            <text x={pad.l - 8} y={ys(t) + 4} fontSize="11" textAnchor="end" fill="var(--color-muted)">{t}</text>
          </g>
        ))}
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={xs(i)} cy={ys(p.y)} r="4" fill="var(--color-surface)" stroke={color} strokeWidth="2">
              <title>{`${p.x}: ${p.label ?? p.y}`}</title>
            </circle>
            {shown.has(i) && (
              <text
                x={xs(i)}
                y={height - 6}
                fontSize="11"
                textAnchor={points.length > 1 && i === 0 ? "start" : points.length > 1 && i === last ? "end" : "middle"}
                fill="var(--color-muted)"
              >
                {p.x}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

type Point = { x: string; y: number; label?: string };

/** Small dependency-free line chart rendered as SVG. */
export function LineChart({ points, max, min = 0, color = "#276e64", height = 200 }: { points: Point[]; max: number; min?: number; color?: string; height?: number }) {
  const width = 640;
  const pad = { l: 32, r: 12, t: 12, b: 28 };
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const xs = (i: number) => pad.l + (points.length === 1 ? iw / 2 : (i * iw) / (points.length - 1));
  const ys = (v: number) => pad.t + ih - ((v - min) / (max - min)) * ih;
  const ticks = [min, Math.round((min + max) / 2), max];
  const path = points.map((p, i) => `${i ? "L" : "M"}${xs(i).toFixed(1)},${ys(p.y).toFixed(1)}`).join(" ");
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={width - pad.r} y1={ys(t)} y2={ys(t)} stroke="#e5e7eb" />
          <text x={pad.l - 8} y={ys(t) + 4} fontSize="11" textAnchor="end" fill="#5f6f6d">{t}</text>
        </g>
      ))}
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={xs(i)} cy={ys(p.y)} r="4" fill="#fff" stroke={color} strokeWidth="2">
            <title>{`${p.x}: ${p.label ?? p.y}`}</title>
          </circle>
          {i % labelEvery === 0 && (
            <text x={xs(i)} y={height - 8} fontSize="11" textAnchor="middle" fill="#5f6f6d">{p.x}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

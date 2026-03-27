import type { VlmResults } from './vlm';
import styles from './maintenance.module.css';

const CHART_COLORS: Record<string, string> = {
  waste_detection_v1: '#f97316',
  fire_smoke_v1: '#ef4444',
  structural_crack_v1: '#6366f1',
};

const TASK_SHORT: Record<string, string> = {
  waste_detection_v1: 'Waste',
  fire_smoke_v1: 'Fire/Smoke',
  structural_crack_v1: 'Structural',
};

interface Props {
  vlm: VlmResults;
}

export default function ConfidenceChart({ vlm }: Props) {
  const series = Object.entries(vlm)
    .filter(([, s]) => s && Array.isArray(s.findings))
    .map(([tid, summary]) => {
      const pts = summary.findings
        .filter((f: { confidence: number; timestamps: number[] }) => f.confidence != null && f.timestamps?.length)
        .map((f: { confidence: number; timestamps: number[] }) => ({
          t: f.timestamps.reduce((a: number, b: number) => a + b, 0) / f.timestamps.length / 1000,
          c: f.confidence,
        }))
        .sort((a: { t: number }, b: { t: number }) => a.t - b.t);
      return { tid, label: TASK_SHORT[tid] || tid, color: CHART_COLORS[tid] || '#8890a4', pts };
    })
    .filter((s) => s.pts.length > 0);

  if (!series.length) return null;

  const W = 480;
  const H = 180;
  const PAD = { top: 16, right: 16, bottom: 36, left: 40 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const allT = series.flatMap((s) => s.pts.map((p: { t: number }) => p.t));
  const maxT = Math.max(...allT, 1);
  const sx = (t: number) => PAD.left + (t / maxT) * cW;
  const sy = (c: number) => PAD.top + cH - c * cH;

  return (
    <div className={styles.chartWrap}>
      <svg viewBox={`0 0 ${W} ${H}`}>
        <rect width={W} height={H} fill="var(--color-bg-secondary)" rx="8" />
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((v) => (
          <g key={v}>
            <line
              x1={PAD.left} y1={sy(v)} x2={PAD.left + cW} y2={sy(v)}
              stroke="var(--color-border)" strokeWidth="0.5"
            />
            <text x={PAD.left - 4} y={sy(v) + 3} textAnchor="end" fontSize="9" fill="var(--color-text-secondary)">
              {v.toFixed(2)}
            </text>
          </g>
        ))}
        {/* X axis */}
        {Array.from({ length: Math.min(7, Math.ceil(maxT)) + 1 }, (_, i) => {
          const t = (i / Math.min(7, Math.ceil(maxT))) * maxT;
          return (
            <text key={i} x={sx(t)} y={PAD.top + cH + 14} textAnchor="middle" fontSize="9" fill="var(--color-text-secondary)">
              {t.toFixed(0)}s
            </text>
          );
        })}
        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + cH} stroke="var(--color-border)" />
        <line x1={PAD.left} y1={PAD.top + cH} x2={PAD.left + cW} y2={PAD.top + cH} stroke="var(--color-border)" />
        {/* Series */}
        {series.map((s) => (
          <g key={s.tid}>
            <polyline
              points={s.pts.map((p: { t: number; c: number }) => `${sx(p.t)},${sy(p.c)}`).join(' ')}
              fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round"
            />
            {s.pts.map((p: { t: number; c: number }, i: number) => (
              <circle key={i} cx={sx(p.t)} cy={sy(p.c)} r="3" fill={s.color} stroke="white" strokeWidth="1" />
            ))}
          </g>
        ))}
        {/* Legend */}
        {series.map((s, i) => (
          <g key={s.tid}>
            <rect x={PAD.left + i * (cW / series.length)} y={H - 10} width="12" height="3" rx="1.5" fill={s.color} />
            <text x={PAD.left + i * (cW / series.length) + 16} y={H - 6} fontSize="9" fill="var(--color-text-secondary)">
              {s.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

import styles from './MultiLineGraph.module.css';

interface Series {
  data: number[];
  label: string;
  unit: string;
  color: string;
  currentValue: string;
}

interface MultiLineGraphProps {
  series: Series[];
  title: string;
}

// Layout
const VW = 420;
const VH = 140;
const M = { top: 8, right: 12, bottom: 24, left: 34 };
const CW = VW - M.left - M.right; // chart area width
const CH = VH - M.top - M.bottom; // chart area height

// Horizontal grid at 25 / 50 / 75 %
const Y_GRID = [0.25, 0.5, 0.75];

// X ticks for 24 hourly points
const X_TICKS = [
  { idx: 0,  label: '00:00' },
  { idx: 6,  label: '06:00' },
  { idx: 12, label: '12:00' },
  { idx: 18, label: '18:00' },
  { idx: 23, label: 'now' },
];

export default function MultiLineGraph({ series, title }: MultiLineGraphProps) {
  return (
    <div className={styles.container}>
      {/* Legend header */}
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <div className={styles.legend}>
          {series.map((s) => (
            <span key={s.label} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: s.color }} />
              {s.label}
              <span className={styles.legendValue}>{s.currentValue}</span>
            </span>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', height: '160px' }}>
        <g transform={`translate(${M.left},${M.top})`}>

          {/* Horizontal grid lines */}
          {Y_GRID.map((pct) => {
            const y = CH * (1 - pct);
            return (
              <g key={pct}>
                <line
                  x1={0} y1={y} x2={CW} y2={y}
                  stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="3 3"
                />
                <text
                  x={-4} y={y + 3.5}
                  textAnchor="end" fontSize="8" fill="var(--color-text-secondary)"
                  fontFamily="inherit"
                >
                  {Math.round(pct * 100)}%
                </text>
              </g>
            );
          })}

          {/* Baseline */}
          <line x1={0} y1={CH} x2={CW} y2={CH} stroke="var(--color-border)" strokeWidth="0.5" />

          {/* X-axis ticks & labels */}
          {X_TICKS.map(({ idx, label }) => {
            const n = series[0]?.data.length ?? 24;
            const x = (idx / (n - 1)) * CW;
            return (
              <g key={label}>
                <line x1={x} y1={CH} x2={x} y2={CH + 4} stroke="var(--color-border)" strokeWidth="0.5" />
                <text
                  x={x} y={CH + 13}
                  textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)"
                  fontFamily="inherit"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Lines */}
          {series.map((s) => {
            const max = Math.max(...s.data);
            const min = Math.min(...s.data);
            const range = max - min || 1;
            const n = s.data.length;

            const points = s.data
              .map((v, i) => `${(i / (n - 1)) * CW},${CH - ((v - min) / range) * CH}`)
              .join(' ');

            return (
              <polyline key={s.label} points={points} fill="none" stroke={s.color} strokeWidth="1.5" />
            );
          })}

        </g>
      </svg>
    </div>
  );
}

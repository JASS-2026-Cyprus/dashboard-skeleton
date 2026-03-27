import styles from './MultiLineGraph.module.css';

export interface Series {
  data: number[];
  label: string;
  unit: string;
  color: string;
  currentValue: string;
  yAxisId: 'left' | 'right';
}

interface MultiLineGraphProps {
  series: Series[];
  title: string;
}

// Layout
const VW = 440;
const VH = 150;
const M = { top: 10, right: 44, bottom: 24, left: 38 };
const CW = VW - M.left - M.right;
const CH = VH - M.top - M.bottom;

// Compute nice round ticks for an axis
function niceTicks(max: number, count = 5): number[] {
  if (max === 0) return Array.from({ length: count }, (_, i) => i);
  const raw = max / (count - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = Math.ceil(raw / magnitude) * magnitude;
  return Array.from({ length: count }, (_, i) => +(i * step).toFixed(3));
}

const X_TICK_FRACTIONS = [
  { frac: 0,    label: 'start' },
  { frac: 0.25, label: '25%' },
  { frac: 0.5,  label: '50%' },
  { frac: 0.75, label: '75%' },
  { frac: 1,    label: 'now' },
];

export default function MultiLineGraph({ series, title }: MultiLineGraphProps) {
  const leftSeries  = series.filter((s) => s.yAxisId === 'left');
  const rightSeries = series.filter((s) => s.yAxisId === 'right');

  const leftMax  = Math.max(...leftSeries.flatMap((s) => s.data), 0);
  const rightMax = Math.max(...rightSeries.flatMap((s) => s.data), 0);

  const leftTicks  = niceTicks(leftMax);
  const rightTicks = niceTicks(rightMax);

  const leftAxisMax  = leftTicks[leftTicks.length - 1]  || 1;
  const rightAxisMax = rightTicks[rightTicks.length - 1] || 1;

  const toY = (value: number, axisMax: number) =>
    CH - (value / axisMax) * CH;

  const toX = (i: number, n: number) => (i / (n - 1)) * CW;

  return (
    <div className={styles.container}>
      {/* Legend */}
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

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', height: '170px' }}>
        <g transform={`translate(${M.left},${M.top})`}>

          {/* Grid lines + left axis ticks */}
          {leftTicks.map((tick) => {
            const y = toY(tick, leftAxisMax);
            return (
              <g key={tick}>
                <line
                  x1={0} y1={y} x2={CW} y2={y}
                  stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="3 3"
                />
                <text
                  x={-5} y={y + 3.5}
                  textAnchor="end" fontSize="8" fill="var(--color-text-secondary)"
                  fontFamily="inherit"
                >
                  {tick % 1 === 0 ? tick : tick.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Left axis label */}
          {leftSeries.length > 0 && (
            <text
              x={-28} y={CH / 2}
              textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)"
              fontFamily="inherit"
              transform={`rotate(-90, -28, ${CH / 2})`}
            >
              µg/m³
            </text>
          )}

          {/* Right axis ticks + label */}
          {rightSeries.length > 0 && rightTicks.map((tick) => {
            const y = toY(tick, rightAxisMax);
            return (
              <text
                key={tick}
                x={CW + 5} y={y + 3.5}
                textAnchor="start" fontSize="8" fill={rightSeries[0].color}
                fontFamily="inherit" opacity="0.8"
              >
                {tick % 1 === 0 ? tick : tick.toFixed(2)}
              </text>
            );
          })}
          {rightSeries.length > 0 && (
            <text
              x={CW + 38} y={CH / 2}
              textAnchor="middle" fontSize="7.5" fill={rightSeries[0].color}
              fontFamily="inherit" opacity="0.8"
              transform={`rotate(90, ${CW + 38}, ${CH / 2})`}
            >
              mg/m³
            </text>
          )}

          {/* Baseline */}
          <line x1={0} y1={CH} x2={CW} y2={CH} stroke="var(--color-border)" strokeWidth="0.5" />

          {/* X-axis ticks */}
          {X_TICK_FRACTIONS.map(({ frac, label }) => {
            const x = frac * CW;
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
            const axisMax = s.yAxisId === 'left' ? leftAxisMax : rightAxisMax;
            const n = s.data.length;
            const points = s.data
              .map((v, i) => `${toX(i, n)},${toY(v, axisMax)}`)
              .join(' ');
            return (
              <polyline
                key={s.label}
                points={points}
                fill="none"
                stroke={s.color}
                strokeWidth="1.5"
              />
            );
          })}

        </g>
      </svg>
    </div>
  );
}

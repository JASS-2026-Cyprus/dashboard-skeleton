import type { BarGraphProps } from '../types';
import GraphCard from './GraphCard';

export default function BarGraph({ data, label, currentValue, color = 'var(--color-green)' }: BarGraphProps) {
  const width = 240;
  const height = 60;
  const max = Math.max(...data) || 1;
  const barWidth = 4;
  const gap = width / data.length;

  return (
    <GraphCard label={label} currentValue={currentValue}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '60px' }}>
        <line x1="0" y1={height - 5} x2={width} y2={height - 5} stroke="var(--color-border)" strokeWidth="0.5" />
        {data.map((value, i) => {
          const barHeight = (value / max) * (height - 15);
          const x = gap * i + gap / 2 - barWidth / 2;
          const y = height - 5 - barHeight;
          return (
            <rect key={i} x={x} y={y} width={barWidth} height={barHeight} fill={color} />
          );
        })}
      </svg>
    </GraphCard>
  );
}

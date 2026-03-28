import type { LineGraphProps } from '../types';
import GraphCard from './GraphCard';

export default function LineGraph({ data, label, currentValue, color = 'var(--color-blue)' }: LineGraphProps) {
  const width = 240;
  const height = 60;

  if (data.length < 2) {
    return (
      <GraphCard label={label} currentValue={currentValue}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '44px' }}>
          <line x1="0" y1={height} x2={width} y2={height} stroke="var(--color-border)" strokeWidth="0.5" />
        </svg>
      </GraphCard>
    );
  }

  const dataMax = Math.max(...data);
  const dataMin = Math.min(...data);
  const padding = (dataMax - dataMin) * 1.5 || 1;
  const max = dataMax + padding;
  const min = Math.max(0, dataMin - padding);
  const range = max - min || 1;

  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 10) - 5;
      return `${x},${y}`;
    })
    .join(' ');

  const fillPoints = `${points} ${width},${height} 0,${height}`;

  return (
    <GraphCard label={label} currentValue={currentValue}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '60px' }}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
        <polyline points={fillPoints} fill={color} opacity="0.1" />
        <line x1="0" y1={height} x2={width} y2={height} stroke="var(--color-border)" strokeWidth="0.5" />
      </svg>
    </GraphCard>
  );
}

import type { Report } from './firebase';

interface Props {
  reports: Report[];
}

export default function MaintenanceOverviewContent({ reports }: Props) {
  // Status breakdown
  const pending = reports.filter(r => r.status === 'pending').length;
  const inProgress = reports.filter(r => r.status === 'in_progress').length;

  // Severity breakdown
  const high = reports.filter(r => r.severity === 'high').length;
  const medium = reports.filter(r => r.severity === 'medium').length;
  const low = reports.filter(r => r.severity === 'low').length;
  const sevTotal = high + medium + low;

  // Semicircular donut chart calculations (180 degrees, flat edge on bottom, arc on top - gauge style)
  const slices = [
    { label: 'High', count: high, color: '#ef4444' },
    { label: 'Medium', count: medium, color: '#f97316' },
    { label: 'Low', count: low, color: '#059669' },
  ].filter(s => s.count > 0);

  let angle = 270; // Start at left
  const pieSlices = slices.map(s => {
    const pct = sevTotal > 0 ? s.count / sevTotal : 0;
    const start = angle;
    angle += pct * 180; // Only 180 degrees for semicircle, sweeps left->top->right
    return { ...s, start, end: angle, pct };
  });

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const cx = 60, cy = 65, r = 50;

  return (
    <div style={{ padding: '0.5rem 0' }}>
      {/* Severity donut chart - Semicircular */}
      <div style={{ marginBottom: '0.75rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          Severity Distribution
        </div>

        {sevTotal > 0 ? (
          <div style={{ position: 'relative', width: '100%' }}>
            {/* Semicircular Donut - Centered */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '0 auto' }}>
              <div style={{ width: '70%', maxWidth: '400px' }}>
                <svg viewBox="0 0 140 95" width="100%" height="auto" style={{ maxWidth: '100%', display: 'block' }} preserveAspectRatio="xMidYMid meet">
                  {pieSlices.map((p) => {
                    const s = toRad(p.start - 90);
                    const e = toRad(p.end - 90);
                    const x1 = cx + r * Math.cos(s);
                    const y1 = cy + r * Math.sin(s);
                    const x2 = cx + r * Math.cos(e);
                    const y2 = cy + r * Math.sin(e);
                    const large = p.pct > 0.5 ? 1 : 0;
                    return <path key={p.label} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`} fill={p.color} />;
                  })}
                  <circle cx={cx} cy={cy} r={30} fill="var(--color-bg-primary)" />
                  <text x={cx} y={cy - 3} textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--color-text-primary)">{sevTotal}</text>
                  <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="var(--color-text-secondary)">issues found</text>
                </svg>
              </div>
            </div>

            {/* Legend - Right aligned overlay */}
            <div style={{ position: 'absolute', right: '1rem', top: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem', backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '6px' }}>
              {slices.map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 11, whiteSpace: 'nowrap' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ color: 'var(--color-text-secondary)' }}>{s.label}</span>
                  <span style={{ fontWeight: 600, color: s.color, marginLeft: '0.25rem' }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center', padding: '1rem' }}>
            No issues detected
          </div>
        )}
      </div>

      {/* Status blocks */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          Issues by Status
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {/* Pending block */}
          <div style={{
            flex: 1,
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: 8,
            padding: '0.75rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f97316', marginBottom: '0.25rem' }}>
              {pending}
            </div>
            <div style={{ fontSize: 11, color: '#92400e', fontWeight: 500 }}>Pending</div>
          </div>

          {/* In Progress block */}
          <div style={{
            flex: 1,
            background: '#ede9fe',
            border: '1px solid #ddd6fe',
            borderRadius: 8,
            padding: '0.75rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#a855f7', marginBottom: '0.25rem' }}>
              {inProgress}
            </div>
            <div style={{ fontSize: 11, color: '#6b21a8', fontWeight: 500 }}>In Progress</div>
          </div>
        </div>
      </div>
    </div>
  );
}

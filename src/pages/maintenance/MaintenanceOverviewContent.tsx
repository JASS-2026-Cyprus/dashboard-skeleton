import type { Report } from './firebase';
import DroneStatus from './DroneStatus';
import AgentStatusMini from './AgentStatusMini';

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

  const slices = [
    { label: 'High', count: high, color: '#ef4444' },
    { label: 'Medium', count: medium, color: '#f97316' },
    { label: 'Low', count: low, color: '#059669' },
  ].filter(s => s.count > 0);

  // Semicircular donut: 180° gauge, left→top→right
  let angle = 270;
  const pieSlices = slices.map(s => {
    const pct = sevTotal > 0 ? s.count / sevTotal : 0;
    const start = angle;
    angle += pct * 180;
    return { ...s, start, end: angle, pct };
  });

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const cx = 60, cy = 65, r = 50;

  return (
    <div style={{ padding: '0.5rem 0' }}>
      {/* Severity donut chart */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          Severity Distribution
        </div>

        {sevTotal > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            {/* Donut – fixed size, no absolute positioning */}
            <div style={{ flexShrink: 0, width: 160 }}>
              <svg viewBox="0 0 120 75" width="160" height="100" style={{ display: 'block', overflow: 'visible' }}>
                {pieSlices.map((p) => {
                  const s = toRad(p.start - 90);
                  const e = toRad(p.end - 90);
                  const x1 = cx + r * Math.cos(s);
                  const y1 = cy + r * Math.sin(s);
                  const x2 = cx + r * Math.cos(e);
                  const y2 = cy + r * Math.sin(e);
                  const large = p.pct > 0.5 ? 1 : 0;
                  return (
                    <path
                      key={p.label}
                      d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`}
                      fill={p.color}
                    />
                  );
                })}
                <circle cx={cx} cy={cy} r={30} fill="var(--color-bg-primary)" />
                <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="700" fill="var(--color-text-primary)">{sevTotal}</text>
                <text x={cx} y={cy + 13} textAnchor="middle" fontSize="9" fill="var(--color-text-secondary)">issues</text>
              </svg>
            </div>

            {/* Legend – inline, right of chart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {slices.map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ color: 'var(--color-text-secondary)' }}>{s.label}</span>
                  <span style={{ fontWeight: 600, color: s.color, marginLeft: '0.15rem' }}>{s.count}</span>
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
            background: 'rgba(249, 115, 22, 0.08)',
            border: '1px solid rgba(249, 115, 22, 0.25)',
            borderRadius: 8,
            padding: '0.75rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f97316', marginBottom: '0.25rem' }}>
              {pending}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Pending</div>
          </div>

          {/* In Progress block */}
          <div style={{
            flex: 1,
            background: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            borderRadius: 8,
            padding: '0.75rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#a855f7', marginBottom: '0.25rem' }}>
              {inProgress}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 500 }}>In Progress</div>
          </div>
        </div>

        {/* Drone Status – with visual separator */}
        <div style={{ borderTop: '0.5px solid var(--color-border)', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
          <DroneStatus />
        </div>

        {/* Agent status mini card */}
        <div style={{ marginTop: '0.75rem' }}>
          <AgentStatusMini />
        </div>
      </div>
    </div>
  );
}

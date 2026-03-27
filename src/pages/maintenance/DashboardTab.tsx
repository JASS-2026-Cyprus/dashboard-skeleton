import { useState, useMemo } from 'react';
import type { Report } from './firebase';
import styles from './maintenance.module.css';

const CAT_COLORS: Record<string, string> = {
  trash: '#f97316', waste: '#f97316', fire: '#ef4444', smoke: '#ef4444',
  hazardous: '#ef4444', structural: '#a855f7', flooding: '#3b82f6',
  graffiti: '#6366f1', vandalism: '#6366f1',
};

const CHART_COLORS = ['#059669', '#f97316', '#ef4444', '#6366f1', '#eab308', '#06b6d4', '#a855f7', '#ec4899'];

function getWeekSpan(reports: Report[]) {
  if (!reports.length) return 1;
  const dates = reports.map((r) => new Date(r.createdAt).getTime()).filter((t) => t > 0);
  if (!dates.length) return 1;
  const range = Math.max(...dates) - Math.min(...dates);
  return Math.max(1, Math.ceil(range / (7 * 86400000)));
}

interface Props {
  reports: Report[];
}

export default function DashboardTab({ reports }: Props) {
  const [timeRange, setTimeRange] = useState('all');

  const filtered = useMemo(() => {
    if (timeRange === 'all') return reports;
    const cutoff = Date.now() - parseInt(timeRange) * 86400000;
    return reports.filter((r) => r.createdAt && new Date(r.createdAt).getTime() >= cutoff);
  }, [reports, timeRange]);

  const rTotal = filtered.length;
  const rPending = filtered.filter((r) => r.status === 'pending').length;
  const rProgress = filtered.filter((r) => r.status === 'in_progress').length;
  const rResolved = filtered.filter((r) => r.status === 'resolved').length;
  const rHigh = filtered.filter((r) => r.severity === 'high').length;
  const resolveRate = rTotal > 0 ? Math.round((rResolved / rTotal) * 100) : 0;

  // Category counts
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((r) => {
      const c = r.category || 'unknown';
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  // Severity counts for pie
  const sevCounts = useMemo(() => {
    const c = { high: 0, medium: 0, low: 0 };
    filtered.forEach((r) => {
      if (c[r.severity] !== undefined) c[r.severity]++;
    });
    return c;
  }, [filtered]);

  // Timeline (group by week)
  const timelineData = useMemo(() => {
    const weeks: Record<string, number> = {};
    filtered.forEach((r) => {
      if (!r.createdAt) return;
      const d = new Date(r.createdAt);
      const ws = new Date(d);
      ws.setDate(d.getDate() - d.getDay());
      const key = ws.toISOString().slice(0, 10);
      weeks[key] = (weeks[key] || 0) + 1;
    });
    return Object.entries(weeks).sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
  }, [filtered]);

  // Top reporters
  const topReporters = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((r) => {
      const name = r.reportedBy || 'Anonymous';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filtered]);

  // Hotspots
  const hotspots = useMemo(() => {
    const areas: Record<string, number> = {};
    filtered.forEach((r) => {
      const loc = r.address || (r.lat ? `${Number(r.lat).toFixed(3)}, ${Number(r.lng).toFixed(3)}` : null);
      if (loc) areas[loc] = (areas[loc] || 0) + 1;
    });
    return Object.entries(areas).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filtered]);

  // Severity pie
  const sevTotal = sevCounts.high + sevCounts.medium + sevCounts.low;
  const slices = [
    { label: 'High', count: sevCounts.high, color: '#ef4444' },
    { label: 'Medium', count: sevCounts.medium, color: '#f97316' },
    { label: 'Low', count: sevCounts.low, color: '#059669' },
  ].filter((s) => s.count > 0);

  let angle = 0;
  const pieSlices = slices.map((s) => {
    const pct = sevTotal > 0 ? s.count / sevTotal : 0;
    const start = angle;
    angle += pct * 360;
    return { ...s, start, end: angle, pct };
  });

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const cx = 55, cy = 55, r = 45;

  // Report status bars
  const rMax = Math.max(rPending, rProgress, rResolved, 1);

  // Timeline chart
  const tlMax = timelineData.length ? Math.max(...timelineData.map((t) => t[1])) : 1;
  const TW = 400, TH = 140;
  const TPAD = { top: 10, right: 10, bottom: 24, left: 30 };
  const tcW = TW - TPAD.left - TPAD.right;
  const tcH = TH - TPAD.top - TPAD.bottom;

  return (
    <>
      {/* Time filter */}
      <div style={{ marginBottom: '1rem' }}>
        <select className={styles.filterSelect} value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <option value="all">All time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Stats cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statVal}>{rTotal}</div>
          <div className={styles.statLbl}>Total Reports</div>
        </div>
        <div className={`${styles.statCard} ${styles.statWarn}`}>
          <div className={styles.statVal}>{rPending}</div>
          <div className={styles.statLbl}>Pending</div>
        </div>
        <div className={`${styles.statCard} ${styles.statGood}`}>
          <div className={styles.statVal}>{rResolved}</div>
          <div className={styles.statLbl}>Resolved</div>
        </div>
        <div className={`${styles.statCard} ${styles.statDanger}`}>
          <div className={styles.statVal}>{rHigh}</div>
          <div className={styles.statLbl}>High Severity</div>
        </div>
      </div>

      <div className={styles.dashGrid}>
        {/* Timeline chart */}
        <div className={styles.dashSection}>
          <div className={styles.dashSectionTitle}>Reports Timeline</div>
          {timelineData.length > 0 ? (
            <svg viewBox={`0 0 ${TW} ${TH}`} style={{ width: '100%', height: 'auto' }}>
              {[0, 1, 2, 3, 4].map((i) => {
                const y = TPAD.top + (i / 4) * tcH;
                return (
                  <g key={i}>
                    <line x1={TPAD.left} y1={y} x2={TPAD.left + tcW} y2={y} stroke="var(--color-border)" strokeWidth="0.5" />
                    <text x={TPAD.left - 4} y={y + 3} textAnchor="end" fontSize="9" fill="var(--color-text-secondary)">
                      {Math.round(tlMax * (1 - i / 4))}
                    </text>
                  </g>
                );
              })}
              {timelineData.map(([week, cnt], i) => {
                const barW = Math.max(8, tcW / timelineData.length - 4);
                const x = TPAD.left + (i / timelineData.length) * tcW + 2;
                const h = (cnt / tlMax) * tcH;
                const y = TPAD.top + tcH - h;
                return (
                  <g key={week}>
                    <rect x={x} y={y} width={barW} height={h} rx={3} fill="var(--color-blue)" opacity={0.85} />
                    <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="9" fill="var(--color-text-secondary)" fontWeight="600">{cnt}</text>
                    <text x={x + barW / 2} y={TH - 4} textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)">{week.slice(5)}</text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className={styles.empty}>No data yet</div>
          )}
        </div>

        {/* Category distribution */}
        <div className={styles.dashSection}>
          <div className={styles.dashSectionTitle}>Category Distribution</div>
          {catCounts.length > 0 ? (
            catCounts.map(([cat, cnt], i) => {
              const color = CAT_COLORS[cat.toLowerCase()] || CHART_COLORS[i % CHART_COLORS.length];
              const max = catCounts[0][1];
              return (
                <div key={cat} className={styles.barRow}>
                  <span className={styles.barLabel}>{cat}</span>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${(cnt / max) * 100}%`, background: color }} />
                  </div>
                  <span className={styles.barVal}>{cnt}</span>
                </div>
              );
            })
          ) : (
            <div className={styles.empty}>No data yet</div>
          )}
        </div>

        {/* Report status */}
        <div className={styles.dashSection}>
          <div className={styles.dashSectionTitle}>Report Status</div>
          <div className={styles.barRow}>
            <span className={styles.barLabel}>⏳ Pending</span>
            <div className={styles.barTrack}>
              <div className={styles.barFill} style={{ width: `${(rPending / rMax) * 100}%`, background: '#f97316' }} />
            </div>
            <span className={styles.barVal}>{rPending}</span>
          </div>
          <div className={styles.barRow}>
            <span className={styles.barLabel}>🚁 In Progress</span>
            <div className={styles.barTrack}>
              <div className={styles.barFill} style={{ width: `${(rProgress / rMax) * 100}%`, background: '#a855f7' }} />
            </div>
            <span className={styles.barVal}>{rProgress}</span>
          </div>
          <div className={styles.barRow}>
            <span className={styles.barLabel}>✅ Resolved</span>
            <div className={styles.barTrack}>
              <div className={styles.barFill} style={{ width: `${(rResolved / rMax) * 100}%`, background: '#059669' }} />
            </div>
            <span className={styles.barVal}>{rResolved}</span>
          </div>
        </div>

        {/* Severity pie */}
        <div className={styles.dashSection}>
          <div className={styles.dashSectionTitle}>Severity Distribution</div>
          {sevTotal > 0 ? (
            <>
              <svg viewBox="0 0 110 110" width="110" height="110" className={styles.pieSvg}>
                {pieSlices.map((p) => {
                  if (p.pct >= 0.999) return <circle key={p.label} cx={cx} cy={cy} r={r} fill={p.color} />;
                  const s = toRad(p.start - 90);
                  const e = toRad(p.end - 90);
                  const x1 = cx + r * Math.cos(s);
                  const y1 = cy + r * Math.sin(s);
                  const x2 = cx + r * Math.cos(e);
                  const y2 = cy + r * Math.sin(e);
                  const large = p.pct > 0.5 ? 1 : 0;
                  return <path key={p.label} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`} fill={p.color} />;
                })}
                <circle cx={cx} cy={cy} r={22} fill="var(--color-bg-primary)" />
                <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="700" fill="var(--color-text-primary)">{sevTotal}</text>
              </svg>
              {slices.map((s) => (
                <div key={s.label} className={styles.catRow}>
                  <span className={styles.catDot} style={{ background: s.color }} />
                  <span className={styles.catName}>{s.label}</span>
                  <span className={styles.catCnt}>{s.count}</span>
                </div>
              ))}
            </>
          ) : (
            <div className={styles.empty}>No data</div>
          )}
        </div>

        {/* Sidebar stats */}
        <div className={styles.dashSection}>
          <div className={styles.dashSectionTitle}>Summary</div>
          <div className={styles.sidebarStat}>
            <span>Resolve Rate</span>
            <span className={styles.sidebarStatVal}>{resolveRate}%</span>
          </div>
          <div className={styles.sidebarStat}>
            <span>In Progress</span>
            <span className={styles.sidebarStatVal}>{rProgress}</span>
          </div>
          <div className={styles.sidebarStat}>
            <span>Reports/Week</span>
            <span className={styles.sidebarStatVal}>{rTotal > 0 ? (rTotal / getWeekSpan(filtered)).toFixed(1) : '0'}</span>
          </div>
        </div>

        {/* Categories */}
        <div className={styles.dashSection}>
          <div className={styles.dashSectionTitle}>Categories</div>
          {catCounts.length > 0 ? (
            catCounts.map(([cat, cnt]) => {
              const color = CAT_COLORS[cat.toLowerCase()] || '#6b7280';
              return (
                <div key={cat} className={styles.catRow}>
                  <span className={styles.catDot} style={{ background: color }} />
                  <span className={styles.catName}>{cat}</span>
                  <span className={styles.catCnt}>{cnt}</span>
                </div>
              );
            })
          ) : (
            <div className={styles.empty}>No categories</div>
          )}
        </div>

        {/* Top reporters */}
        <div className={styles.dashSection}>
          <div className={styles.dashSectionTitle}>Top Reporters</div>
          {topReporters.length > 0 ? (
            topReporters.map(([name, cnt], i) => {
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div key={name} className={styles.activityItem}>
                  <span>{medals[i] || '👤'}</span>
                  <span className={styles.actText}><strong>{name}</strong></span>
                  <span className={styles.actTime}>{cnt} report{cnt > 1 ? 's' : ''}</span>
                </div>
              );
            })
          ) : (
            <div className={styles.empty}>No reporters yet</div>
          )}
        </div>

        {/* Hotspots */}
        <div className={styles.dashSection}>
          <div className={styles.dashSectionTitle}>Hotspot Areas</div>
          {hotspots.length > 0 ? (
            hotspots.map(([loc, cnt]) => (
              <div key={loc} className={styles.activityItem}>
                <span>📍</span>
                <span className={styles.actText}>{loc}</span>
                <span className={styles.actTime}>{cnt} report{cnt > 1 ? 's' : ''}</span>
              </div>
            ))
          ) : (
            <div className={styles.empty}>No location data</div>
          )}
        </div>
      </div>
    </>
  );
}

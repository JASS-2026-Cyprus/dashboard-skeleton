import { useState, useMemo } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { Report } from './firebase';
import styles from './maintenance.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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


  // Timeline chart data
  const timelineChartData = {
    labels: timelineData.map(([week]) => week.slice(5)),
    datasets: [
      {
        label: 'Reports',
        data: timelineData.map(([, cnt]) => cnt),
        borderColor: 'var(--color-blue)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'var(--color-blue)',
        pointBorderWidth: 0,
        borderWidth: 2,
      },
    ],
  };

  return (
    <div style={{ paddingRight: '2rem' }}>
      {/* Time filter */}
      <div style={{ marginBottom: '1rem' }}>
        <select className={styles.filterSelect} value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <option value="all">All time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Total incidents, Report status & severity and category distribution row */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        {/* Total incidents box */}
        <div style={{
          background: 'var(--color-bg-primary)',
          border: '0.5px solid var(--color-border)',
          borderRadius: 'var(--border-radius)',
          padding: '1rem',
          width: '200px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--color-blue)' }}>{rTotal}</div>
          <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: 500, marginTop: '0.25rem' }}>Total Incidents</div>
        </div>

        {/* Report Status - Horizontal Bar Chart */}
        <div className={styles.dashSection} style={{ flex: 1 }}>
          <div className={styles.dashSectionTitle}>Report Status</div>
          {rTotal > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ width: '90px', flexShrink: 0, color: 'var(--color-text-secondary)' }}>⏳ Pending</span>
                <div style={{ flex: 1, height: '40px', background: 'var(--color-bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(rPending / rTotal) * 100}%`, height: '100%', background: '#f97316', borderRadius: '4px', transition: 'width 0.3s' }} />
                </div>
                <span style={{ width: '30px', textAlign: 'right', fontWeight: 500, flexShrink: 0 }}>{rPending}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ width: '90px', flexShrink: 0, color: 'var(--color-text-secondary)' }}>🚁 In Progress</span>
                <div style={{ flex: 1, height: '40px', background: 'var(--color-bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(rProgress / rTotal) * 100}%`, height: '100%', background: '#a855f7', borderRadius: '4px', transition: 'width 0.3s' }} />
                </div>
                <span style={{ width: '30px', textAlign: 'right', fontWeight: 500, flexShrink: 0 }}>{rProgress}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ width: '90px', flexShrink: 0, color: 'var(--color-text-secondary)' }}>✅ Resolved</span>
                <div style={{ flex: 1, height: '40px', background: 'var(--color-bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(rResolved / rTotal) * 100}%`, height: '100%', background: '#059669', borderRadius: '4px', transition: 'width 0.3s' }} />
                </div>
                <span style={{ width: '30px', textAlign: 'right', fontWeight: 500, flexShrink: 0 }}>{rResolved}</span>
              </div>
            </div>
          ) : (
            <div className={styles.empty}>No data</div>
          )}
        </div>

        {/* Category Distribution - Pie Chart */}
        <div className={styles.dashSection} style={{ flex: 1 }}>
          <div className={styles.dashSectionTitle}>Category Distribution</div>
          {catCounts.length > 0 ? (
            <div style={{ height: '180px' }}>
              <Pie
                data={{
                  labels: catCounts.map(([cat]) => cat),
                  datasets: [
                    {
                      data: catCounts.map(([, cnt]) => cnt),
                      backgroundColor: catCounts.map(([cat], i) => CAT_COLORS[cat.toLowerCase()] || CHART_COLORS[i % CHART_COLORS.length]),
                      borderWidth: 0,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: 'var(--color-text-secondary)',
                        font: { size: 10 },
                        padding: 8,
                        usePointStyle: true,
                      },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      padding: 8,
                      bodyFont: { size: 11 },
                      cornerRadius: 4,
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className={styles.empty}>No data yet</div>
          )}
        </div>
      </div>

      {/* Summary and Timeline row */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        {/* Summary box */}
        <div className={styles.dashSection} style={{ width: '200px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-sm)', padding: '0.75rem', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>{resolveRate}%</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Resolve Rate</div>
            </div>
            <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-sm)', padding: '0.75rem', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>{rProgress}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>In Progress</div>
            </div>
            <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-sm)', padding: '0.75rem', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>{rTotal > 0 ? (rTotal / getWeekSpan(filtered)).toFixed(1) : '0'}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Reports/Week</div>
            </div>
          </div>
        </div>

        {/* Timeline chart section */}
        <div className={styles.dashSection} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className={styles.dashSectionTitle}>Reports Timeline</div>
          {timelineData.length > 0 ? (
            <div style={{ height: '200px', flex: 1, width: '100%' }}>
              <Line
                data={timelineChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      padding: 8,
                      titleFont: { size: 12 },
                      bodyFont: { size: 12 },
                      cornerRadius: 4,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(229, 231, 235, 0.6)',
                        lineWidth: 0.8,
                      },
                      ticks: {
                        color: 'var(--color-text-secondary)',
                        font: { size: 11 },
                      },
                      border: {
                        display: false,
                      },
                    },
                    x: {
                      grid: {
                        display: false,
                      },
                      ticks: {
                        color: 'var(--color-text-secondary)',
                        font: { size: 11 },
                      },
                      border: {
                        display: false,
                      },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className={styles.empty}>No data yet</div>
          )}
        </div>
      </div>

      {/* Top reporters and hotspots side by side */}
      <div className={styles.dashGrid} style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>

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
    </div>
  );
}

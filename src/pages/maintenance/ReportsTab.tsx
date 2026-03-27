import { useState, useCallback } from 'react';
import type { Report } from './firebase';
import { updateReportStatus } from './firebase';
import RoomMap from './RoomMap';
import DroneDispatch from './DroneDispatch';
import styles from './maintenance.module.css';

const CAT_COLORS: Record<string, string> = {
  trash: '#f97316', waste: '#f97316', fire: '#ef4444', smoke: '#ef4444',
  hazardous: '#ef4444', structural: '#a855f7', flooding: '#3b82f6',
  graffiti: '#6366f1', vandalism: '#6366f1',
};

const SEV_CONFIG: Record<string, { cls: string; label: string }> = {
  high: { cls: styles.sevHigh, label: '🔴 HIGH' },
  medium: { cls: styles.sevMed, label: '🟡 MEDIUM' },
  low: { cls: styles.sevLow, label: '🟢 LOW' },
};

function sevOrder(s: string) {
  return { high: 0, medium: 1, low: 2 }[s] ?? 3;
}

interface Props {
  reports: Report[];
  onStartAnalysis: (file: File, reportId: string) => void;
}

export default function ReportsTab({ reports, onStartAnalysis }: Props) {
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [waypoint, setWaypoint] = useState<{ x: number; y: number } | null>(null);
  const [missionActive, setMissionActive] = useState(false);

  const sorted = [...reports].sort((a, b) => {
    const pd = sevOrder(a.severity) - sevOrder(b.severity);
    if (pd !== 0) return pd;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filtered = sorted.filter(
    (r) =>
      (!priorityFilter || r.severity === priorityFilter) &&
      (!statusFilter || r.status === statusFilter),
  );

  const activeReport = reports.find((r) => r.id === activeReportId);

  const selectReport = useCallback(
    (id: string) => {
      setActiveReportId(id);
      setMissionActive(false);
      const r = reports.find((rep) => rep.id === id);
      if (r) {
        let x = r.roomX ?? null;
        let y = r.roomY ?? null;
        if (x == null && r.lat != null) { x = r.lng || 0; y = r.lat || 0; }
        if (x != null && y != null) setWaypoint({ x, y });
      }
    },
    [reports],
  );

  const handleDispatch = useCallback(async () => {
    if (!activeReportId) return;
    await updateReportStatus(activeReportId, 'in_progress').catch(() => {});
    setMissionActive(true);
  }, [activeReportId]);

  const handleFootageReady = useCallback(
    (file: File) => {
      if (activeReportId) {
        onStartAnalysis(file, activeReportId);
      }
    },
    [activeReportId, onStartAnalysis],
  );

  return (
    <div className={styles.splitLayout}>
      {/* Left: report list */}
      <div>
        <div className={styles.filtersRow}>
          <select className={styles.filterSelect} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div className={styles.reportsList}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>No reports match the filters.</div>
          ) : (
            filtered.map((report) => {
              const catColor = CAT_COLORS[report.category?.toLowerCase()] || '#8890a4';
              const sev = SEV_CONFIG[report.severity?.toLowerCase()] || { cls: styles.sevLow, label: '⚪ UNKNOWN' };
              const date = report.createdAt ? new Date(report.createdAt).toLocaleDateString() : '';
              const loc = report.address || (report.lat ? `${report.lat.toFixed(4)}, ${report.lng?.toFixed(4)}` : 'No location');
              const statusMap: Record<string, string> = {
                pending: '⏳ Pending',
                in_progress: '🚁 In Progress',
                resolved: '✅ Resolved',
              };

              return (
                <div
                  key={report.id}
                  className={`${styles.reportCard} ${report.id === activeReportId ? styles.reportCardActive : ''}`}
                  onClick={() => selectReport(report.id)}
                >
                  <div className={styles.rcTop}>
                    <span
                      className={styles.catBadge}
                      style={{ background: `${catColor}22`, color: catColor, borderColor: `${catColor}44` }}
                    >
                      {report.category || 'unknown'}
                    </span>
                    <span className={`${styles.sevBadge} ${sev.cls}`}>{sev.label}</span>
                  </div>
                  <div className={styles.reportName}>{report.title || 'Untitled Report'}</div>
                  <div className={styles.reportPath}>{loc}</div>
                  <div className={styles.rcFooter}>
                    <span className={`${styles.badge} ${report.status === 'resolved' ? styles.badgeDone : styles.badgeRunning}`}>
                      {statusMap[report.status] || report.status}
                    </span>
                    <span className={styles.reportTime}>{date}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right: detail panel */}
      <div>
        {activeReport ? (
          <div className={styles.detailPanel}>
            <div className={styles.rdBadges}>
              <span
                className={styles.catBadge}
                style={{
                  background: `${CAT_COLORS[activeReport.category?.toLowerCase()] || '#8890a4'}22`,
                  color: CAT_COLORS[activeReport.category?.toLowerCase()] || '#8890a4',
                  borderColor: `${CAT_COLORS[activeReport.category?.toLowerCase()] || '#8890a4'}44`,
                }}
              >
                {activeReport.category || 'unknown'}
              </span>
              <span className={`${styles.sevBadge} ${SEV_CONFIG[activeReport.severity]?.cls || styles.sevLow}`}>
                {SEV_CONFIG[activeReport.severity]?.label || '⚪ UNKNOWN'}
              </span>
            </div>
            <h2 className={styles.rdTitle}>{activeReport.title || 'Untitled Report'}</h2>
            <div className={styles.rdMeta}>
              <span>👤 {activeReport.reportedBy || 'Anonymous'}</span>
              <span>🕐 {activeReport.createdAt ? new Date(activeReport.createdAt).toLocaleString() : 'Unknown'}</span>
              <span>📍 {activeReport.address || 'Unknown location'}</span>
            </div>
            {activeReport.description && (
              <p className={styles.rdDesc}>{activeReport.description}</p>
            )}
            {activeReport.photos?.[0] && (
              <img className={styles.rdPhoto} src={activeReport.photos[0]} alt="Reported" />
            )}

            <RoomMap
              reports={reports}
              activeReportId={activeReportId!}
              waypoint={waypoint}
              onSetWaypoint={setWaypoint}
              onSelectReport={selectReport}
            />

            {!missionActive && (
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={!waypoint}
                onClick={handleDispatch}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                {waypoint
                  ? `🚁 Fly to (${waypoint.x.toFixed(1)}, ${waypoint.y.toFixed(1)})`
                  : '🚁 Select a point on the map to dispatch'}
              </button>
            )}

            {missionActive && <DroneDispatch onFootageReady={handleFootageReady} />}
          </div>
        ) : (
          <div className={styles.empty}>Select a report to view details</div>
        )}
      </div>
    </div>
  );
}

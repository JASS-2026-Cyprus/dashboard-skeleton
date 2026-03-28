import { useState, useCallback } from 'react';
import type { Report } from './firebase';
import { updateReportStatus } from './firebase';
import { goToLocation } from './droneApi';
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

interface Props {
  reports: Report[];
}

export default function ReportsTab({ reports }: Props) {
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [waypoint, setWaypoint] = useState<{ x: number; y: number } | null>(null);
  const [missionActive, setMissionActive] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  const sorted = [...reports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

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
      if (r?.lat != null && r?.lng != null) {
        setWaypoint({ x: r.lng, y: r.lat });
      }
    },
    [reports],
  );

  const handleDispatch = useCallback(async () => {
    if (!activeReportId || !waypoint) return;
    setDispatching(true);
    setDispatchError(null);

    try {
      await goToLocation([waypoint.x, waypoint.y]);
      await updateReportStatus(activeReportId, 'in_progress').catch(() => {});
      setMissionActive(true);
    } catch (e) {
      setDispatchError(e instanceof Error ? e.message : 'Failed to reach drone API');
    } finally {
      setDispatching(false);
    }
  }, [activeReportId, waypoint]);

  const isFiltered = priorityFilter !== '' || statusFilter !== '';

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

        {isFiltered && (
          <div className={styles.filterCount}>
            Showing {filtered.length} of {reports.length} report{reports.length !== 1 ? 's' : ''}
          </div>
        )}

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
              <span className={styles.rdMetaSep}>·</span>
              <span>🕐 {activeReport.createdAt ? new Date(activeReport.createdAt).toLocaleString() : 'Unknown'}</span>
              <span className={styles.rdMetaSep}>·</span>
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
              <>
                <button
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={!waypoint || dispatching}
                  onClick={handleDispatch}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  {dispatching ? 'Dispatching…' : waypoint ? '🚁 Dispatch Drone' : 'Set a waypoint on the map to dispatch'}
                </button>
                {waypoint && !dispatching && (
                  <div className={styles.dispatchCoords}>
                    Target: {waypoint.y.toFixed(5)}, {waypoint.x.toFixed(5)}
                  </div>
                )}
                {dispatchError && (
                  <div style={{ marginTop: '0.5rem', fontSize: 13, color: '#c53030' }}>
                    {dispatchError}
                  </div>
                )}
              </>
            )}

            {missionActive && <DroneDispatch />}
          </div>
        ) : (
          <div className={styles.empty}>Select a report to view details</div>
        )}
      </div>
    </div>
  );
}

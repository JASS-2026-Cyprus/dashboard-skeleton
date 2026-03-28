import { useBlackboardSummary } from '../hooks/useBlackboardSummary';
import styles from './SystemSummary.module.css';

const SEVERITY_CONFIG = {
  ok: { icon: '\ud83d\udfe2', label: 'Operational', cls: styles.sevOk },
  warning: { icon: '\ud83d\udfe1', label: 'Warning', cls: styles.sevWarn },
  critical: { icon: '\ud83d\udd34', label: 'Critical', cls: styles.sevCrit },
} as const;

const TREND_CONFIG = {
  stable: { icon: '\u2192', label: 'Stable', cls: styles.trendStable },
  improving: { icon: '\u2197', label: 'Improving', cls: styles.trendImproving },
  escalating: { icon: '\u2198', label: 'Escalating', cls: styles.trendEscalating },
} as const;

export default function SystemSummary() {
  const { summary, loading } = useBlackboardSummary();

  const sev = summary?.severity ? SEVERITY_CONFIG[summary.severity] : null;
  const trend = summary?.trend ? TREND_CONFIG[summary.trend] : null;
  // undefined = field not yet in data; [] = backend explicitly says no alerts
  const alerts = summary?.active_alerts;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Executive Briefing</h2>
        <div className={styles.headerMeta}>
          {sev && (
            <span className={`${styles.badge} ${sev.cls}`}>
              {loading ? 'Updating…' : `${sev.icon} ${sev.label}`}
            </span>
          )}
          {loading && !sev && (
            <span className={styles.badge}>Updating…</span>
          )}
        </div>
      </div>
      <div className={styles.grid}>
        {/* Card 1: City Status */}
        <div className={styles.summaryCard}>
          <h3 className={styles.summaryLabel}>City Status</h3>
          {loading ? (
            <div className={styles.skeleton} />
          ) : (
            <>
              <div className={styles.statusLine}>
                {sev && <span className={styles.statusIcon}>{sev.icon}</span>}
                <span className={styles.summaryValue}>
                  {summary?.status ?? '—'}
                </span>
              </div>
              {trend && (
                <div className={`${styles.trendBadge} ${trend.cls}`}>
                  {trend.icon} {trend.label}
                </div>
              )}
            </>
          )}
        </div>

        {/* Card 2: Recommended Action */}
        <div className={styles.summaryCard}>
          <h3 className={styles.summaryLabel}>Recommended Action</h3>
          {loading ? (
            <div className={styles.skeleton} />
          ) : (
            <p className={styles.summaryValue}>
              {summary?.recommended_action ?? '—'}
            </p>
          )}
        </div>

        {/* Card 3: Active Alerts */}
        <div className={styles.summaryCard}>
          <h3 className={styles.summaryLabel}>
            Active Alerts
            {!loading && alerts && alerts.length > 0 && (
              <span className={styles.alertCount}>{alerts.length}</span>
            )}
          </h3>
          {loading ? (
            <div className={styles.skeleton} />
          ) : alerts === undefined ? (
            <p className={styles.noAlerts}>—</p>
          ) : alerts.length === 0 ? (
            <p className={styles.noAlerts}>No active alerts</p>
          ) : (
            <div className={styles.alertList}>
              {alerts.map((a, i) => (
                <div key={i} className={styles.alertItem}>
                  <div className={styles.alertTop}>
                    <span className={styles.alertTeam}>{a.team}</span>
                    <span className={styles.alertIssue}>{a.issue}</span>
                  </div>
                  {a.rationale && (
                    <div className={styles.alertRationale}>{a.rationale}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

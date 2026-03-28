import { useBlackboardSummary } from '../hooks/useBlackboardSummary';
import { useExecutiveBriefing } from '../hooks/useExecutiveBriefing';
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

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 10) return '<10s ago';
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

export default function SystemSummary() {
  const { summary, loading } = useBlackboardSummary();
  const { briefing, briefingLoading } = useExecutiveBriefing(summary, loading);

  const isLoading = loading || briefingLoading;
  const sev = briefing ? SEVERITY_CONFIG[briefing.severity] : SEVERITY_CONFIG.ok;
  const trend = briefing ? TREND_CONFIG[briefing.trend] : TREND_CONFIG.stable;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Executive Briefing</h2>
        <div className={styles.headerMeta}>
          {briefing && !isLoading && (
            <span className={styles.metaText}>
              {briefing.entry_count} sources &middot; {timeAgo(briefing.updated_at)}
            </span>
          )}
          <span className={`${styles.badge} ${briefing ? sev.cls : ''}`}>
            {isLoading ? 'Updating\u2026' : `${sev.icon} ${sev.label}`}
          </span>
        </div>
      </div>
      <div className={styles.grid}>
        {/* Card 1: City Status */}
        <div className={styles.summaryCard}>
          <h3 className={styles.summaryLabel}>City Status</h3>
          {isLoading ? (
            <div className={styles.skeleton} />
          ) : (
            <>
              <div className={styles.statusLine}>
                <span className={styles.statusIcon}>{sev.icon}</span>
                <span className={styles.summaryValue}>{briefing?.status}</span>
              </div>
              <div className={`${styles.trendBadge} ${trend.cls}`}>
                {trend.icon} {trend.label}
              </div>
            </>
          )}
        </div>

        {/* Card 2: Recommended Action */}
        <div className={styles.summaryCard}>
          <h3 className={styles.summaryLabel}>Recommended Action</h3>
          {isLoading ? (
            <div className={styles.skeleton} />
          ) : (
            <p className={styles.summaryValue}>{briefing?.recommended_action}</p>
          )}
        </div>

        {/* Card 3: Active Alerts */}
        <div className={styles.summaryCard}>
          <h3 className={styles.summaryLabel}>
            Active Alerts
            {briefing && !isLoading && briefing.active_alerts.length > 0 && (
              <span className={styles.alertCount}>{briefing.active_alerts.length}</span>
            )}
          </h3>
          {isLoading ? (
            <div className={styles.skeleton} />
          ) : briefing?.active_alerts.length === 0 ? (
            <p className={styles.noAlerts}>No active alerts</p>
          ) : (
            <div className={styles.alertList}>
              {briefing?.active_alerts.map((a, i) => (
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

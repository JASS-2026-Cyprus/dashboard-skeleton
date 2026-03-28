import { useEffect, useState, useCallback } from 'react';
import styles from './maintenance.module.css';

interface LogEntry {
  timestamp: string;
  message: string;
}

const LOG_RE = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] MaintenanceAgent: ([\s\S]+)$/;

function parseMaintenanceLogs(raw: string[]): LogEntry[] {
  return raw
    .map((entry) => {
      const m = entry.match(LOG_RE);
      if (!m) return null;
      return { timestamp: m[1], message: m[2].trim() };
    })
    .filter((e): e is LogEntry => e !== null)
    .slice(-3);
}

export default function AgentLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchLogs = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch('/proxy/blackboard/api/log');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: string[] = await res.json();
      setLogs(parseMaintenanceLogs(data));
      setLastFetched(new Date());
      setError(null);
    } catch {
      setError('Failed to fetch agent logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const id = setInterval(() => fetchLogs(), 30_000);
    return () => clearInterval(id);
  }, [fetchLogs]);

  return (
    <div className={styles.card}>
      <div className={styles.streamCardHeader}>
        <div className={styles.streamCardTitle}>
          <span className={styles.streamDroneIcon}>🤖</span>
          <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>MaintenanceAgent Logs</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {lastFetched && (
            <span className={styles.logsRefreshTime}>
              {lastFetched.toLocaleTimeString()}
            </span>
          )}
          <button
            className={`${styles.btn} ${styles.refreshBtn}`}
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            title="Refresh logs"
          >
            <span className={refreshing ? styles.refreshSpinning : ''}>↻</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className={styles.logsLoading}>
          <span className={styles.spinner} />
          <span>Fetching logs…</span>
        </div>
      )}
      {error && <div className={styles.logsError}>{error}</div>}
      {!loading && !error && logs.length === 0 && (
        <div className={styles.empty}>No MaintenanceAgent logs found</div>
      )}

      {logs.map((log, i) => (
        <div key={i} className={styles.logEntry}>
          <div className={styles.logEntryHeader}>
            <span className={styles.logAgentBadge}>MaintenanceAgent</span>
            <span className={styles.logTime}>{log.timestamp}</span>
          </div>
          <div className={styles.logMessage}>{log.message}</div>
        </div>
      ))}
    </div>
  );
}

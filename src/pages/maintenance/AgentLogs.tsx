import { useEffect, useState, useCallback, useRef } from 'react';
import styles from './maintenance.module.css';

interface LogEntry {
  timestamp: string;
  message: string;
}

type SwarmStatus = 'loading' | 'polling' | 'fresh' | 'waiting';

const POLL_INTERVAL = 30_000;
const FRESH_DURATION = 4_000;

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

function logsKey(logs: LogEntry[]): string {
  return logs.map((l) => l.timestamp + l.message).join('|');
}

export default function AgentLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swarmStatus, setSwarmStatus] = useState<SwarmStatus>('loading');
  const [countdown, setCountdown] = useState(POLL_INTERVAL / 1000);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const prevKeyRef = useRef<string>('');
  const nextPollRef = useRef<number>(Date.now() + POLL_INTERVAL);
  const freshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLogs = useCallback(async (manual = false) => {
    if (!manual) setSwarmStatus('polling');
    try {
      const res = await fetch('/proxy/blackboard/api/log');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: string[] = await res.json();
      const parsed = parseMaintenanceLogs(data);
      const key = logsKey(parsed);
      const changed = key !== prevKeyRef.current;
      prevKeyRef.current = key;
      setLogs(parsed);
      setLastFetched(new Date());
      setError(null);

      if (changed && parsed.length > 0) {
        setSwarmStatus('fresh');
        if (freshTimerRef.current) clearTimeout(freshTimerRef.current);
        freshTimerRef.current = setTimeout(() => setSwarmStatus('waiting'), FRESH_DURATION);
      } else {
        setSwarmStatus('waiting');
      }

      nextPollRef.current = Date.now() + POLL_INTERVAL;
      setCountdown(POLL_INTERVAL / 1000);
    } catch {
      setError('Failed to fetch agent logs');
      setSwarmStatus('waiting');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-poll
  useEffect(() => {
    fetchLogs();
    const id = setInterval(() => fetchLogs(), POLL_INTERVAL);
    return () => {
      clearInterval(id);
      if (freshTimerRef.current) clearTimeout(freshTimerRef.current);
    };
  }, [fetchLogs]);

  // Countdown ticker
  useEffect(() => {
    const id = setInterval(() => {
      const secs = Math.max(0, Math.round((nextPollRef.current - Date.now()) / 1000));
      setCountdown(secs);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.card}>
      <div className={styles.streamCardHeader}>
        <div className={styles.streamCardTitle}>
          <span className={styles.streamDroneIcon}>🤖</span>
          <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>MaintenanceAgent Logs</h2>
        </div>
        <button
          className={`${styles.btn} ${styles.refreshBtn}`}
          onClick={() => fetchLogs(true)}
          disabled={swarmStatus === 'polling'}
          title="Refresh logs"
        >
          <span className={swarmStatus === 'polling' ? styles.refreshSpinning : ''}>↻</span>
        </button>
      </div>

      {/* Swarm status bar */}
      {!loading && (
        <div className={styles.swarmStatusBar} data-status={swarmStatus}>
          {swarmStatus === 'polling' && (
            <>
              <span className={styles.swarmSpinner} />
              <span className={styles.swarmText}>Checking for updates…</span>
            </>
          )}
          {swarmStatus === 'waiting' && (
            <>
              <span className={styles.swarmSpinner} />
              <span className={styles.swarmText}>
                Waiting for maintenance agent's turn in swarm
              </span>
              <span className={styles.swarmCountdown}>{countdown}s</span>
            </>
          )}
          {swarmStatus === 'fresh' && (
            <>
              <span className={styles.swarmDot} />
              <span className={styles.swarmText}>
                Agent active · logs updated
                {lastFetched ? ` at ${lastFetched.toLocaleTimeString()}` : ''}
              </span>
            </>
          )}
        </div>
      )}

      {loading && (
        <div className={styles.logsLoading}>
          <span className={styles.spinner} />
          <span>Connecting to swarm…</span>
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

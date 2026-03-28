import { useEffect, useState, useCallback, useRef } from 'react';
const LOG_RE = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] MaintenanceAgent: ([\s\S]+)$/;
const POLL_INTERVAL = 30_000;
const FRESH_DURATION = 4_000;

type Status = 'loading' | 'polling' | 'fresh' | 'waiting' | 'error';

export default function AgentStatusMini() {
  const [status, setStatus] = useState<Status>('loading');
  const [latestMsg, setLatestMsg] = useState<string | null>(null);
  const [latestTs, setLatestTs] = useState<string | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const prevKeyRef = useRef('');
  const freshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/proxy/blackboard/api/log');
      if (!res.ok) throw new Error();
      const data: string[] = await res.json();

      const entries = data
        .map((e) => {
          const m = e.match(LOG_RE);
          return m ? { timestamp: m[1], message: m[2].trim() } : null;
        })
        .filter((e): e is { timestamp: string; message: string } => e !== null);

      const latest = entries[entries.length - 1];
      const key = latest ? latest.timestamp + latest.message : '';
      const changed = key !== prevKeyRef.current;
      prevKeyRef.current = key;

      setTurnCount(entries.length);
      setLatestMsg(latest?.message ?? null);
      setLatestTs(latest?.timestamp ?? null);

      if (changed && entries.length > 0) {
        setStatus('fresh');
        if (freshTimerRef.current) clearTimeout(freshTimerRef.current);
        freshTimerRef.current = setTimeout(() => setStatus('waiting'), FRESH_DURATION);
      } else {
        setStatus('waiting');
      }
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const id = setInterval(fetchLogs, POLL_INTERVAL);
    return () => {
      clearInterval(id);
      if (freshTimerRef.current) clearTimeout(freshTimerRef.current);
    };
  }, [fetchLogs]);

  const isFresh = status === 'fresh';
  const isError = status === 'error';
  const isLoading = status === 'loading';

  const dotColor = isError ? '#ef4444' : isFresh ? '#22c55e' : '#94a3b8';
  const statusLabel = isLoading
    ? 'Connecting…'
    : isError
      ? 'Unreachable'
      : isFresh
        ? 'Active'
        : 'Waiting in swarm';

  // Format timestamp: "2024-01-15 14:32:00" → "14:32"
  const shortTs = latestTs ? latestTs.slice(11, 16) : null;

  return (
    <div style={{
      border: '0.5px solid var(--color-border)',
      borderRadius: 'var(--border-radius)',
      padding: '0.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: dotColor,
          flexShrink: 0,
          boxShadow: isFresh ? `0 0 0 3px ${dotColor}33` : 'none',
          transition: 'background 0.4s, box-shadow 0.4s',
        }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', flex: 1 }}>
          MaintenanceAgent
        </span>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 7px',
          borderRadius: 999,
          background: isError
            ? 'rgba(239,68,68,0.1)'
            : isFresh
              ? 'rgba(34,197,94,0.1)'
              : 'var(--color-bg-secondary)',
          color: isError ? '#ef4444' : isFresh ? '#16a34a' : 'var(--color-text-secondary)',
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
        }}>
          {statusLabel}
        </span>
      </div>

      {/* Latest message */}
      <div style={{
        fontSize: 12,
        color: 'var(--color-text-secondary)',
        lineHeight: 1.45,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        minHeight: '1.5em',
      }}>
        {isLoading
          ? 'Fetching logs…'
          : isError
            ? 'Could not reach agent blackboard.'
            : latestMsg ?? 'No activity recorded yet.'}
      </div>

      {/* Footer row */}
      {!isLoading && !isError && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: 11,
            color: 'var(--color-text-secondary)',
            fontFamily: "'SF Mono', monospace",
          }}>
            {turnCount} turn{turnCount !== 1 ? 's' : ''}
          </span>
          {shortTs && (
            <span style={{
              fontSize: 11,
              color: 'var(--color-text-secondary)',
              fontFamily: "'SF Mono', monospace",
            }}>
              last @ {shortTs}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

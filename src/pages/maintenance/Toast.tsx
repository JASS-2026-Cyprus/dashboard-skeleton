import { useEffect, useState, useCallback } from 'react';
import type { Report } from './firebase';
import styles from './maintenance.module.css';

interface Props {
  reports: Report[];
  onClickReport: (id: string) => void;
}

export default function Toast({ reports, onClickReport }: Props) {
  const [pending, setPending] = useState<Report[]>([]);
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      setKnownIds(new Set(reports.map((r) => r.id)));
      setInitialized(true);
      return;
    }

    const newReports = reports.filter((r) => !knownIds.has(r.id));
    if (newReports.length > 0) {
      setKnownIds((prev) => {
        const next = new Set(prev);
        newReports.forEach((r) => next.add(r.id));
        return next;
      });
      setPending((prev) => [...prev, ...newReports]);
    }
  }, [reports, knownIds, initialized]);

  // Auto-dismiss after 6s
  useEffect(() => {
    if (pending.length === 0) return;
    const timer = setTimeout(() => {
      setPending((prev) => prev.slice(1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [pending]);

  const dismiss = useCallback((id: string) => {
    setPending((prev) => prev.filter((r) => r.id !== id));
  }, []);

  if (pending.length === 0) return null;

  return (
    <div className={styles.notifBar}>
      {pending.slice(0, 2).map((r) => (
        <div
          key={r.id}
          className={styles.notifItem}
          onClick={() => {
            onClickReport(r.id);
            dismiss(r.id);
          }}
        >
          <span className={styles.notifDot} />
          <span className={styles.notifText}>
            New: <strong>{r.title || 'Untitled'}</strong>
            {r.category ? ` — ${r.category}` : ''}
          </span>
          <button
            className={styles.notifClose}
            onClick={(e) => {
              e.stopPropagation();
              dismiss(r.id);
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

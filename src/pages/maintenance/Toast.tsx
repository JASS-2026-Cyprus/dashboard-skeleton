import { useEffect, useState, useCallback } from 'react';
import type { Report } from './firebase';
import styles from './maintenance.module.css';

const VISIBLE_MS = 5000;   // how long the toast stays fully visible
const FADE_MS    = 400;    // must match CSS fadeOut duration

interface ToastItem {
  report: Report;
  dismissing: boolean;
}

interface Props {
  reports: Report[];
  onClickReport: (id: string) => void;
}

export default function Toast({ reports, onClickReport }: Props) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  // Seed known IDs on first load so existing reports don't toast
  useEffect(() => {
    if (!initialized) {
      setKnownIds(new Set(reports.map((r) => r.id)));
      setInitialized(true);
    }
  }, [reports, initialized]);

  // Enqueue genuinely new reports
  useEffect(() => {
    if (!initialized) return;
    const newReports = reports.filter((r) => !knownIds.has(r.id));
    if (newReports.length === 0) return;

    setKnownIds((prev) => {
      const next = new Set(prev);
      newReports.forEach((r) => next.add(r.id));
      return next;
    });
    setItems((prev) => [
      ...prev,
      ...newReports.map((r) => ({ report: r, dismissing: false })),
    ]);
  }, [reports, knownIds, initialized]);

  // Per-item auto-dismiss: mark dismissing after VISIBLE_MS, remove after fade
  useEffect(() => {
    const nonDismissing = items.filter((t) => !t.dismissing);
    if (nonDismissing.length === 0) return;

    const timers = nonDismissing.map((t) => {
      const fadeTimer = setTimeout(() => {
        setItems((prev) =>
          prev.map((x) =>
            x.report.id === t.report.id ? { ...x, dismissing: true } : x,
          ),
        );
        setTimeout(() => {
          setItems((prev) => prev.filter((x) => x.report.id !== t.report.id));
        }, FADE_MS);
      }, VISIBLE_MS);
      return fadeTimer;
    });

    return () => timers.forEach(clearTimeout);
  }, [items]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((x) => (x.report.id === id ? { ...x, dismissing: true } : x)),
    );
    setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.report.id !== id));
    }, FADE_MS);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className={styles.notifBar}>
      {items.slice(0, 3).map((t) => (
        <div
          key={t.report.id}
          className={`${styles.notifItem} ${t.dismissing ? styles.notifItemDismissing : ''}`}
          onClick={() => {
            onClickReport(t.report.id);
            dismiss(t.report.id);
          }}
        >
          <span className={styles.notifDot} />
          <span className={styles.notifText}>
            New: <strong>{t.report.title || 'Untitled'}</strong>
            {t.report.category ? ` — ${t.report.category}` : ''}
          </span>
          <button
            className={styles.notifClose}
            onClick={(e) => {
              e.stopPropagation();
              dismiss(t.report.id);
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

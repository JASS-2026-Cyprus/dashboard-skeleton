import type { VlmResults } from './vlm';
import styles from './maintenance.module.css';

const TASK_META: Record<string, { label: string; icon: string }> = {
  waste_detection_v1: { label: 'Waste Detection', icon: '🗑' },
  fire_smoke_v1: { label: 'Fire & Smoke', icon: '🔥' },
  structural_crack_v1: { label: 'Structural Damage', icon: '🏚' },
};

interface Props {
  vlm: VlmResults;
}

export default function TaskCards({ vlm }: Props) {
  return (
    <div className={styles.taskGrid}>
      {Object.entries(vlm).map(([tid, summary]) => {
        if (!summary || typeof summary !== 'object') return null;
        const meta = TASK_META[tid] || { label: tid, icon: '' };
        const detected = summary.any_positive;

        return (
          <div
            key={tid}
            className={`${styles.taskCard} ${detected ? styles.taskCardDetected : styles.taskCardClear}`}
          >
            <div className={styles.taskHeader}>
              <span className={styles.taskName}>
                {meta.icon} {meta.label}
              </span>
              <span className={`${styles.badge} ${detected ? styles.badgeDet : styles.badgeOk}`}>
                {detected ? 'DETECTED' : 'CLEAR'}
              </span>
            </div>
            <div className={styles.taskStats}>
              <span>Windows: {summary.positive_windows}/{summary.total_windows}</span>
              <span>
                Confidence: {summary.confidence_mean != null ? summary.confidence_mean.toFixed(2) : '—'}
              </span>
            </div>
            {summary.findings.length > 0 && (
              <ul className={styles.findings}>
                {summary.findings.slice(0, 3).map((f: { timestamps: number[]; answer: string; confidence: number }, i: number) => {
                  const ts = f.timestamps
                    .slice(0, 2)
                    .map((t: number) => (t / 1000).toFixed(1) + 's')
                    .join(', ');
                  return (
                    <li key={i}>
                      <span className={styles.fts}>{ts}</span>
                      {f.answer.slice(0, 130)}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

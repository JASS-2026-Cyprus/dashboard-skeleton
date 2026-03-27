import type { VlmResults } from './vlm';
import styles from './maintenance.module.css';

interface Props {
  vlm: VlmResults | null;
  running?: boolean;
}

export default function RiskBanner({ vlm, running }: Props) {
  let key = 'pending';
  let icon = '⏳';
  let label = 'Analysing…';
  let detail = 'Results will appear as each task finishes';

  if (vlm) {
    const positive = Object.entries(vlm).filter(([, s]) => s?.any_positive);
    const hasFire = positive.some(([k]) => k === 'fire_smoke_v1');

    if (hasFire) {
      key = 'danger';
      icon = '🚨';
      label = 'DANGER';
      detail = 'Fire or smoke detected — immediate action required';
    } else if (positive.length) {
      key = 'alert';
      icon = '⚠️';
      label = 'ALERT';
      detail = 'Issues detected — inspection recommended';
    } else {
      key = 'clear';
      icon = '✅';
      label = 'ALL CLEAR';
      detail = 'No critical issues detected';
    }
  }

  if (running && !vlm) {
    key = 'pending';
    icon = '⏳';
    label = 'Analysing…';
    detail = 'VLM pipeline running — please wait';
  }

  const riskClass =
    key === 'danger'
      ? styles.riskDanger
      : key === 'alert'
        ? styles.riskAlert
        : key === 'clear'
          ? styles.riskClear
          : styles.riskPending;

  return (
    <div className={`${styles.riskBanner} ${riskClass}`}>
      <span className={styles.riskIcon}>{icon}</span>
      <div>
        <div className={styles.riskLabel}>{label}</div>
        <div className={styles.riskDetail}>{detail}</div>
      </div>
    </div>
  );
}

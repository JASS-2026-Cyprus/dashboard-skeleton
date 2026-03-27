import type { SystemSummaryProps } from '../types';
import styles from './SystemSummary.module.css';

export default function SystemSummary({ action, urgency, state }: SystemSummaryProps) {
  const cards = [
    { label: 'Recommended action', value: action },
    { label: 'Urgency', value: urgency },
    { label: 'State', value: state },
  ];

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>System summary</h2>
        <span className={styles.badge}>All nominal</span>
      </div>
      <div className={styles.grid}>
        {cards.map((card) => (
          <div key={card.label} className={styles.summaryCard}>
            <h3 className={styles.summaryLabel}>{card.label}</h3>
            <p className={styles.summaryValue}>{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

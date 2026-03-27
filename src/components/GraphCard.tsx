import type { ReactNode } from 'react';
import styles from './GraphCard.module.css';

interface GraphCardProps {
  label: string;
  currentValue: string;
  children: ReactNode;
}

export default function GraphCard({ label, currentValue, children }: GraphCardProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{currentValue}</span>
      </div>
      {children}
    </div>
  );
}

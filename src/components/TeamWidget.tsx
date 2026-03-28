import React from 'react';
import { Link } from 'react-router-dom';
import type { TeamWidgetProps } from '../types';
import styles from './TeamWidget.module.css';

const SIZE_STYLE: Record<string, React.CSSProperties> = {
  wide:  { gridColumn: 'span 2' },
  tall:  { gridRow: 'span 2' },
  large: { gridColumn: 'span 2', gridRow: 'span 2' },
};

export default function TeamWidget({
  title,
  statusColor,
  description,
  stats,
  graph,
  detailsLink,
  size,
  children,
}: TeamWidgetProps & { children?: React.ReactNode }) {
  return (
    <div className={styles.widget} style={size ? SIZE_STYLE[size] : undefined}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div
            className={`${styles.dot} ${statusColor === 'blue' ? styles.dotBlue : styles.dotGreen}`}
          />
          <h3 className={styles.title}>{title}</h3>
        </div>
        {detailsLink && (
          <Link to={detailsLink} className={styles.detailsBtn}>
            Details &#8599;
          </Link>
        )}
      </div>
      {description && <p className={styles.description}>{description}</p>}
      {graph}
      <div className={styles.stats}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.statRow}>
            <span className={styles.statLabel}>{stat.label}</span>
            <span className={`${styles.statValue} ${stat.success ? styles.statSuccess : ''}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>
      {children && <div className={styles.extra}>{children}</div>}
    </div>
  );
}

import { useBlackboardSummary } from '../hooks/useBlackboardSummary';
import styles from './SystemSummary.module.css';

export default function SystemSummary() {
  const { summary, loading } = useBlackboardSummary();

  const cards = [
    {
      label: 'Overview',
      content: loading
        ? 'Loading…'
        : summary?.overview ?? 'No summary available.',
      type: 'text' as const,
    },
    {
      label: 'Keywords',
      content: summary?.keywords ?? [],
      type: 'tags' as const,
    },
    {
      label: 'Key Concepts',
      content: summary?.key_concepts ?? [],
      type: 'list' as const,
    },
  ];

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>System summary</h2>
        <span className={styles.badge}>
          {summary ? `${summary.entry_count} entries` : 'Live'}
        </span>
      </div>
      <div className={styles.grid}>
        {cards.map((card) => (
          <div key={card.label} className={styles.summaryCard}>
            <h3 className={styles.summaryLabel}>{card.label}</h3>
            {card.type === 'text' && (
              <p className={styles.summaryValue}>{card.content as string}</p>
            )}
            {card.type === 'tags' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {(card.content as string[]).length === 0 && !loading && (
                  <span className={styles.summaryValue}>—</span>
                )}
                {(card.content as string[]).map((kw) => (
                  <span
                    key={kw}
                    style={{
                      fontSize: 12,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'var(--color-blue-bg, #e8f0fe)',
                      color: 'var(--color-blue-text, #1a56db)',
                      fontWeight: 500,
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
            {card.type === 'list' && (
              <ul style={{ margin: 0, paddingLeft: 16, marginTop: 4 }}>
                {(card.content as string[]).length === 0 && !loading && (
                  <span className={styles.summaryValue}>—</span>
                )}
                {(card.content as string[]).map((concept) => (
                  <li
                    key={concept}
                    style={{
                      fontSize: 13,
                      color: 'var(--color-text-primary)',
                      lineHeight: 1.6,
                    }}
                  >
                    {concept}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

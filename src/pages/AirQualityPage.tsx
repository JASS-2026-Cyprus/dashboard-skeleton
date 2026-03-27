import styles from './pages.module.css';

export default function AirQualityPage() {
  return (
    <>
      <h1 className={styles.pageHeader}>Air Quality</h1>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Deployment Pipeline</h2>
        <div className={styles.statusIndicator}>
          <span className={styles.statusDot} />
          Ready
        </div>
        <p className={styles.sectionText}>
          CI/CD pipeline configured. Build and deployment automation for all team services.
        </p>
        <div className={styles.configRow}>
          <span className={styles.configLabel}>Pipeline status</span>
          <span className={styles.configValue}>Green</span>
        </div>
        <div className={styles.configRow}>
          <span className={styles.configLabel}>Last deploy</span>
          <span className={styles.configValue}>10 min ago</span>
        </div>
        <div className={styles.configRow}>
          <span className={styles.configLabel}>Uptime</span>
          <span className={styles.configValue}>99.9%</span>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Infrastructure Health</h2>
        <p className={styles.sectionText}>
          Monitoring infrastructure services, container health, and resource allocation.
        </p>
        <div className={styles.configRow}>
          <span className={styles.configLabel}>Containers</span>
          <span className={styles.configValue}>4 / 4 running</span>
        </div>
        <div className={styles.configRow}>
          <span className={styles.configLabel}>CPU usage</span>
          <span className={styles.configValue}>23%</span>
        </div>
        <div className={styles.configRow}>
          <span className={styles.configLabel}>Memory</span>
          <span className={styles.configValue}>1.2 GB / 4 GB</span>
        </div>
        <div className={styles.configRow}>
          <span className={styles.configLabel}>Disk</span>
          <span className={styles.configValue}>8.4 GB / 20 GB</span>
        </div>
      </div>
    </>
  );
}

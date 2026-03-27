import BarGraph from '../components/BarGraph';
import styles from './pages.module.css';

const seismicHistory = [0.1, 0.2, 0.08, 0.3, 0.12, 0.15, 0.08, 0.25, 0.12, 0.18, 0.09, 0.22, 0.14, 0.11];

export default function EarthquakePage() {
  return (
    <>
      <h1 className={styles.pageHeader}>Earthquake Monitoring</h1>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Seismic Activity (14d)</h2>
        <BarGraph data={seismicHistory} label="Peak magnitude" currentValue="0.3 M" />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Sensor Network</h2>
        <div className={styles.statusIndicator}>
          <span className={styles.statusDot} />
          8 / 8 online
        </div>
        <div className={styles.placeholder}>Sensor map visualization</div>
        <div className={styles.configRow}>
          <span className={styles.configLabel}>Coverage area</span>
          <span className={styles.configValue}>12 km radius</span>
        </div>
        <div className={styles.configRow}>
          <span className={styles.configLabel}>Sampling rate</span>
          <span className={styles.configValue}>100 Hz</span>
        </div>
        <div className={styles.configRow}>
          <span className={styles.configLabel}>Last calibration</span>
          <span className={styles.configValue}>2 days ago</span>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Alert Configuration</h2>
        <div className={styles.configRow}>
          <span className={styles.configLabel}>Alert threshold</span>
          <span className={styles.configValue}>2.0 M</span>
        </div>
        <div className={styles.configRow}>
          <span className={styles.configLabel}>Warning threshold</span>
          <span className={styles.configValue}>1.0 M</span>
        </div>
        <div className={styles.configRow}>
          <span className={styles.configLabel}>Notification channels</span>
          <span className={styles.configValue}>SMS, Dashboard</span>
        </div>
        <div className={styles.configRow}>
          <span className={styles.configLabel}>Predictive model</span>
          <span className={styles.configValue}>Active</span>
        </div>
      </div>
    </>
  );
}

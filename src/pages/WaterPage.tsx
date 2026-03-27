import LineGraph from '../components/LineGraph';
import styles from './pages.module.css';

const sensors = [
  { name: 'Station North', ph: '7.1', turbidity: '2.3 NTU' },
  { name: 'Station South', ph: '7.3', turbidity: '1.8 NTU' },
  { name: 'Reservoir A', ph: '7.0', turbidity: '2.1 NTU' },
  { name: 'Reservoir B', ph: '7.4', turbidity: '1.5 NTU' },
  { name: 'Plant Intake', ph: '6.9', turbidity: '3.2 NTU' },
  { name: 'Plant Output', ph: '7.2', turbidity: '0.8 NTU' },
  { name: 'Distribution W', ph: '7.1', turbidity: '1.1 NTU' },
  { name: 'Distribution E', ph: '7.3', turbidity: '1.4 NTU' },
  { name: 'Tower Central', ph: '7.2', turbidity: '1.6 NTU' },
  { name: 'Tower Hill', ph: '7.0', turbidity: '2.0 NTU' },
  { name: 'Pump Stn 1', ph: '7.1', turbidity: '1.9 NTU' },
  { name: 'Pump Stn 2', ph: '7.2', turbidity: '1.7 NTU' },
];

const phHistory = [7.0, 7.1, 7.0, 7.2, 7.3, 7.4, 7.3, 7.2, 7.1, 7.2, 7.3, 7.2, 7.1, 7.0, 7.1, 7.2];

export default function WaterPage() {
  return (
    <>
      <h1 className={styles.pageHeader}>Water Quality</h1>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>pH Trend (48h)</h2>
        <LineGraph data={phHistory} label="Average pH" currentValue="7.2" />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Sensor Grid</h2>
        <div className={styles.statusIndicator}>
          <span className={styles.statusDot} />
          12 / 12 online
        </div>
        <div className={styles.sensorGrid}>
          {sensors.map((s) => (
            <div key={s.name} className={styles.sensorCard}>
              <div className={styles.sensorName}>{s.name}</div>
              <div className={styles.sensorValue}>pH {s.ph}</div>
              <div className={styles.sensorName}>{s.turbidity}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Quality Dashboard</h2>
        <div className={styles.configRow}>
          <span className={styles.configLabel}>Average pH</span>
          <span className={styles.configValue}>7.15</span>
        </div>
        <div className={styles.configRow}>
          <span className={styles.configLabel}>Average turbidity</span>
          <span className={styles.configValue}>1.78 NTU</span>
        </div>
        <div className={styles.configRow}>
          <span className={styles.configLabel}>Chlorine residual</span>
          <span className={styles.configValue}>0.5 mg/L</span>
        </div>
        <div className={styles.configRow}>
          <span className={styles.configLabel}>Temperature</span>
          <span className={styles.configValue}>14.2 °C</span>
        </div>
      </div>
    </>
  );
}

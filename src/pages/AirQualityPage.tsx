import { useState } from 'react';
import MultiLineGraph from '../components/MultiLineGraph';
import styles from './pages.module.css';

// ── Status helpers ────────────────────────────────────────────────────────────

function getPm25Status(v: number) {
  if (v <= 12) return { color: '#639922', level: 'Good' };
  if (v <= 25) return { color: '#b8860b', level: 'Moderate' };
  if (v <= 55) return { color: '#d97706', level: 'Elevated' };
  return { color: '#dc2626', level: 'High' };
}

function getPm10Status(v: number) {
  if (v <= 20) return { color: '#639922', level: 'Good' };
  if (v <= 45) return { color: '#b8860b', level: 'Moderate' };
  if (v <= 90) return { color: '#d97706', level: 'Elevated' };
  return { color: '#dc2626', level: 'High' };
}

function getNo2Status(v: number) {
  if (v <= 25) return { color: '#639922', level: 'Good' };
  if (v <= 50) return { color: '#b8860b', level: 'Moderate' };
  if (v <= 100) return { color: '#d97706', level: 'Elevated' };
  return { color: '#dc2626', level: 'High' };
}

function getCo2Status(v: number) {
  if (v <= 450) return { color: '#639922', level: 'Normal' };
  if (v <= 600) return { color: '#b8860b', level: 'Elevated' };
  if (v <= 1000) return { color: '#d97706', level: 'High' };
  return { color: '#dc2626', level: 'Very High' };
}

function getCoStatus(v: number) {
  if (v <= 1.0) return { color: '#639922', level: 'Good' };
  if (v <= 2.0) return { color: '#b8860b', level: 'Moderate' };
  if (v <= 4.0) return { color: '#d97706', level: 'Elevated' };
  return { color: '#dc2626', level: 'High' };
}

// ── Mock data ─────────────────────────────────────────────────────────────────

// 24-hour hourly readings, Paphos, Cyprus
const pm25History = [
  9.2, 8.8, 8.1, 7.9, 8.3, 9.5, 13.4, 18.2,
  21.3, 19.7, 17.4, 15.1, 14.8, 15.3, 16.7, 22.4,
  24.1, 21.8, 18.9, 16.4, 14.2, 12.8, 11.5, 10.3,
];

const no2History = [
  19.1, 18.4, 17.8, 17.2, 18.0, 20.5, 27.3, 35.6,
  38.4, 35.1, 30.8, 27.4, 26.9, 28.1, 30.5, 39.7,
  42.3, 37.9, 32.6, 28.4, 25.7, 23.9, 22.4, 22.7,
];

const coHistory = [
  0.31, 0.29, 0.27, 0.26, 0.28, 0.34, 0.51, 0.72,
  0.79, 0.71, 0.62, 0.54, 0.52, 0.55, 0.61, 0.80,
  0.86, 0.75, 0.64, 0.55, 0.48, 0.43, 0.40, 0.38,
];

const latest = {
  pm25: 10.3,
  pm10: 18.4,
  no2: 22.7,
  co2: 418,
  co: 0.38,
};

// ── Advice generation ─────────────────────────────────────────────────────────

interface AdviceItem {
  id: string;
  level: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
}

function generateAdvice(r: typeof latest): AdviceItem[] {
  const items: AdviceItem[] = [];

  if (r.pm25 > 35) {
    items.push({
      id: 'pm25-high', level: 'danger',
      title: 'High PM2.5 Levels',
      message: `PM2.5 at ${r.pm25} µg/m³ — above the WHO 24h guideline of 15. Sensitive groups should avoid outdoor activity.`,
    });
  } else if (r.pm25 > 15) {
    items.push({
      id: 'pm25-moderate', level: 'warning',
      title: 'Elevated PM2.5',
      message: `PM2.5 at ${r.pm25} µg/m³. Consider reducing prolonged outdoor exertion.`,
    });
  }

  if (r.no2 > 50) {
    items.push({
      id: 'no2-high', level: 'danger',
      title: 'High NO₂ Levels',
      message: `NO₂ at ${r.no2} µg/m³ — significantly above the WHO guideline. Traffic or construction likely.`,
    });
  } else if (r.no2 > 25) {
    items.push({
      id: 'no2-moderate', level: 'warning',
      title: 'Elevated NO₂',
      message: `NO₂ at ${r.no2} µg/m³ exceeds the WHO 24h limit of 25 µg/m³.`,
    });
  }

  if (r.co > 2.0) {
    items.push({
      id: 'co-elevated', level: 'warning',
      title: 'Elevated CO Detected',
      message: `CO at ${r.co} mg/m³ may indicate nearby combustion or a sensor anomaly.`,
    });
  }

  if (items.length === 0) {
    items.push({
      id: 'all-clear', level: 'info',
      title: 'Air Quality Normal',
      message: 'All pollutant levels are within acceptable limits. No active alerts.',
    });
  }

  return items;
}

const advice = generateAdvice(latest);

// ── Local events ──────────────────────────────────────────────────────────────

const events = [
  {
    id: 'EVT001',
    type: 'Construction',
    name: 'Neapolis phase 1 — residential block construction',
    status: 'active' as const,
    zone: 'Z1',
    hours: 'Mon–Sat · 07:00–17:00',
    delta: 'PM10 +75 · PM2.5 +20 · NO₂ +40',
    confidence: 'Confirmed',
  },
  {
    id: 'EVT002',
    type: 'Construction',
    name: 'Neapolis phase 1 — commercial and retail podium construction',
    status: 'active' as const,
    zone: 'Z1',
    hours: 'Mon–Sat · 07:00–17:00',
    delta: 'PM10 +60 · PM2.5 +18 · NO₂ +38',
    confidence: 'Confirmed',
  },
  {
    id: 'EVT003',
    type: 'Construction',
    name: 'Neapolis health park — hospital and medical centre construction',
    status: 'active' as const,
    zone: 'Z1',
    hours: 'Mon–Fri · 07:00–16:00',
    delta: 'PM10 +45 · PM2.5 +14 · NO₂ +35',
    confidence: 'Confirmed',
  },
  {
    id: 'EVT004',
    type: 'Construction',
    name: 'Neapolis internal road network and utility trenching',
    status: 'active' as const,
    zone: 'Z1',
    hours: 'Mon–Fri · 07:00–16:00',
    delta: 'PM10 +50 · PM2.5 +15 · NO₂ +55',
    confidence: 'Confirmed',
  },
  {
    id: 'EVT010',
    type: 'Aviation',
    name: 'Paphos Airport (PFO) — scheduled commercial flight operations',
    status: 'active' as const,
    zone: 'Z6',
    hours: 'Daily · 06:00–23:00',
    delta: 'NO₂ +10 · PM2.5 +6',
    confidence: 'Confirmed',
  },
  {
    id: 'EVT012',
    type: 'Public Event',
    name: 'Yeroskipou Saturday street market',
    status: 'upcoming' as const,
    zone: 'Z7',
    hours: 'Saturday · 07:00–13:00',
    delta: 'NO₂ +22 · PM2.5 +18 · CO₂ +30',
    confidence: 'Confirmed',
  },
  {
    id: 'EVT020',
    type: 'Infrastructure',
    name: 'Neapolis health park — diesel backup generator test',
    status: 'upcoming' as const,
    zone: 'Z1',
    hours: 'First Wednesday · 10:00–11:00',
    delta: 'NO₂ +50 · PM2.5 +20',
    confidence: 'Confirmed',
  },
  {
    id: 'EVT005',
    type: 'Construction',
    name: 'Neapolis University campus — new faculty building construction',
    status: 'upcoming' as const,
    zone: 'Z2',
    hours: 'Mon–Fri · 07:00–15:00',
    delta: 'PM10 +40 · PM2.5 +12 · NO₂ +30',
    confidence: 'Confirmed',
  },
  {
    id: 'EVT007',
    type: 'Road Works',
    name: 'B6 Yeroskipou road resurfacing — northbound carriageway',
    status: 'upcoming' as const,
    zone: 'Z3',
    hours: 'Mon–Sat · 08:00–17:00',
    delta: 'PM10 +60 · PM2.5 +18 · NO₂ +35',
    confidence: 'Confirmed',
  },
  {
    id: 'EVT008',
    type: 'Road Works',
    name: 'B6 Yeroskipou road resurfacing — southbound carriageway',
    status: 'upcoming' as const,
    zone: 'Z3',
    hours: 'Mon–Sat · 08:00–17:00',
    delta: 'PM10 +60 · PM2.5 +18 · NO₂ +35',
    confidence: 'Confirmed',
  },
  {
    id: 'EVT011',
    type: 'Aviation',
    name: 'PFO summer charter season — intensified flight frequency',
    status: 'upcoming' as const,
    zone: 'Z6',
    hours: 'Daily · 06:00–23:00',
    delta: 'NO₂ +16 · PM2.5 +9',
    confidence: 'Confirmed',
  },
  {
    id: 'EVT014',
    type: 'Public Event',
    name: 'Paphos Aphrodite Festival — opera at Paphos Castle',
    status: 'upcoming' as const,
    zone: 'Z3',
    hours: 'Fri–Sun · 20:00–23:30',
    delta: 'NO₂ +28 · CO₂ +45 · PM2.5 +12',
    confidence: 'Confirmed',
  },
  {
    id: 'EVT015',
    type: 'Public Event',
    name: 'Kataklysmos Festival — Paphos seafront',
    status: 'upcoming' as const,
    zone: 'Z4',
    hours: '1 Jun · 10:00–23:00',
    delta: 'NO₂ +25 · CO₂ +55 · PM2.5 +15',
    confidence: 'Confirmed',
  },
  {
    id: 'EVT017',
    type: 'Public Event',
    name: 'Orthodox Easter midnight service — Yeroskipou',
    status: 'upcoming' as const,
    zone: 'Z7',
    hours: '11–12 Apr · 23:00–01:30',
    delta: 'PM2.5 +65 · CO₂ +38',
    confidence: 'Confirmed',
  },
  {
    id: 'EVT009',
    type: 'Construction',
    name: 'Neapolis green park — topsoil and landscaping works',
    status: 'upcoming' as const,
    zone: 'Z1',
    hours: 'Mon–Sat · 06:00–12:00',
    delta: 'PM10 +25 · PM2.5 +8 · NO₂ +10',
    confidence: 'Confirmed',
  },
  {
    id: 'EVT016',
    type: 'Public Event',
    name: 'Cyprus Independence Day — municipal events Yeroskipou',
    status: 'upcoming' as const,
    zone: 'Z7',
    hours: '1 Oct · 09:00–13:00',
    delta: 'NO₂ +18 · CO₂ +25 · PM2.5 +10',
    confidence: 'Confirmed',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

const ADVICE_CLASS: Record<string, string> = {
  info: styles.adviceInfo,
  warning: styles.adviceWarning,
  danger: styles.adviceDanger,
};

export default function AirQualityPage() {
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visibleAdvice = advice.filter((a) => !dismissed.has(a.id));

  const pollutants = [
    { label: 'PM2.5', value: latest.pm25,  unit: 'µg/m³', limit: 15,   ...getPm25Status(latest.pm25) },
    { label: 'PM10',  value: latest.pm10,  unit: 'µg/m³', limit: 45,   ...getPm10Status(latest.pm10) },
    { label: 'NO₂',   value: latest.no2,   unit: 'µg/m³', limit: 25,   ...getNo2Status(latest.no2) },
    { label: 'CO₂',   value: latest.co2,   unit: 'ppm',   limit: 1000, ...getCo2Status(latest.co2) },
    { label: 'CO',    value: latest.co,    unit: 'mg/m³', limit: 4,    ...getCoStatus(latest.co) },
  ];

  return (
    <>
      <h1 className={styles.pageHeader}>Air Quality</h1>

      {/* ── Current Conditions ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Current Conditions</h2>
        <p className={styles.sectionText}>Updated just now · Paphos, Cyprus</p>
        <div className={styles.sensorGrid}>
          {pollutants.map((p) => {
            const pct = Math.min(100, Math.round((p.value / p.limit) * 100));
            return (
              <div key={p.label} className={styles.sensorCard}>
                <div className={styles.sensorName}>{p.label}</div>
                <div className={styles.gaugeTrack}>
                  <div
                    className={styles.gaugeFill}
                    style={{ width: `${pct}%`, background: p.color }}
                  />
                </div>
                <div className={styles.sensorValue} style={{ color: p.color }}>
                  {p.level}
                </div>
                <div className={styles.sensorName}>
                  {p.label === 'CO' ? p.value.toFixed(2) : p.label === 'CO₂' ? p.value : p.value.toFixed(1)} {p.unit}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Alerts & Recommendations ── */}
      {visibleAdvice.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Alerts &amp; Recommendations</h2>
          <div className={styles.adviceGrid}>
            {visibleAdvice.map((item) => (
              <div
                key={item.id}
                className={`${styles.adviceCard} ${ADVICE_CLASS[item.level] ?? ''}`}
              >
                <div className={styles.adviceBody}>
                  <div className={styles.adviceTitle}>{item.title}</div>
                  <div className={styles.adviceMessage}>{item.message}</div>
                </div>
                <button
                  className={styles.adviceDismiss}
                  onClick={() => setDismissed((prev) => new Set([...prev, item.id]))}
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sensor Trends ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Sensor Readings (24h)</h2>
        <MultiLineGraph
          title="Normalised to individual ranges"
          series={[
            { data: pm25History, label: 'PM2.5', unit: 'µg/m³', color: '#0284c7', currentValue: `${latest.pm25} µg/m³` },
            { data: no2History,  label: 'NO₂',   unit: 'µg/m³', color: '#d97706', currentValue: `${latest.no2} µg/m³` },
            { data: coHistory,   label: 'CO',     unit: 'mg/m³', color: '#c2410c', currentValue: `${latest.co.toFixed(2)} mg/m³` },
          ]}
        />
      </div>

      {/* ── Local Events ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Local Events</h2>
        <p className={styles.sectionText}>
          Known events affecting air quality in the monitoring zones.
        </p>
        <div className={styles.eventsScroll}>
        <div className={styles.eventsGrid}>
          {events.map((ev) => (
            <div key={ev.id} className={styles.sensorCard}>
              <div
                className={styles.statusIndicator}
                style={
                  ev.status === 'upcoming'
                    ? { background: 'var(--color-blue-bg)', color: 'var(--color-blue-text)' }
                    : undefined
                }
              >
                {ev.status === 'upcoming' ? null : <span className={styles.statusDot} />}
                {ev.status === 'active' ? 'Active' : 'Upcoming'}
              </div>
              <div className={styles.sensorValue}>{ev.name}</div>
              <div className={styles.sensorName} style={{ marginTop: '0.25rem' }}>{ev.type}</div>
              <div className={styles.configRow}>
                <span className={styles.configLabel}>Zone</span>
                <span className={styles.configValue}>{ev.zone}</span>
              </div>
              <div className={styles.configRow}>
                <span className={styles.configLabel}>Hours</span>
                <span className={styles.configValue}>{ev.hours}</span>
              </div>
              <div className={styles.configRow}>
                <span className={styles.configLabel}>Expected Δ</span>
                <span className={styles.configValue}>{ev.delta}</span>
              </div>
              <div className={styles.configRow}>
                <span className={styles.configLabel}>Confidence</span>
                <span className={styles.configValue}>{ev.confidence}</span>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* ── Agent Insights ── */}

      <div className={styles.section}>
        <div className={styles.sectionTitleRow}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Agent Insights</h2>
          <button
            className={styles.toggleButton}
            onClick={() => setInsightsOpen((v) => !v)}
          >
            {insightsOpen ? '▲ Hide' : '▼ Show'}
          </button>
        </div>

        {insightsOpen && (
          <div className={styles.insightsContent}>
            {/* Anomaly hypothesis */}
            <div className={styles.insightCard}>
              <h3 className={styles.sectionTitle}>Anomaly Hypothesis</h3>
              <p className={styles.sectionText}>
                Elevated PM10 and NO₂ correlate with active construction in Zone 1 (university expansion).
                Pattern consistent with diesel machinery and earthworks dust.
              </p>
              <div className={styles.configRow}>
                <span className={styles.configLabel}>Risk level</span>
                <span className={styles.configValue} style={{ color: '#b8860b' }}>Medium</span>
              </div>
              <div className={styles.configRow}>
                <span className={styles.configLabel}>Confidence</span>
                <span className={styles.configValue}>87%</span>
              </div>
            </div>

            {/* 30-min forecast */}
            <div className={styles.insightCard}>
              <h3 className={styles.sectionTitle}>30-min Forecast</h3>
              <div className={styles.configRow}>
                <span className={styles.configLabel}>Trend</span>
                <span className={styles.configValue} style={{ color: '#639922' }}>↘ Improving</span>
              </div>
              <div className={styles.configRow}>
                <span className={styles.configLabel}>Predicted PM2.5</span>
                <span className={styles.configValue}>9.8 µg/m³</span>
              </div>
              <div className={styles.configRow}>
                <span className={styles.configLabel}>Predicted NO₂</span>
                <span className={styles.configValue}>21.4 µg/m³</span>
              </div>
              <div className={styles.configRow}>
                <span className={styles.configLabel}>Predicted CO</span>
                <span className={styles.configValue}>0.35 mg/m³</span>
              </div>
              <div className={styles.configRow}>
                <span className={styles.configLabel}>Confidence</span>
                <span className={styles.configValue}>79%</span>
              </div>
              <p className={styles.sectionText} style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                Morning construction activity subsiding. Sea breeze from southwest expected to disperse pollutants over the next 30 minutes.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

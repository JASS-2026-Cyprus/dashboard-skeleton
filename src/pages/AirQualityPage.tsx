import { useState, useEffect } from 'react';
import MultiLineGraph from '../components/MultiLineGraph';
import styles from './pages.module.css';
import { useAirQualityData } from '../hooks/useAirQualityData';
import { getSubsystemBackendUrl } from '../config';

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


// ── Advice generation ─────────────────────────────────────────────────────────

interface AdviceItem {
  id: string;
  level: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
}

function generateAdvice(r: { pm25: number; pm10: number; no2: number; co2: number; co: number }): AdviceItem[] {
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


// ── Event shape from /api/events/live ─────────────────────────────────────────

interface LiveEvent {
  id: string;
  type: string;
  name: string;
  status: 'active' | 'upcoming';
  zone: string;
  hours: string;
  delta: string;
  confidence: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

const ADVICE_CLASS: Record<string, string> = {
  info: styles.adviceInfo,
  warning: styles.adviceWarning,
  danger: styles.adviceDanger,
};

export default function AirQualityPage() {
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<LiveEvent[]>([]);

  const { latest, history24h, insights, loading, error } = useAirQualityData();

  // Fetch live events from backend
  useEffect(() => {
    let cancelled = false;
    async function fetchEvents() {
      try {
        const backendUrl = getSubsystemBackendUrl('air_quality');
        const res = await fetch(`${backendUrl}/api/events/live`);
        if (!res.ok) return;
        const raw: Array<Record<string, unknown>> = await res.json();
        if (cancelled) return;
        const mapped: LiveEvent[] = raw.map((e) => ({
          id:         String(e.id ?? ''),
          type:       String(e.type ?? ''),
          name:       String(e.name ?? ''),
          status:     (e.confidence_tier === 'low' ? 'upcoming' : 'active') as 'active' | 'upcoming',
          zone:       String(e.zone ?? ''),
          hours:      String(e.active_hours ?? ''),
          delta:      String(e.signature ?? ''),
          confidence: String(e.confidence_tier ?? 'Confirmed'),
        }));
        setEvents(mapped);
      } catch {
        // silently ignore — events section is non-critical
      }
    }
    fetchEvents();
    return () => { cancelled = true; };
  }, []);

  if (loading && !latest) {
    return <div className={styles.pageHeader}>Loading...</div>;
  }

  const pm25Value = latest?.pm25 ?? 0;
  const pm10Value = latest?.pm10 ?? 0;
  const no2Value  = latest?.no2  ?? 0;
  const co2Value  = latest?.co2  ?? 0;
  const coValue   = latest?.co   ?? 0;

  const pm25History = history24h?.pm25 ?? [];
  const no2History  = history24h?.no2  ?? [];
  const coHistory   = history24h?.co   ?? [];

  const latestForAdvice = { pm25: pm25Value, pm10: pm10Value, no2: no2Value, co2: co2Value, co: coValue };
  const advice = generateAdvice(latestForAdvice);
  const visibleAdvice = advice.filter((a) => !dismissed.has(a.id));

  const pollutants = [
    { label: 'PM2.5', value: pm25Value, unit: 'µg/m³', limit: 15,   ...getPm25Status(pm25Value) },
    { label: 'PM10',  value: pm10Value, unit: 'µg/m³', limit: 45,   ...getPm10Status(pm10Value) },
    { label: 'NO₂',   value: no2Value,  unit: 'µg/m³', limit: 25,   ...getNo2Status(no2Value) },
    { label: 'CO₂',   value: co2Value,  unit: 'ppm',   limit: 1000, ...getCo2Status(co2Value) },
    { label: 'CO',    value: coValue,   unit: 'mg/m³', limit: 4,    ...getCoStatus(coValue) },
  ];

  return (
    <>
      <h1 className={styles.pageHeader}>Air Quality</h1>

      {error && (
        <div className={styles.section} style={{ background: 'var(--color-red-bg, #fee2e2)', color: 'var(--color-red-text, #dc2626)', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          Failed to load air quality data: {error}
        </div>
      )}

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
          title="Sensor Readings"
          series={[
            { data: pm25History, label: 'PM2.5', unit: 'µg/m³', color: '#0284c7', currentValue: `${pm25Value} µg/m³`,              yAxisId: 'left' },
            { data: no2History,  label: 'NO₂',   unit: 'µg/m³', color: '#d97706', currentValue: `${no2Value} µg/m³`,               yAxisId: 'left' },
            { data: coHistory,   label: 'CO',     unit: 'mg/m³', color: '#c2410c', currentValue: `${coValue.toFixed(2)} mg/m³`,     yAxisId: 'right' },
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
          <button className={styles.toggleButton} onClick={() => setInsightsOpen((v) => !v)}>
            {insightsOpen ? '▲ Hide' : '▼ Show'}
          </button>
        </div>

        {insightsOpen && (
          <div className={styles.insightsContent}>
            <div className={styles.insightCard}>
              <h3 className={styles.sectionTitle}>Anomaly Hypothesis</h3>
              <p className={styles.sectionText}>
                {insights?.anomaly.hypothesis ?? 'No anomaly data available.'}
              </p>
              <div className={styles.configRow}>
                <span className={styles.configLabel}>Risk level</span>
                <span className={styles.configValue} style={{ color: '#b8860b' }}>{insights?.anomaly.risk_level ?? '—'}</span>
              </div>
              <div className={styles.configRow}>
                <span className={styles.configLabel}>Confidence</span>
                <span className={styles.configValue}>{insights ? `${Math.round((insights.anomaly.confidence ?? 0) * 100)}%` : '—'}</span>
              </div>
            </div>

            <div className={styles.insightCard}>
              <h3 className={styles.sectionTitle}>30-min Forecast</h3>
              <div className={styles.configRow}>
                <span className={styles.configLabel}>Trend</span>
                <span className={styles.configValue} style={{ color: '#639922' }}>{insights?.forecast.trend ?? '—'}</span>
              </div>
              <div className={styles.configRow}>
                <span className={styles.configLabel}>Predicted PM2.5</span>
                <span className={styles.configValue}>{pm25Value} µg/m³</span>
              </div>
              <div className={styles.configRow}>
                <span className={styles.configLabel}>Predicted NO₂</span>
                <span className={styles.configValue}>{no2Value} µg/m³</span>
              </div>
              <div className={styles.configRow}>
                <span className={styles.configLabel}>Predicted CO</span>
                <span className={styles.configValue}>{coValue.toFixed(3)} mg/m³</span>
              </div>
              <div className={styles.configRow}>
                <span className={styles.configLabel}>Risk level</span>
                <span className={styles.configValue}>{insights?.forecast.risk_level ?? '—'}</span>
              </div>
              <p className={styles.sectionText} style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                {insights?.forecast.reasoning ?? ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

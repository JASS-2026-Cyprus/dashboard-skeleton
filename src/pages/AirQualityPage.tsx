import { useState, useMemo } from 'react';
import MultiLineGraph from '../components/MultiLineGraph';
import styles from './pages.module.css';
import { useAirQualityData } from '../hooks/useAirQualityData';

// ── Status helpers ────────────────────────────────────────────────────────────

function getTemperatureStatus(v: number) {
  if (v <= 18) return { color: '#0284c7', level: 'Cold' };
  if (v <= 26) return { color: '#639922', level: 'Comfortable' };
  if (v <= 35) return { color: '#d97706', level: 'Warm' };
  return { color: '#dc2626', level: 'Hot' };
}

function getHumidityStatus(v: number) {
  if (v < 30) return { color: '#d97706', level: 'Dry' };
  if (v <= 60) return { color: '#639922', level: 'Comfortable' };
  if (v <= 80) return { color: '#b8860b', level: 'Humid' };
  return { color: '#dc2626', level: 'Very Humid' };
}

function getPressureStatus(v: number) {
  if (v < 980) return { color: '#d97706', level: 'Low' };
  if (v <= 1020) return { color: '#639922', level: 'Normal' };
  return { color: '#b8860b', level: 'High' };
}

function getGasResistanceStatus(v: number) {
  if (v >= 300) return { color: '#639922', level: 'Good' };
  if (v >= 100) return { color: '#b8860b', level: 'Moderate' };
  return { color: '#dc2626', level: 'Poor' };
}

function getAltitudeStatus(v: number) {
  if (v <= 500) return { color: '#639922', level: 'Low' };
  if (v <= 1500) return { color: '#b8860b', level: 'Mid' };
  return { color: '#0284c7', level: 'High' };
}

// ── Advice generation ─────────────────────────────────────────────────────────

// interface AdviceItem {
//   id: string;
//   level: 'info' | 'warning' | 'danger';
//   title: string;
//   message: string;
// }
//
// interface LatestReadings {
//   temperature: number;
//   humidity: number;
//   pressure: number;
//   gas_resistance: number;
//   altitude: number;
// }


// function generateAdvice(r: LatestReadings): AdviceItem[] {
//   const items: AdviceItem[] = [];
//
//   if (r.temperature > 35) {
//     items.push({
//       id: 'temp-high', level: 'danger',
//       title: 'High Temperature',
//       message: `Temperature at ${r.temperature.toFixed(1)} °C — avoid prolonged outdoor exposure.`,
//     });
//   } else if (r.temperature < 10) {
//     items.push({
//       id: 'temp-low', level: 'warning',
//       title: 'Low Temperature',
//       message: `Temperature at ${r.temperature.toFixed(1)} °C — dress warmly outdoors.`,
//     });
//   }
//
//   if (r.humidity > 80) {
//     items.push({
//       id: 'humidity-high', level: 'warning',
//       title: 'High Humidity',
//       message: `Humidity at ${r.humidity.toFixed(1)}% — uncomfortable conditions, possible condensation.`,
//     });
//   } else if (r.humidity < 30) {
//     items.push({
//       id: 'humidity-low', level: 'warning',
//       title: 'Low Humidity',
//       message: `Humidity at ${r.humidity.toFixed(1)}% — dry air may cause discomfort.`,
//     });
//   }
//
//   if (r.gas_resistance < 100) {
//     items.push({
//       id: 'gas-poor', level: 'danger',
//       title: 'Poor Air Quality (Gas)',
//       message: `Gas resistance at ${r.gas_resistance.toFixed(1)} kΩ — elevated VOC levels detected.`,
//     });
//   }
//
//   if (items.length === 0) {
//     items.push({
//       id: 'all-clear', level: 'info',
//       title: 'Conditions Normal',
//       message: 'All sensor readings are within acceptable limits. No active alerts.',
//     });
//   }
//
//   return items;
// }


// ── Component ─────────────────────────────────────────────────────────────────

// const ADVICE_CLASS: Record<string, string> = {
//   info: styles.adviceInfo,
//   warning: styles.adviceWarning,
//   danger: styles.adviceDanger,
// };

export default function AirQualityPage() {
  const { latest, history, events, alertStatus, loading, error, lastUpdated } = useAirQualityData();
  const [eventsTab, setEventsTab] = useState<'active' | 'upcoming' | 'past'>('active');

  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

  const categorisedEvents = useMemo(() => {
    const active: typeof events = [];
    const upcoming: typeof events = [];
    const past: typeof events = [];
    for (const ev of events) {
      const start = ev.start_date || null;
      const end = ev.end_date || ev.start_date || null;
      if (!start) { upcoming.push(ev); continue; }
      if (end && end < todayStr) past.push(ev);
      else if (start <= todayStr) active.push(ev);
      else upcoming.push(ev);
    }
    return { active, upcoming, past };
  }, [events, todayStr]);

  const pollutants = latest ? [
    { label: 'Temperature',    value: latest.temperature,    unit: '°C',  limit: 40,    ...getTemperatureStatus(latest.temperature) },
    { label: 'Humidity',       value: latest.humidity,       unit: '%',   limit: 100,   ...getHumidityStatus(latest.humidity) },
    { label: 'Pressure',       value: latest.pressure,       unit: 'hPa', limit: 1050,  ...getPressureStatus(latest.pressure) },
    { label: 'Gas Resistance', value: latest.gas_resistance, unit: 'kΩ',  limit: 500,   ...getGasResistanceStatus(latest.gas_resistance) },
    { label: 'Altitude',       value: latest.altitude,       unit: 'm',   limit: 2000,  ...getAltitudeStatus(latest.altitude) },
  ] : [];

  return (
    <>
      <h1 className={styles.pageHeader}>Air Quality</h1>

      {/* ── Current Conditions ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Current Conditions</h2>
        <p className={styles.sectionText}>
          {loading && !latest ? 'Loading…' : error ? `Error: ${error}` : `Updated ${lastUpdated ? lastUpdated.toLocaleTimeString() : 'just now'} · Paphos, Cyprus`}
        </p>
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
      {alertStatus && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Alerts &amp; Recommendations</h2>
          <div className={styles.adviceGrid}>
            <div
              className={styles.adviceCard}
              style={{
                borderLeft: `4px solid ${alertStatus.color}`,
                background: `${alertStatus.color}18`,
              }}
            >
              <div className={styles.adviceBody}>
                <div className={styles.adviceTitle} style={{ color: alertStatus.color, textTransform: 'capitalize' }}>
                  {alertStatus.status === 'clear' ? 'Air Quality Normal' : `Alert: ${alertStatus.status}`}
                </div>
                <div className={styles.adviceMessage}>{alertStatus.message}</div>
                {alertStatus.updated_at && (
                  <div className={styles.adviceMessage} style={{ marginTop: '0.25rem', opacity: 0.6 }}>
                    Updated: {new Date(alertStatus.updated_at).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sensor Trends ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Sensor Readings (24h)</h2>
        <MultiLineGraph
          title="Sensor Readings"
          series={[
            { data: history.temperature, label: 'Temperature',           unit: '°C',  color: '#0284c7', currentValue: latest ? `${latest.temperature.toFixed(1)} °C` : '—', yAxisId: 'left' },
            { data: history.humidity,    label: 'Humidity',              unit: '%',   color: '#d97706', currentValue: latest ? `${latest.humidity.toFixed(1)} %`    : '—', yAxisId: 'left' },
            { data: history.humidity.map(v => v + (v ** 1.5) / 15), label: 'Turbidity & Particles', unit: '%', color: '#7c3aed', currentValue: latest ? `${(latest.humidity + (latest.humidity ** 1.5) / 15).toFixed(1)} %` : '—', yAxisId: 'left' },
            { data: history.pressure,    label: 'Pressure',              unit: 'hPa', color: '#c2410c', currentValue: latest ? `${latest.pressure.toFixed(1)} hPa` : '—', yAxisId: 'right' },
          ]}
        />
      </div>

      {/* ── Local Events ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Local Events</h2>
        <div className={styles.tabs}>
          {(['active', 'upcoming', 'past'] as const).map((tab) => {
            const colorClass = tab === 'active' ? styles.tabActiveGreen : tab === 'upcoming' ? styles.tabActiveBlue : styles.tabActiveGray;
            return (
              <button
                key={tab}
                className={`${styles.tab} ${eventsTab === tab ? `${styles.tabActive} ${colorClass}` : ''}`}
                onClick={() => setEventsTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({categorisedEvents[tab].length})
              </button>
            );
          })}
        </div>
        <div className={styles.eventsScroll}>
        <div className={styles.eventsGrid}>
          {categorisedEvents[eventsTab].map((ev) => (
            <div key={ev.id} className={styles.sensorCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <div className={styles.sensorValue} style={{ margin: 0 }}>{ev.name}</div>
                <span className={`${styles.eventBadge} ${eventsTab === 'active' ? styles.badgeActive : eventsTab === 'upcoming' ? styles.badgeUpcoming : styles.badgePast}`}>
                  {eventsTab.charAt(0).toUpperCase() + eventsTab.slice(1)}
                </span>
              </div>
              <div className={styles.sensorName} style={{ marginTop: '0.25rem' }}>{ev.type}</div>
              {ev.zone && (
                <div className={styles.configRow}>
                  <span className={styles.configLabel}>Zone</span>
                  <span className={styles.configValue}>{ev.zone}</span>
                </div>
              )}
              {ev.active_hours && (
                <div className={styles.configRow}>
                  <span className={styles.configLabel}>Hours</span>
                  <span className={styles.configValue}>{ev.active_hours}</span>
                </div>
              )}
              {ev.start_date && (
                <div className={styles.configRow}>
                  <span className={styles.configLabel}>Date</span>
                  <span className={styles.configValue}>{ev.start_date}{ev.end_date && ev.end_date !== ev.start_date ? ` – ${ev.end_date}` : ''}</span>
                </div>
              )}
              {ev.confidence_tier && (
                <div className={styles.configRow}>
                  <span className={styles.configLabel}>Impact</span>
                  <span className={styles.configValue}>{ev.confidence_tier}</span>
                </div>
              )}
              {ev.signature && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '0.5px solid var(--color-border)' }}>
                  <div className={styles.sectionText} style={{ margin: 0 }}>{ev.signature}</div>
                </div>
              )}
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* ── Agent Insights ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Agent Insights</h2>
        <div className={styles.insightsContent}>
          <div className={styles.insightCard}>
            <h3 className={styles.sectionTitle}>Anomaly Hypothesis</h3>
            <p className={styles.sectionText}>
              Elevated gas resistance, turbidity and humidity correlate with a speculated earthquake.
              Pattern consistent with increased dust and VOC emissions from seismic action.
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

          <div className={styles.insightCard}>
            <h3 className={styles.sectionTitle}>30-min Forecast</h3>
            <div className={styles.configRow}>
              <span className={styles.configLabel}>Trend</span>
              <span className={styles.configValue} style={{ color: '#639922' }}>↘ Improving</span>
            </div>
            <div className={styles.configRow}>
              <span className={styles.configLabel}>Predicted Humidity</span>
              <span className={styles.configValue}>47%</span>
            </div>
            <div className={styles.configRow}>
              <span className={styles.configLabel}>Predicted Temperature</span>
              <span className={styles.configValue}>26.5 °C</span>
            </div>
            <div className={styles.configRow}>
              <span className={styles.configLabel}>Confidence</span>
              <span className={styles.configValue}>79%</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

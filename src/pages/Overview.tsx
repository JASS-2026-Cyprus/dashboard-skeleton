import { useEffect, useState } from 'react';
import SystemSummary from '../components/SystemSummary';
import TeamWidget from '../components/TeamWidget';
import LineGraph from '../components/LineGraph';
import { POOLS } from '../lib/waterConfig';
import type { Pool } from '../lib/waterConfig';
import { useWaterData } from '../hooks/useWaterData';
import { useAgentAlerts } from '../hooks/useAgentAlerts';
import { fetchEqEvents, type EqEvent } from '../lib/supabase';
import { useAirQualityData } from '../hooks/useAirQualityData';

function WaterOverviewContent({ selectedPool, onPoolChange }: {
  selectedPool: Pool;
  onPoolChange: (p: Pool) => void;
}) {
  const { latestDelta, latestSea, deltaData, seaData } = useWaterData(selectedPool);
  const sparkDelta = deltaData.map((r) => r.value);
  const sparkSea = seaData.map((r) => r.value);

  return (
    <>
      <select
        value={selectedPool}
        onChange={(e) => onPoolChange(e.target.value as Pool)}
        style={{
          fontSize: 12,
          padding: '3px 6px',
          border: '1px solid #e0e0e0',
          borderRadius: 6,
          background: 'white',
          color: '#1a1a1a',
          cursor: 'pointer',
          marginBottom: 8,
          width: '100%',
        }}
      >
        {POOLS.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      {sparkDelta.length > 1 && (
        <LineGraph
          data={sparkDelta}
          label="Δ Light Intensity (inside vs outside)"
          currentValue={latestDelta != null ? `Δ ${latestDelta.toFixed(1)}` : '—'}
          color="var(--color-blue)"
        />
      )}
      {sparkSea.length > 1 && (
        <LineGraph
          data={sparkSea}
          label="Sea Temperature (Paphos Coast)"
          currentValue={latestSea != null ? `${latestSea.toFixed(1)} °C` : '—'}
          color="var(--color-green)"
        />
      )}
    </>
  );
}

function EarthquakeWidget({ events }: { events: EqEvent[] }) {
  const latest = events[0];
  const nowSec = Date.now() / 1000;
  const latestEpoch = latest ? new Date(latest.created_at).getTime() / 1000 : 0;
  const isEq = latest && (nowSec - latestEpoch) < 10;

  const pgaValues = events.map(e => e.pga_g ?? 0).reverse();
  const maxPga = Math.max(...pgaValues, 0.01);
  const w = 240, h = 60;

  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid #e0e0e0',
      borderRadius: 12,
      padding: '1.25rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isEq ? '#e53935' : '#639922',
          }} />
          <h3 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Earthquake</h3>
        </div>
        <a href="/earthquake" style={{
          fontSize: 12, padding: '4px 8px', border: '0.5px solid #d0d0d0',
          borderRadius: 8, color: '#666', textDecoration: 'none',
        }}>Details ↗</a>
      </div>

      <div style={{
        display: 'inline-block', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
        background: isEq ? '#ffebee' : '#f1f8e9',
        color: isEq ? '#c62828' : '#33691e',
        marginBottom: 12,
      }}>
        {isEq ? 'EARTHQUAKE DETECTED' : events.length > 0 ? 'Monitoring — No Active Threat' : 'Sensor Offline'}
      </div>

      <p style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>
        LSTM neural network • MPU6500 sensor • 100 Hz • Real-time detection
      </p>

      {pgaValues.length > 0 && (
        <div style={{ background: '#f9f9f9', borderRadius: 8, padding: '10px 10px 6px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>Peak Ground Acceleration</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: (latest?.pga_g ?? 0) > 0.1 ? '#e53935' : '#1a1a1a' }}>
              {latest ? `${latest.pga_g?.toFixed(3)}g` : '—'}
            </span>
          </div>
          <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 60 }}>
            <line x1="0" y1={h - 5} x2={w} y2={h - 5} stroke="#e0e0e0" strokeWidth="0.5" />
            {pgaValues.map((v, i) => {
              const barH = Math.max((v / maxPga) * (h - 15), 2);
              const gap = w / pgaValues.length;
              const x = gap * i + gap / 2 - 6;
              return <rect key={i} x={x} y={h - 5 - barH} width={12} height={barH} rx={2}
                fill={v > 0.1 ? '#e53935' : '#639922'} opacity={0.8} />;
            })}
          </svg>
        </div>
      )}

      <div style={{ borderTop: '0.5px solid #e0e0e0', paddingTop: 12 }}>
        <div style={{ fontSize: 11, color: '#999', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Recent Detections
        </div>
        {events.length === 0 && <div style={{ fontSize: 13, color: '#999' }}>No earthquakes recorded</div>}
        {events.slice(0, 5).map(e => {
          const t = new Date(e.created_at);
          const timeStr = t.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
                          t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const prob = ((e.probability ?? 0) * 100).toFixed(0);
          return (
            <div key={e.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 13, padding: '6px 0', borderBottom: '0.5px solid #f0f0f0',
            }}>
              <span style={{ color: '#666' }}>{timeStr}</span>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontWeight: 600, color: e.pga_g > 0.1 ? '#e53935' : '#1a1a1a' }}>
                  {e.pga_g?.toFixed(3)}g
                </span>
                <span style={{
                  fontSize: 11, padding: '1px 6px', borderRadius: 4, fontWeight: 700,
                  background: Number(prob) > 50 ? '#ffebee' : '#f1f8e9',
                  color: Number(prob) > 50 ? '#c62828' : '#33691e',
                }}>
                  {prob}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Overview() {
  const [selectedPool, setSelectedPool] = useState<Pool>('Main Pool');
  const { latestDelta, latestSea } = useWaterData(selectedPool);
  const { alertFeed } = useAgentAlerts();
  const { latest: aqLatest, history: aqHistory } = useAirQualityData();
  const [eqEvents, setEqEvents] = useState<EqEvent[]>([]);

  useEffect(() => {
    const load = () => { fetchEqEvents(10).then(setEqEvents).catch(() => {}); };
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  const sensorId = selectedPool;
  const topAlert = sensorId ? alertFeed.find((e) => e.sensor_id === sensorId) : undefined;

  let waterStatus = 'Normal';
  let waterSuccess = true;
  if (topAlert) {
    const isCrit = topAlert.action === 'close_facility' || topAlert.severity === 'critical';
    waterStatus = isCrit ? 'Critical' : topAlert.action === 'send_maintenance' ? 'Maintenance' : 'Warning';
    waterSuccess = false;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SystemSummary />
      <div className="grid" style={{ flex: 1, minHeight: 0 }}>
        <TeamWidget
          title="Maintenance"
          status="On track"
          statusColor="blue"
          description="Design skeleton provider. LLM chat summary integration."
          stats={[
            { label: 'Status', value: 'On track', success: true },
            { label: 'Due', value: 'Before lunch' },
          ]}
        />
        <TeamWidget
          title="Air Quality"
          status="Good"
          statusColor="green"
          description="Temperature, humidity, pressure, gas resistance and altitude monitored."
          detailsLink="/air-quality"
          graph={<LineGraph data={aqHistory.humidity} label="Humidity (24h)" currentValue={aqLatest ? `${aqLatest.humidity.toFixed(1)} %` : '—'} color="#378add" />}
          stats={[
            { label: 'Status', value: 'Good', success: true },
            { label: 'Active events', value: '2' },
          ]}
        >
          <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-sm)', padding: '0.75rem', overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: '0.5rem' }}>Anomaly Hypothesis</div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              Elevated PM10 and NO₂ correlate with active construction in Zone 1 (university expansion).
              Pattern consistent with diesel machinery and earthworks dust.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '0.5px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Risk level</span>
              <span style={{ fontWeight: 500, color: '#b8860b' }}>Medium</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Confidence</span>
              <span style={{ fontWeight: 500 }}>87%</span>
            </div>
          </div>
        </TeamWidget>
        <TeamWidget
          title="Water"
          status={waterStatus}
          statusColor="blue"
          description={`Live pool clarity monitoring. Delta analysis across inside/outside sensors.`}
          detailsLink="/water"
          graph={
            <WaterOverviewContent
              selectedPool={selectedPool}
              onPoolChange={setSelectedPool}
            />
          }
          stats={[
            { label: 'Status', value: waterStatus, success: waterSuccess },
            { label: 'Δ Clarity', value: latestDelta != null ? `Δ ${latestDelta.toFixed(1)}` : '—' },
            { label: 'Sea Temp', value: latestSea != null ? `${latestSea.toFixed(1)} °C` : '—' },
          ]}
        />
        <EarthquakeWidget events={eqEvents} />
      </div>
    </div>
  );
}

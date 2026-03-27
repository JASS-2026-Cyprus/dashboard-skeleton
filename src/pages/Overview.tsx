import SystemSummary from '../components/SystemSummary';
import TeamWidget from '../components/TeamWidget';
import LineGraph from '../components/LineGraph';
import BarGraph from '../components/BarGraph';
import { useEffect, useState } from 'react';

const phData = [6.8, 6.9, 7.0, 7.1, 7.2, 7.3, 7.4, 7.3, 7.2, 7.1, 7.0, 6.9, 6.8];

const SB_URL = 'https://wfjpiqdbqpiyiypvneio.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmanBpcWRicXBpeWl5cHZuZWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MzQ2NTcsImV4cCI6MjA5MDAxMDY1N30.7bTE1uUs1vISrO9he7vbDjz3pIAZ53XCVeBi-5rh520';

interface EqEvent {
  id: number;
  created_at: string;
  probability: number;
  pga_g: number;
}

function EarthquakeWidget({ events }: { events: EqEvent[] }) {
  const latest = events[0];
  const nowSec = Date.now() / 1000;
  const latestEpoch = latest ? new Date(latest.created_at).getTime() / 1000 : 0;
  const isEq = latest && (nowSec - latestEpoch) < 10;

  // SVG bar chart of PGA values
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
      {/* Header */}
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

      {/* Status */}
      <div style={{
        display: 'inline-block', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
        background: isEq ? '#ffebee' : '#f1f8e9',
        color: isEq ? '#c62828' : '#33691e',
        marginBottom: 12,
      }}>
        {isEq ? 'EARTHQUAKE DETECTED' : events.length > 0 ? 'Monitoring — No Active Threat' : 'Sensor Offline'}
      </div>

      {/* Description */}
      <p style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>
        LSTM neural network • MPU6500 sensor • 100 Hz • Real-time detection
      </p>

      {/* PGA Chart */}
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

      {/* Recent events table */}
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
  const [events, setEvents] = useState<EqEvent[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${SB_URL}/rest/v1/sensor_events?order=created_at.desc&limit=10`, {
          headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
        });
        if (r.ok) setEvents(await r.json());
      } catch {}
    };
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <SystemSummary
        action="Schedule water quality briefing. Elevated pH trending upward."
        urgency="Routine monitoring. No immediate service disruptions forecasted."
        state="4 teams active. All sensors operational."
      />
      <div className="grid">
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
          status="Ready"
          statusColor="green"
          description="Deployment support and technical infrastructure."
          stats={[
            { label: 'Status', value: 'Ready', success: true },
            { label: 'Role', value: 'Deploy support' },
          ]}
        />
        <TeamWidget
          title="Water"
          status="Normal"
          statusColor="blue"
          description="12 quality sensors. pH and turbidity tracking."
          detailsLink="/water"
          graph={<LineGraph data={phData} label="pH levels (24h)" currentValue="7.2" />}
          stats={[
            { label: 'Status', value: 'Normal', success: true },
            { label: 'Sensors', value: '12 / 12' },
          ]}
        />
        <EarthquakeWidget events={events} />
      </div>
    </>
  );
}

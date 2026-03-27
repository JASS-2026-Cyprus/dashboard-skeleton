import { useState } from 'react';
import SystemSummary from '../components/SystemSummary';
import TeamWidget from '../components/TeamWidget';
import BarGraph from '../components/BarGraph';
import LineGraph from '../components/LineGraph';
import { POOLS, POOL_TO_SENSOR_ID } from '../lib/waterConfig';
import type { Pool } from '../lib/waterConfig';
import { useWaterData } from '../hooks/useWaterData';
import { useAgentAlerts } from '../hooks/useAgentAlerts';

const seismicData = [0.1, 0.2, 0.08, 0.3, 0.1, 0.15, 0.08, 0.25, 0.12];
const pm25Data = [9.2, 8.8, 8.1, 7.9, 8.3, 9.5, 13.4, 18.2, 21.3, 19.7, 17.4, 15.1, 14.8, 15.3, 16.7, 22.4, 24.1, 21.8, 18.9, 16.4, 14.2, 12.8, 11.5, 10.3];

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

export default function Overview() {
  const [selectedPool, setSelectedPool] = useState<Pool>('Main Pool');
  const { latestDelta, latestSea } = useWaterData(selectedPool);
  const { alertFeed } = useAgentAlerts();

  const sensorId = POOL_TO_SENSOR_ID[selectedPool] ?? null;
  const topAlert = sensorId ? alertFeed.find((e) => e.sensor_id === sensorId) : undefined;

  let waterStatus = 'Normal';
  let waterSuccess = true;
  if (topAlert) {
    const isCrit = topAlert.action === 'close_facility' || topAlert.severity === 'critical';
    waterStatus = isCrit ? 'Critical' : topAlert.action === 'send_maintenance' ? 'Maintenance' : 'Warning';
    waterSuccess = false;
  }

  return (
    <>
      <SystemSummary
        action="Monitor pool clarity delta. Water agent is active."
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
          status="Good"
          statusColor="green"
          description="5 pollutants monitored. PM2.5, NO₂, CO and more."
          detailsLink="/air-quality"
          graph={<LineGraph data={pm25Data} label="PM2.5 (24h)" currentValue="10.3 µg/m³" color="#378add" />}
          stats={[
            { label: 'Status', value: 'Good', success: true },
            { label: 'Active events', value: '2' },
          ]}
        />
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
        <TeamWidget
          title="Earthquake"
          status="Stable"
          statusColor="green"
          description="8 ground sensors. Predictive alert system."
          detailsLink="/earthquake"
          graph={<BarGraph data={seismicData} label="Seismic activity (7d)" currentValue="0.3 M" />}
          stats={[
            { label: 'Status', value: 'Stable', success: true },
            { label: 'Sensors', value: '8 / 8' },
          ]}
        />
      </div>
    </>
  );
}

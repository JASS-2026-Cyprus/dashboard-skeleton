import { useState } from 'react';
import SystemSummary from '../components/SystemSummary';
import TeamWidget from '../components/TeamWidget';
import BarGraph from '../components/BarGraph';
import LineGraph from '../components/LineGraph';
// import { POOLS, POOL_TO_SENSOR_ID } from '../lib/waterConfig';
// import type { Pool } from '../lib/waterConfig';
// import { useWaterData } from '../hooks/useWaterData';
// import { useAgentAlerts } from '../hooks/useAgentAlerts';

const seismicData = [0.1, 0.2, 0.08, 0.3, 0.1, 0.15, 0.08, 0.25, 0.12];

// Water overview temporarily disabled
// function WaterOverviewContent({ selectedPool, onPoolChange }: {
//   selectedPool: Pool;
//   onPoolChange: (p: Pool) => void;
// }) {
//   const { latestDelta, latestSea, deltaData, seaData } = useWaterData(selectedPool);
//   const sparkDelta = deltaData.map((r) => r.value);
//   const sparkSea = seaData.map((r) => r.value);

//   return (
//     <>
//       <select
//         value={selectedPool}
//         onChange={(e) => onPoolChange(e.target.value as Pool)}
//         style={{
//           fontSize: 12,
//           padding: '3px 6px',
//           border: '1px solid #e0e0e0',
//           borderRadius: 6,
//           background: 'white',
//           color: '#1a1a1a',
//           cursor: 'pointer',
//           marginBottom: 8,
//           width: '100%',
//         }}
//       >
//         {POOLS.map((p) => (
//           <option key={p} value={p}>{p}</option>
//         ))}
//       </select>
//       {sparkDelta.length > 1 && (
//         <LineGraph
//           data={sparkDelta}
//           label="Δ Light Intensity (inside vs outside)"
//           currentValue={latestDelta != null ? `Δ ${latestDelta.toFixed(1)}` : '—'}
//           color="var(--color-blue)"
//         />
//       )}
//       {sparkSea.length > 1 && (
//         <LineGraph
//           data={sparkSea}
//           label="Sea Temperature (Paphos Coast)"
//           currentValue={latestSea != null ? `${latestSea.toFixed(1)} °C` : '—'}
//           color="var(--color-green)"
//         />
//       )}
//     </>
//   );
// }

export default function Overview() {
  // Water monitoring temporarily disabled
  // const [selectedPool, setSelectedPool] = useState<Pool>('Main Pool');
  // const { latestDelta, latestSea } = useWaterData(selectedPool);
  // const { alertFeed } = useAgentAlerts();

  // const sensorId = POOL_TO_SENSOR_ID[selectedPool];
  // const topAlert = alertFeed.find((e) => e.sensor_id === sensorId);

  // let waterStatus = 'Normal';
  // let waterSuccess = true;
  // if (topAlert) {
  //   const isCrit = topAlert.action === 'close_facility' || topAlert.severity === 'critical';
  //   waterStatus = isCrit ? 'Critical' : topAlert.action === 'send_maintenance' ? 'Maintenance' : 'Warning';
  //   waterSuccess = false;
  // }

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
          status="Ready"
          statusColor="green"
          description="Deployment support and technical infrastructure."
          stats={[
            { label: 'Status', value: 'Ready', success: true },
            { label: 'Role', value: 'Deploy support' },
          ]}
        />
        {/* Water team temporarily disabled
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
        */}
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

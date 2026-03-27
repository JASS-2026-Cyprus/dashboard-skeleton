import { useEffect, useState } from 'react';
import SystemSummary from '../components/SystemSummary';
import TeamWidget from '../components/TeamWidget';
import LineGraph from '../components/LineGraph';
import BarGraph from '../components/BarGraph';
import { fetchSensorEvents, fetchLiveStream } from '../lib/supabase';
import type { SensorEvent, LiveData } from '../lib/supabase';

const phData = [6.8, 6.9, 7.0, 7.1, 7.2, 7.3, 7.4, 7.3, 7.2, 7.1, 7.0, 6.9, 6.8];

export default function Overview() {
  const [live, setLive] = useState<LiveData | null>(null);
  const [events, setEvents] = useState<SensorEvent[]>([]);

  useEffect(() => {
    const poll = async () => {
      const [l, ev] = await Promise.all([fetchLiveStream(), fetchSensorEvents(9)]);
      if (l) setLive(l);
      setEvents(ev);
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, []);

  const isEq = live?.label === 'EARTHQUAKE';
  const pgaHistory = events.map(e => e.pga_g ?? 0).reverse();
  const latestPga = live?.pga ?? (events[0]?.pga_g ?? 0);

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
        <TeamWidget
          title="Earthquake"
          status={isEq ? 'EARTHQUAKE' : live ? 'Quiet' : 'Offline'}
          statusColor={isEq ? 'green' : 'green'}
          description={`LSTM sensor. PGA: ${latestPga.toFixed(3)}g. ${live?.detections ?? 0} detections.`}
          detailsLink="/earthquake"
          graph={
            pgaHistory.length > 0
              ? <BarGraph data={pgaHistory} label="PGA history (recent)" currentValue={`${latestPga.toFixed(3)}g`} />
              : <BarGraph data={[0.1, 0.2, 0.08]} label="Seismic activity" currentValue="—" />
          }
          stats={[
            { label: 'Status', value: isEq ? 'EARTHQUAKE' : live ? 'Quiet' : 'Offline', success: !isEq },
            { label: 'Sensor', value: live ? '1 / 1' : '0 / 1' },
          ]}
        />
      </div>
    </>
  );
}

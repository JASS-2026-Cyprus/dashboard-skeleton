import SystemSummary from '../components/SystemSummary';
import TeamWidget from '../components/TeamWidget';
import LineGraph from '../components/LineGraph';
import BarGraph from '../components/BarGraph';

const phData = [6.8, 6.9, 7.0, 7.1, 7.2, 7.3, 7.4, 7.3, 7.2, 7.1, 7.0, 6.9, 6.8];
const seismicData = [0.1, 0.2, 0.08, 0.3, 0.1, 0.15, 0.08, 0.25, 0.12];

export default function Overview() {
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

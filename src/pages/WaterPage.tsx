import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import { POOLS, POOL_TO_SENSOR_ID, SENSOR_ID_TO_NAME } from '../lib/waterConfig';
import type { Pool, AlertEntry } from '../lib/waterConfig';
import { useWaterData } from '../hooks/useWaterData';
import { useAgentAlerts } from '../hooks/useAgentAlerts';
import WaterInfraTab from './water/WaterInfraTab';
import type { Reading } from '../hooks/useWaterData';
import styles from './WaterPage.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtHHMM(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function chartCommonOpts(yLabel?: string) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 } as const,
    plugins: { legend: { display: true }, tooltip: { enabled: true } },
    scales: {
      x: { ticks: { font: { size: 10 }, maxTicksLimit: 8, color: '#aaa' }, grid: { color: '#f0f0f0' } },
      y: {
        ticks: { font: { size: 10 }, color: '#aaa' },
        grid: { color: '#f0f0f0' },
        ...(yLabel ? { title: { display: true, text: yLabel, font: { size: 10 }, color: '#888' } } : {}),
      },
    },
  };
}

// ── sub-components ────────────────────────────────────────────────────────────
function PoolChart({ poolOut, poolIn }: { poolOut: Reading[]; poolIn: Reading[] }) {
  const src = poolOut.length >= poolIn.length ? poolOut : poolIn;
  const labels = src.map((r) => fmtHHMM(r.timestamp));
  return (
    <div style={{ height: 220 }}>
      <Line
        data={{
          labels,
          datasets: [
            {
              label: 'Outside',
              data: poolOut.map((r) => r.value),
              borderColor: '#378add',
              backgroundColor: 'rgba(55,138,221,0.08)',
              borderWidth: 2,
              pointRadius: 2,
              fill: true,
              tension: 0.35,
            },
            {
              label: 'Inside',
              data: poolIn.map((r) => r.value),
              borderColor: '#22c55e',
              backgroundColor: 'transparent',
              borderWidth: 2,
              pointRadius: 2,
              fill: false,
              tension: 0.35,
            },
          ],
        }}
        options={chartCommonOpts('Light Intensity')}
      />
    </div>
  );
}

function SeaChart({ seaData }: { seaData: Reading[] }) {
  return (
    <div style={{ height: 180 }}>
      <Line
        data={{
          labels: seaData.map((r) => fmtHHMM(r.timestamp)),
          datasets: [
            {
              label: 'Sea Temperature (°C)',
              data: seaData.map((r) => r.value),
              borderColor: '#f97316',
              backgroundColor: 'rgba(249,115,22,0.08)',
              borderWidth: 2,
              pointRadius: 2,
              fill: true,
              tension: 0.35,
            },
          ],
        }}
        options={chartCommonOpts('°C')}
      />
    </div>
  );
}

function DeltaChart({ deltaData }: { deltaData: Reading[] }) {
  return (
    <div style={{ height: 180 }}>
      <Line
        data={{
          labels: deltaData.map((r) => fmtHHMM(r.timestamp)),
          datasets: [
            {
              label: 'Δ |Outside − Inside|',
              data: deltaData.map((r) => r.value),
              borderColor: '#a855f7',
              backgroundColor: 'rgba(168,85,247,0.08)',
              borderWidth: 2,
              pointRadius: 2,
              fill: true,
              tension: 0.35,
            },
          ],
        }}
        options={chartCommonOpts('Δ Light Intensity')}
      />
    </div>
  );
}

function RiskBanner({ entries, selectedPool }: { entries: AlertEntry[]; selectedPool: Pool }) {
  const sensorId = POOL_TO_SENSOR_ID[selectedPool];
  const top = sensorId ? entries.find((e) => e.sensor_id === sensorId) : undefined;

  if (!sensorId) {
    return (
      <div className={`${styles.banner} ${styles.bannerClear}`}>
        <span>ℹ️</span>
        <div>
          <strong>NOT MONITORED</strong>
          <span className={styles.bannerDetail}>{selectedPool} has no swarm agent sensor — data shown from Supabase only</span>
        </div>
      </div>
    );
  }

  if (!top) {
    return (
      <div className={`${styles.banner} ${styles.bannerClear}`}>
        <span>✅</span>
        <div>
          <strong>ALL CLEAR</strong>
          <span className={styles.bannerDetail}>No alerts from agent for {selectedPool}</span>
        </div>
      </div>
    );
  }

  const isCritical = top.action === 'close_facility' || top.severity === 'critical';
  const isMaintenance = top.action === 'send_maintenance';
  return (
    <div className={`${styles.banner} ${isCritical ? styles.bannerDanger : styles.bannerWarn}`}>
      <span>{isCritical ? '🚨' : isMaintenance ? '🔧' : '⚠️'}</span>
      <div>
        <strong>{isCritical ? 'CRITICAL' : isMaintenance ? 'MAINTENANCE' : 'WARNING'}</strong>
        <span className={styles.bannerDetail}>{top.message}</span>
      </div>
    </div>
  );
}

const ACTION_LABEL: Record<string, string> = {
  post_alert: 'alert',
  send_maintenance: 'maintenance',
  close_facility: 'closed',
};

function AgentFeed({ entries, selectedPool }: { entries: AlertEntry[]; selectedPool: Pool }) {
  const sensorId = POOL_TO_SENSOR_ID[selectedPool];
  const poolEntries = sensorId ? entries.filter((e) => e.sensor_id === sensorId) : [];
  const otherEntries = sensorId ? entries.filter((e) => e.sensor_id !== sensorId) : entries;
  const display = [...poolEntries, ...otherEntries].slice(0, 15);

  if (!display.length) {
    return <p className={styles.feedEmpty}>No alerts for {selectedPool} — agent is monitoring</p>;
  }

  return (
    <div className={styles.feedList}>
      {display.map((e, i) => {
        const isCritical = e.action === 'close_facility' || e.severity === 'critical';
        const badgeClass = isCritical
          ? styles.badgeCritical
          : e.action === 'send_maintenance'
          ? styles.badgeMaintenance
          : e.isInit
          ? styles.badgeInit
          : styles.badgeWarning;
        const badgeText = isCritical ? 'critical' : (ACTION_LABEL[e.action] ?? e.action);
        const isOtherPool = !sensorId || e.sensor_id !== sensorId;
        return (
          <div key={i} className={styles.feedEntry}>
            <span className={`${styles.badge} ${badgeClass}`}>{badgeText}</span>
            <span className={styles.feedContent}>
              {e.time && e.time !== '—' && (
                <span className={styles.feedTime}>{e.time} </span>
              )}
              {e.message}
              {isOtherPool && (
                <span className={styles.feedPool}> [{SENSOR_ID_TO_NAME[e.sensor_id] ?? e.sensor_id}]</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function WaterPage() {
  const [selectedPool, setSelectedPool] = useState<Pool>('Main Pool');
  const [view, setView] = useState<'pools' | 'map' | 'infra'>('pools');

  const {
    poolOut, poolIn, seaData, deltaData,
    latestOut, latestIn, latestSea, latestDelta,
    loading, error, refresh, lastRefresh,
  } = useWaterData(selectedPool);

  const { alertFeed, wsConnected } = useAgentAlerts();

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <h1 className={styles.pageHeader}>Water Quality</h1>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewBtn} ${view === 'pools' ? styles.viewBtnActive : ''}`}
            onClick={() => setView('pools')}
          >
            Pools
          </button>
          <button
            className={`${styles.viewBtn} ${view === 'map' ? styles.viewBtnActive : ''}`}
            onClick={() => setView('map')}
          >
            Map
          </button>
          <button
            className={`${styles.viewBtn} ${view === 'infra' ? styles.viewBtnActive : ''}`}
            onClick={() => setView('infra')}
          >
            Infrastructure
          </button>
        </div>
      </div>

      {/* Infrastructure view */}
      {view === 'infra' && <WaterInfraTab />}

      {/* Map view */}
      {view === 'map' && (
        <iframe
          src="http://192.168.1.166:2223"
          className={styles.mapFrame}
          style={{ width: '100%', height: 'calc(100vh - 80px)', border: 'none' }}
          title="Water Monitoring Map"
        />
      )}

      {/* Pools view */}
      {view === 'pools' && (
        <>
          {/* Pool selector */}
          <div className={styles.poolSelector}>
            {POOLS.map((pool) => (
              <button
                key={pool}
                className={`${styles.poolBtn} ${selectedPool === pool ? styles.poolBtnActive : ''}`}
                onClick={() => setSelectedPool(pool)}
              >
                {pool}
              </button>
            ))}
          </div>

          {/* Refresh bar */}
          <div className={styles.refreshBar}>
            <span className={styles.refreshTime}>
              {loading
                ? 'Refreshing…'
                : lastRefresh
                ? `Updated ${lastRefresh.toLocaleTimeString()}`
                : 'Never refreshed'}
            </span>
            <div className={styles.statusDots}>
              <span className={styles.dot} style={{ background: wsConnected ? '#22c55e' : '#aaa' }} />
              <span style={{ color: wsConnected ? 'var(--color-green-text)' : '#aaa', fontSize: 11 }}>
                agent {wsConnected ? 'connected' : 'offline'}
              </span>
            </div>
            <button className={styles.refreshBtn} onClick={refresh}>↻ Refresh</button>
          </div>

          {error && <div className={styles.errorBanner}>⚠ {error}</div>}

          {/* Risk banner */}
          <RiskBanner entries={alertFeed} selectedPool={selectedPool} />

          {/* Sensor cards */}
          <div className={styles.cardGrid}>
            <div className={styles.sensorCard}>
              <div className={styles.cardLabel}>Outside · light intensity</div>
              <div className={styles.cardValue}>
                {latestOut != null ? latestOut.toFixed(1) : '—'}
                <span className={styles.cardUnit}> %</span>
              </div>
            </div>
            <div className={styles.sensorCard}>
              <div className={styles.cardLabel}>Inside · light intensity</div>
              <div className={styles.cardValue}>
                {latestIn != null ? latestIn.toFixed(1) : '—'}
                <span className={styles.cardUnit}> %</span>
              </div>
            </div>
            <div className={styles.sensorCard}>
              <div className={styles.cardLabel}>Sea Temperature</div>
              <div className={styles.cardValue}>
                {latestSea != null ? latestSea.toFixed(1) : '—'}
                <span className={styles.cardUnit}> °C</span>
              </div>
            </div>
            <div className={styles.sensorCard}>
              <div className={styles.cardLabel}>Inside / Outside gap (Δ)</div>
              <div className={styles.cardValue}>
                {latestDelta != null ? latestDelta.toFixed(1) : '—'}
                <span className={styles.cardUnit}> Δ</span>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className={styles.chartSection}>
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>{selectedPool} — Light Intensity</div>
              <div className={styles.chartSubtitle}>Inside & Outside overlaid · last 50 readings</div>
              <PoolChart poolOut={poolOut} poolIn={poolIn} />
            </div>
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Paphos Coast — Sea Temperature</div>
              <div className={styles.chartSubtitle}>Last 50 readings · °C</div>
              <SeaChart seaData={seaData} />
            </div>
          </div>

          <div className={styles.chartCardWide}>
            <div className={styles.chartTitle}>{selectedPool} — Inside / Outside Discrepancy (Δ)</div>
            <div className={styles.chartSubtitle}>|Outside − Inside| over time · delta-first analysis</div>
            <DeltaChart deltaData={deltaData} />
          </div>

          {/* Agent analysis feed */}
          <div className={styles.feedCard}>
            <div className={styles.feedHeader}>Agent Analysis</div>
            <AgentFeed entries={alertFeed} selectedPool={selectedPool} />
          </div>
        </>
      )}
    </div>
  );
}

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
import { useWaterInfraData } from '../../hooks/useWaterInfraData';
import WaterInfraMap from '../../components/WaterInfraMap';
import styles from './WaterInfraTab.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function fmtHour(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function badgeClass(severity: string | null): string {
  if (severity === 'low')    return styles.badgeLow;
  if (severity === 'medium') return styles.badgeMedium;
  if (severity === 'high')   return styles.badgeHigh;
  return styles.badgeUnknown;
}

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 300 } as const,
  plugins: { legend: { display: false }, tooltip: { enabled: true } },
  scales: {
    x: {
      ticks: { font: { size: 10 }, maxTicksLimit: 12, color: '#aaa' },
      grid: { color: '#f0f0f0' },
    },
    y: {
      ticks: { font: { size: 10 }, color: '#aaa' },
      grid: { color: '#f0f0f0' },
      title: { display: true, text: 'Litres', font: { size: 10 }, color: '#888' },
    },
  },
};

export default function WaterInfraTab() {
  const { topology, alerts, openEvents, resolvedEvents, throughput, loading, error, refresh, lastRefresh } =
    useWaterInfraData();

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [showResolved, setShowResolved] = useState(false);
  const toggleExpand = (id: number) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className={styles.tab}>
      {/* Refresh bar */}
      <div className={styles.refreshBar}>
        <span>
          {loading
            ? 'Loading…'
            : lastRefresh
            ? `Updated ${lastRefresh.toLocaleTimeString()}`
            : ''}
        </span>
        <button className={styles.refreshBtn} onClick={refresh}>↻ Refresh</button>
      </div>

      {error && <div className={styles.errorBanner}>⚠ {error}</div>}

      {/* Throughput chart */}
      <div className={styles.chartCard}>
        <div className={styles.chartTitle}>Network Throughput — Last 24 h</div>
        <div className={styles.chartSubtitle}>
          Estimated litres delivered per hour across all inlets
        </div>
        {!loading && throughput.length === 0 ? (
          <p className={styles.emptyMsg} style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0 }}>
            No throughput data for the past 24 h
          </p>
        ) : (
          <div style={{ height: 200 }}>
            <Line
              data={{
                labels: throughput.map((r) => fmtHour(r.hour)),
                datasets: [
                  {
                    label: 'Litres/h',
                    data: throughput.map((r) => r.total_liters ?? 0),
                    borderColor: '#378add',
                    backgroundColor: 'rgba(55,138,221,0.1)',
                    borderWidth: 2,
                    pointRadius: 2,
                    fill: true,
                    tension: 0.35,
                  },
                ],
              }}
              options={CHART_OPTS}
            />
          </div>
        )}
      </div>

      {/* Bottom row: events + map */}
      <div className={styles.bottomRow}>

        {/* Open events */}
        <div className={styles.eventsCard}>
          <div className={styles.eventsTitle}>
            Open Events{openEvents.length > 0 && ` (${openEvents.length})`}
          </div>
          {openEvents.length === 0 ? (
            <p className={styles.emptyMsg}>{loading ? '…' : 'No open events'}</p>
          ) : (
            <div className={styles.eventsList}>
              {openEvents.map((ev) => {
                const expanded = expandedIds.has(ev.id);
                return (
                  <div key={ev.id} className={styles.eventItem}>
                    <div className={styles.eventHeader}>
                      <span className={`${styles.badge} ${badgeClass(ev.severity)}`}>
                        {ev.severity ?? 'open'}
                      </span>
                      <span className={styles.eventTitle}>{ev.title}</span>
                    </div>
                    <div className={styles.eventComponent}>{ev.component_id}</div>
                    {ev.details && (
                      <>
                        <div className={expanded ? styles.eventDetailsExpanded : styles.eventDetails}>
                          {ev.details}
                        </div>
                        <button
                          className={styles.expandBtn}
                          onClick={() => toggleExpand(ev.id)}
                        >
                          {expanded ? 'Show less ▲' : 'Show more ▼'}
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {/* Resolved events toggle */}
          <button
            className={styles.resolvedToggle}
            onClick={() => setShowResolved((v) => !v)}
          >
            {showResolved ? '▲' : '▼'} Resolved ({resolvedEvents.length})
          </button>
          {showResolved && (
            <div className={styles.resolvedList}>
              {resolvedEvents.length === 0 ? (
                <p className={styles.emptyMsg}>No resolved events</p>
              ) : (
                resolvedEvents.map((ev) => {
                  const expanded = expandedIds.has(ev.id);
                  return (
                    <div key={ev.id} className={styles.resolvedItem}>
                      <div className={styles.eventHeader}>
                        <span className={`${styles.badge} ${badgeClass(ev.severity)}`}>
                          {ev.severity ?? '—'}
                        </span>
                        <span className={styles.eventTitle}>{ev.title}</span>
                      </div>
                      <div className={styles.eventComponent}>
                        {ev.component_id}
                        {ev.resolved_at && (
                          <span className={styles.resolvedAt}>
                            {' · resolved '}
                            {new Date(ev.resolved_at).toLocaleString('en-GB', {
                              month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      {ev.details && (
                        <>
                          <div className={expanded ? styles.eventDetailsExpanded : styles.eventDetails}>
                            {ev.details}
                          </div>
                          <button className={styles.expandBtn} onClick={() => toggleExpand(ev.id)}>
                            {expanded ? 'Show less ▲' : 'Show more ▼'}
                          </button>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Node map */}
        <div className={styles.mapCard}>
          <div className={styles.mapTitle}>Sensor Status Map</div>
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: '#3fb950' }} />
              Normal
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: '#d29922' }} />
              Low alert
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: '#f85149' }} />
              Med/High alert
            </div>
          </div>
          {topology ? (
            <WaterInfraMap topology={topology} alerts={alerts} />
          ) : (
            <p className={styles.emptyMsg}>{loading ? 'Loading map…' : 'No topology data'}</p>
          )}
        </div>

      </div>
    </div>
  );
}

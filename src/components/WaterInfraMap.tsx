import { useMemo } from 'react';
import type { WaterInfraTopology, InfraAlert } from '../hooks/useWaterInfraData';
import styles from './WaterInfraMap.module.css';

// ── Layout constants (same as operator webapp) ────────────────────────────────
const CELL_W = 200;
const CELL_H = 130;
const CELL_PAD_X = 35;
const CELL_PAD_Y = 50;
const SPACE_PAD = 16;
const MAP_MARGIN = 30;

interface SpaceLayout {
  col: number;
  row: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Pos {
  x: number;
  y: number;
}

function computeSpaceLayout(spaces: WaterInfraTopology['spaces']): Record<string, SpaceLayout> {
  const byFloor: Record<number, typeof spaces> = {};
  for (const s of spaces) {
    const f = s.floor ?? 0;
    (byFloor[f] = byFloor[f] || []).push(s);
  }
  const floors = Object.keys(byFloor).map(Number).sort((a, b) => b - a);
  const layout: Record<string, SpaceLayout> = {};
  let rowIdx = 0;
  for (const floor of floors) {
    let colIdx = 0;
    for (const s of byFloor[floor]) {
      const w = s.type === 'corridor' ? CELL_W * 1.6 : CELL_W;
      const x = MAP_MARGIN + colIdx * (CELL_W + CELL_PAD_X);
      const y = MAP_MARGIN + rowIdx * (CELL_H + CELL_PAD_Y);
      layout[s.id] = { col: colIdx, row: rowIdx, x, y, w, h: CELL_H };
      colIdx++;
    }
    rowIdx++;
  }
  return layout;
}

function computeAllJunctionPositions(
  junctions: WaterInfraTopology['junctions'],
  spaceLayout: Record<string, SpaceLayout>,
): Record<string, Pos> {
  const bySpace: Record<string, typeof junctions> = {};
  const noSpace: typeof junctions = [];
  for (const j of junctions) {
    const sid = j.space_ids[0];
    if (sid && spaceLayout[sid]) {
      (bySpace[sid] = bySpace[sid] || []).push(j);
    } else {
      noSpace.push(j);
    }
  }

  const positions: Record<string, Pos> = {};

  for (const [spaceId, jList] of Object.entries(bySpace)) {
    const s = spaceLayout[spaceId];
    const n = jList.length;
    const usableW = s.w - 2 * SPACE_PAD;
    const usableH = s.h - SPACE_PAD - 16;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    for (let i = 0; i < n; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions[jList[i].id] = {
        x: s.x + SPACE_PAD + (col + 0.5) * (usableW / cols),
        y: s.y + 16 + (row + 0.5) * (usableH / rows),
      };
    }
  }

  let maxX = 0;
  let maxY = 0;
  for (const s of Object.values(spaceLayout)) {
    maxX = Math.max(maxX, s.x + s.w + MAP_MARGIN);
    maxY = Math.max(maxY, s.y + s.h + MAP_MARGIN);
  }
  for (let i = 0; i < noSpace.length; i++) {
    positions[noSpace[i].id] = { x: MAP_MARGIN + i * 40, y: maxY + MAP_MARGIN };
  }

  return positions;
}

// ── Color helpers ─────────────────────────────────────────────────────────────

const JUNCTION_COLORS: Record<string, string> = {
  pump:    '#58a6ff',
  valve:   '#e3b341',
  faucet:  '#39c5cf',
  meter:   '#3fb950',
  t_joint: '#6e7681',
  elbow:   '#6e7681',
  inlet:   '#a371f7',
  outlet:  '#f0886b',
  pool:    '#378add',
};

function junctionColor(type: string): string {
  return JUNCTION_COLORS[type?.toLowerCase()] ?? '#6e7681';
}

function buildSeverityMap(alerts: InfraAlert[]): Record<string, 'low' | 'medium' | 'high'> {
  const rank = { low: 1, medium: 2, high: 3 } as const;
  const map: Record<string, 'low' | 'medium' | 'high'> = {};
  for (const a of alerts) {
    const existing = map[a.sensor_id];
    if (!existing || rank[a.severity] > rank[existing]) {
      map[a.sensor_id] = a.severity;
    }
  }
  return map;
}

function sensorBadgeColor(severity: 'low' | 'medium' | 'high' | undefined): string {
  if (!severity) return '#3fb950';
  if (severity === 'low') return '#d29922';
  return '#f85149';
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  topology: WaterInfraTopology;
  alerts: InfraAlert[];
}

export default function WaterInfraMap({ topology, alerts }: Props) {
  const { spaceLayout, junctionPositions, svgW, svgH } = useMemo(() => {
    const sl = computeSpaceLayout(topology.spaces);
    const jp = computeAllJunctionPositions(topology.junctions, sl);

    let maxX = 0;
    let maxY = 0;
    for (const s of Object.values(sl)) {
      maxX = Math.max(maxX, s.x + s.w + MAP_MARGIN);
      maxY = Math.max(maxY, s.y + s.h + MAP_MARGIN);
    }
    const noSpaceCount = topology.junctions.filter(
      (j) => !j.space_ids[0] || !sl[j.space_ids[0]],
    ).length;
    const extraH = noSpaceCount > 0 ? MAP_MARGIN + 40 : 0;

    return {
      spaceLayout: sl,
      junctionPositions: jp,
      svgW: Math.max(maxX, 300),
      svgH: maxY + extraH,
    };
  }, [topology]);

  const severityMap = useMemo(() => buildSeverityMap(alerts), [alerts]);

  const sensorsByComponent = useMemo(() => {
    const map: Record<string, typeof topology.sensors> = {};
    for (const s of topology.sensors) {
      (map[s.attached_to] = map[s.attached_to] || []).push(s);
    }
    return map;
  }, [topology.sensors]);

  return (
    <div className={styles.wrapper}>
      <svg
        className={styles.svg}
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
      >
        <defs>
          <marker id="wi-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#aaa" />
          </marker>
        </defs>

        {/* Spaces */}
        {topology.spaces.map((s) => {
          const sl = spaceLayout[s.id];
          if (!sl) return null;
          return (
            <g key={s.id}>
              <rect
                x={sl.x} y={sl.y} width={sl.w} height={sl.h}
                rx={8}
                fill={s.type === 'outdoor' ? '#f0f7e6' : '#f5f5f5'}
                stroke="#d0d0d0"
                strokeWidth={1}
              />
              <text
                x={sl.x + 8} y={sl.y + 12}
                fontSize={10} fill="#888" fontFamily="system-ui,sans-serif"
                stroke="white" strokeWidth={3} style={{ paintOrder: 'stroke fill' }}
              >
                {s.name}
              </text>
            </g>
          );
        })}

        {/* Pipes */}
        {topology.pipes.map((pipe) => {
          const from = junctionPositions[pipe.from_junction];
          const to = junctionPositions[pipe.to_junction];
          if (!from || !to) return null;
          const pipeSensors = sensorsByComponent[pipe.id] ?? [];
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          // Perpendicular offset for a gentle curve
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const curve = Math.min(len * 0.15, 24);
          const cpX = midX - (dy / len) * curve;
          const cpY = midY + (dx / len) * curve;
          return (
            <g key={pipe.id}>
              <path
                d={`M${from.x},${from.y} Q${cpX},${cpY} ${to.x},${to.y}`}
                stroke="#ccc" strokeWidth={2} fill="none"
                markerEnd="url(#wi-arrow)"
              />
              {pipeSensors.map((sen, idx) => {
                // Midpoint of quadratic bezier at t=0.5
                const bx = 0.25 * from.x + 0.5 * cpX + 0.25 * to.x;
                const by = 0.25 * from.y + 0.5 * cpY + 0.25 * to.y;
                return (
                  <rect
                    key={sen.id}
                    x={bx - 5 + idx * 13} y={by - 5}
                    width={10} height={10} rx={2}
                    fill={sensorBadgeColor(severityMap[sen.id])}
                  />
                );
              })}
            </g>
          );
        })}

        {/* Junctions */}
        {topology.junctions.map((j) => {
          const pos = junctionPositions[j.id];
          if (!pos) return null;
          const color = junctionColor(j.type);
          const juncSensors = sensorsByComponent[j.id] ?? [];
          return (
            <g key={j.id}>
              <circle cx={pos.x} cy={pos.y} r={10} fill={color} stroke="white" strokeWidth={1.5} />
              <text
                x={pos.x} y={pos.y + 1}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={8} fill="white" fontFamily="system-ui,sans-serif" fontWeight="bold"
              >
                {(j.type?.[0] ?? '?').toUpperCase()}
              </text>
              <text
                x={pos.x} y={pos.y + 18}
                textAnchor="middle"
                fontSize={8} fill="#555" fontFamily="system-ui,sans-serif"
                stroke="white" strokeWidth={3} style={{ paintOrder: 'stroke fill' }}
              >
                {j.name.length > 14 ? j.name.slice(0, 13) + '…' : j.name}
              </text>
              {juncSensors.map((sen, idx) => (
                <rect
                  key={sen.id}
                  x={pos.x + 8 + idx * 13} y={pos.y - 16}
                  width={10} height={10} rx={2}
                  fill={sensorBadgeColor(severityMap[sen.id])}
                />
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

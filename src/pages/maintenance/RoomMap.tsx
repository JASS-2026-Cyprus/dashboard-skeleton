import { useCallback, useRef } from 'react';
import type { Report } from './firebase';
import styles from './maintenance.module.css';

const ROOM_W = 60;
const ROOM_H = 40;

const CAT_COLORS: Record<string, string> = {
  trash: '#f97316',
  waste: '#f97316',
  fire: '#ef4444',
  smoke: '#ef4444',
  hazardous: '#ef4444',
  structural: '#a855f7',
  flooding: '#3b82f6',
  graffiti: '#6366f1',
  vandalism: '#6366f1',
};

function reportRoomCoords(r: Report): { x: number; y: number } | null {
  let x = r.roomX ?? null;
  let y = r.roomY ?? null;
  if (x == null && r.lat != null) {
    x = r.lng || 0;
    y = r.lat || 0;
  }
  if (x == null || y == null) return null;
  return { x: Math.max(0, Math.min(ROOM_W, x)), y: Math.max(0, Math.min(ROOM_H, y)) };
}

interface Props {
  reports: Report[];
  activeReportId?: string;
  waypoint: { x: number; y: number } | null;
  onSetWaypoint: (coords: { x: number; y: number }) => void;
  onSelectReport?: (id: string) => void;
}

export default function RoomMap({ reports, activeReportId, waypoint, onSetWaypoint, onSelectReport }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const findings = reports
    .map((r) => {
      const coords = reportRoomCoords(r);
      return coords ? { ...r, ...coords } : null;
    })
    .filter(Boolean) as (Report & { x: number; y: number })[];

  const getSvgPoint = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return null;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      return pt.matrixTransform(ctm.inverse());
    },
    [],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const pt = getSvgPoint(e);
      if (!pt) return;
      const x = Math.max(0, Math.min(ROOM_W, pt.x));
      const y = Math.max(0, Math.min(ROOM_H, ROOM_H - pt.y));
      onSetWaypoint({ x, y });
    },
    [getSvgPoint, onSetWaypoint],
  );

  // Door dimensions
  const doorW = 5;
  const doorCenter = ROOM_H / 2;
  const doorTop = doorCenter - doorW / 2;
  const doorBottom = doorCenter + doorW / 2;

  return (
    <div className={styles.roomMapWrap}>
      <div className={styles.roomMapTitle}>
        Room Map <span className={styles.roomMapDims}>{ROOM_W}×{ROOM_H} m</span>
      </div>
      <div className={styles.roomMapContainer}>
        <svg
          ref={svgRef}
          viewBox={`-4 -1 ${ROOM_W + 8} ${ROOM_H + 4}`}
          preserveAspectRatio="xMidYMid meet"
          onClick={handleClick}
          style={{ cursor: 'crosshair' }}
        >
          {/* Floor */}
          <rect x="0" y="0" width={ROOM_W} height={ROOM_H} fill="var(--color-bg-secondary)" />

          {/* Grid lines */}
          {Array.from({ length: ROOM_W / 10 + 1 }, (_, i) => i * 10).map((x) => (
            <line key={`gx${x}`} x1={x} y1={0} x2={x} y2={ROOM_H} stroke="var(--color-border)" strokeWidth="0.06"
              strokeDasharray={x % 20 === 0 ? 'none' : '0.5,0.5'} />
          ))}
          {Array.from({ length: ROOM_H / 10 + 1 }, (_, i) => i * 10).map((y) => (
            <line key={`gy${y}`} x1={0} y1={y} x2={ROOM_W} y2={y} stroke="var(--color-border)" strokeWidth="0.06"
              strokeDasharray={y % 20 === 0 ? 'none' : '0.5,0.5'} />
          ))}

          {/* Axis labels */}
          {Array.from({ length: ROOM_W / 10 + 1 }, (_, i) => i * 10).map((x) => (
            <text key={`lx${x}`} x={x} y={ROOM_H + 2} textAnchor="middle" fontSize="1.4"
              fill="var(--color-text-secondary)" fontFamily="system-ui">{x}</text>
          ))}
          {Array.from({ length: ROOM_H / 10 + 1 }, (_, i) => i * 10).map((y) => (
            <text key={`ly${y}`} x={-1.5} y={ROOM_H - y + 0.5} textAnchor="end" fontSize="1.4"
              fill="var(--color-text-secondary)" fontFamily="system-ui">{y}</text>
          ))}

          {/* Walls */}
          <rect x={0} y={0} width={ROOM_W} height={0.5} fill="#1a1a1a" />
          <rect x={0} y={ROOM_H - 0.5} width={ROOM_W} height={0.5} fill="#1a1a1a" />
          <rect x={0} y={0} width={0.5} height={ROOM_H} fill="#1a1a1a" />
          <rect x={ROOM_W - 0.5} y={0} width={0.5} height={doorTop} fill="#1a1a1a" />
          <rect x={ROOM_W - 0.5} y={doorBottom} width={0.5} height={ROOM_H - doorBottom} fill="#1a1a1a" />

          {/* Door arc */}
          <path
            d={`M${ROOM_W - 0.5},${doorTop} A${doorW},${doorW} 0 0,0 ${ROOM_W - 0.5 - doorW},${doorTop}`}
            fill="none" stroke="#1a1a1a" strokeWidth="0.12" strokeDasharray="0.4,0.3" opacity={0.5}
          />
          <text x={ROOM_W + 0.8} y={doorCenter + 0.5} fontSize="1.3" fill="var(--color-text-secondary)"
            fontFamily="system-ui" fontStyle="italic">Door</text>

          {/* Findings (report markers) */}
          {findings.map((f) => {
            const color = CAT_COLORS[f.category?.toLowerCase()] || '#6b7280';
            const isActive = f.id === activeReportId;
            const r = isActive ? 1.5 : 1;
            const sy = ROOM_H - f.y;
            return (
              <g
                key={f.id}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectReport?.(f.id);
                }}
              >
                <circle cx={f.x} cy={sy} r={r + 0.5} fill={color} opacity={0.2} />
                <circle cx={f.x} cy={sy} r={r} fill={color} stroke="white" strokeWidth="0.25" />
                {isActive && (
                  <circle cx={f.x} cy={sy} r={r + 1.2} fill="none" stroke={color}
                    strokeWidth="0.15" strokeDasharray="0.6,0.4" />
                )}
              </g>
            );
          })}

          {/* Waypoint marker */}
          {waypoint && (() => {
            const wx = waypoint.x;
            const wy = ROOM_H - waypoint.y;
            return (
              <g>
                <circle cx={wx} cy={wy} r={2} fill="var(--color-blue)" opacity={0.15}>
                  <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite" />
                </circle>
                <line x1={wx - 1.2} y1={wy} x2={wx + 1.2} y2={wy} stroke="var(--color-blue)" strokeWidth="0.2" />
                <line x1={wx} y1={wy - 1.2} x2={wx} y2={wy + 1.2} stroke="var(--color-blue)" strokeWidth="0.2" />
                <circle cx={wx} cy={wy} r={0.6} fill="var(--color-blue)" stroke="white" strokeWidth="0.15" />
              </g>
            );
          })()}
        </svg>
      </div>
      <div className={styles.roomMapCoords}>
        {waypoint
          ? `Target: (${waypoint.x.toFixed(1)}, ${waypoint.y.toFixed(1)}) m`
          : 'Click map to set drone waypoint'}
      </div>
    </div>
  );
}

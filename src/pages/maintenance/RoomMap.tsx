import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Report } from './firebase';
import styles from './maintenance.module.css';

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

const DEFAULT_CENTER: [number, number] = [34.775, 32.42]; // Cyprus
const DEFAULT_ZOOM = 13;

function reportLatLng(r: Report): [number, number] | null {
  if (r.lat != null && r.lng != null) return [r.lat, r.lng];
  return null;
}

function circleIcon(color: string, active: boolean): L.DivIcon {
  const size = active ? 18 : 12;
  const border = active ? `3px solid ${color}` : '2px solid white';
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:${border};
      box-shadow:0 0 ${active ? 8 : 4}px ${color}80;
    "></div>`,
  });
}

interface Props {
  reports: Report[];
  activeReportId?: string;
  waypoint: { x: number; y: number } | null;
  onSetWaypoint: (coords: { x: number; y: number }) => void;
  onSelectReport?: (id: string) => void;
}

export default function RoomMap({ reports, activeReportId, waypoint, onSetWaypoint, onSelectReport }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup>(L.layerGroup());
  const waypointRef = useRef<L.Marker | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    markersRef.current.addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      onSetWaypoint({ x: e.latlng.lng, y: e.latlng.lat });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update report markers
  useEffect(() => {
    const group = markersRef.current;
    group.clearLayers();

    for (const r of reports) {
      const pos = reportLatLng(r);
      if (!pos) continue;
      const color = CAT_COLORS[r.category?.toLowerCase()] || '#6b7280';
      const isActive = r.id === activeReportId;

      const marker = L.marker(pos, { icon: circleIcon(color, isActive) });
      marker.bindTooltip(r.title || r.category || 'Report', { direction: 'top', offset: [0, -8] });
      marker.on('click', () => onSelectReport?.(r.id));
      group.addLayer(marker);
    }
  }, [reports, activeReportId, onSelectReport]);

  // Update waypoint marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (waypointRef.current) {
      map.removeLayer(waypointRef.current);
      waypointRef.current = null;
    }

    if (waypoint) {
      const icon = L.divIcon({
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        html: `<div style="
          width:24px;height:24px;position:relative;
        ">
          <div style="
            position:absolute;inset:0;border-radius:50%;
            background:rgba(59,130,246,0.2);
            animation:pulse 2s ease-in-out infinite;
          "></div>
          <div style="
            position:absolute;top:8px;left:3px;right:3px;height:2px;
            background:#3b82f6;border-radius:1px;
          "></div>
          <div style="
            position:absolute;left:10px;top:2px;bottom:2px;width:2px;
            background:#3b82f6;border-radius:1px;
          "></div>
          <div style="
            position:absolute;top:8px;left:8px;width:6px;height:6px;
            border-radius:50%;background:#3b82f6;border:1.5px solid white;
          "></div>
        </div>`,
      });

      waypointRef.current = L.marker([waypoint.y, waypoint.x], { icon, interactive: false }).addTo(map);
    }
  }, [waypoint]);

  // Pan to active report when selected
  useEffect(() => {
    if (!mapRef.current || !activeReportId) return;
    const r = reports.find((rep) => rep.id === activeReportId);
    if (!r) return;
    const pos = reportLatLng(r);
    if (pos) mapRef.current.setView(pos, Math.max(mapRef.current.getZoom(), 15), { animate: true });
  }, [activeReportId, reports]);

  return (
    <div className={styles.roomMapWrap}>
      <div className={styles.roomMapTitle}>
        Location Map
      </div>
      <div ref={containerRef} style={{ height: 300, borderRadius: 8, overflow: 'hidden' }} />
      <div className={styles.roomMapCoords}>
        {waypoint
          ? `Target: ${waypoint.y.toFixed(5)}, ${waypoint.x.toFixed(5)}`
          : 'Click map to set drone waypoint'}
      </div>
    </div>
  );
}

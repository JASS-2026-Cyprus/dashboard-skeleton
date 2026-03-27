const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || '';

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

export interface SensorEvent {
  id: number;
  created_at: string;
  epoch: number;
  probability: number;
  pga_g: number;
  ax: number;
  ay: number;
  az: number;
  magnitude_g: number;
}

export interface DroneReport {
  id: number;
  created_at: string;
  event_id: string;
  epoch: number;
  lat: number;
  lon: number;
  severity: string;
  damage_type: string;
  building: string;
  description: string;
  drone_id: string;
  confidence: number;
}

export interface SensorStream {
  id: number;
  created_at: string;
  data: string;
}

export interface LiveData {
  x: number[];
  y: number[];
  z: number[];
  mag: number[];
  prob: number;
  label: string;
  pga: number;
  detections: number;
  samples: number;
  elapsed: number;
  prob_history: number[];
}

export async function fetchSensorEvents(limit = 20): Promise<SensorEvent[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/sensor_events?order=created_at.desc&limit=${limit}`,
    { headers }
  );
  return res.ok ? res.json() : [];
}

export async function fetchDroneReports(limit = 20): Promise<DroneReport[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/drone_reports?order=created_at.desc&limit=${limit}`,
    { headers }
  );
  return res.ok ? res.json() : [];
}

export async function fetchLiveStream(): Promise<LiveData | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/sensor_stream?order=created_at.desc&limit=1`,
    { headers }
  );
  if (!res.ok) return null;
  const rows: SensorStream[] = await res.json();
  if (!rows.length) return null;
  try {
    return JSON.parse(rows[0].data);
  } catch {
    return null;
  }
}

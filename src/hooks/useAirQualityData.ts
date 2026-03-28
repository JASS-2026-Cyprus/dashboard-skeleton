import { useQuery } from '@tanstack/react-query';

export interface AirQualityLatest {
  temperature: number;
  humidity: number;
  pressure: number;
  gas_resistance: number;
  altitude: number;
}

export interface AirQualityHistory {
  temperature: number[];
  humidity: number[];
  pressure: number[];
}

export interface AirQualityEvent {
  id: string;
  type: string;
  name: string;
  zone: string;
  start_date: string;
  end_date: string;
  active_hours: string;
  confidence_tier: string;
  signature: string;
  confidence_indicators: string[];
}

export interface AlertStatus {
  status: string;
  color: string;
  buzzer: boolean;
  message: string;
  updated_at: string | null;
}

export interface AirQualityData {
  latest: AirQualityLatest | null;
  history: AirQualityHistory;
  events: AirQualityEvent[];
  alertStatus: AlertStatus | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const FALLBACK_HISTORY: AirQualityHistory = { temperature: [], humidity: [], pressure: [] };
const backendUrl = "http://192.168.1.166:38000"

async function fetchSensorData(): Promise<{ latest: AirQualityLatest | null; history: AirQualityHistory }> {
  const res = await fetch(`${backendUrl}/api/sensor-data`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const readings: AirQualityLatest[] = await res.json();

  if (!readings.length) return { latest: null, history: FALLBACK_HISTORY };

  const last = readings[readings.length - 1];
  return {
    latest: {
      temperature:    last.temperature    ?? 0,
      humidity:       last.humidity       ?? 0,
      pressure:       last.pressure       ?? 0,
      gas_resistance: last.gas_resistance ?? 0,
      altitude:       last.altitude       ?? 0,
    },
    history: {
      temperature: readings.map(r => r.temperature    ?? 0),
      humidity:    readings.map(r => r.humidity       ?? 0),
      pressure:    readings.map(r => r.pressure       ?? 0),
    },
  };
}

async function fetchAlertStatus(): Promise<AlertStatus> {
  const res = await fetch(`${backendUrl}/api/alert-status`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchEvents(): Promise<AirQualityEvent[]> {
  const res = await fetch(`${backendUrl}/api/events/live`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data.events ?? []);
}

export function useAirQualityData(): AirQualityData {
  const { data: sensorData, isFetching, error, dataUpdatedAt } = useQuery({
    queryKey: ['airQuality', 'sensor-data'],
    queryFn: fetchSensorData,
    refetchInterval: 5_000,
    retry: false,
  });

  const { data: eventsData } = useQuery({
    queryKey: ['airQuality', 'events'],
    queryFn: fetchEvents,
    refetchInterval: 60_000,
    retry: false,
  });

  const { data: alertStatus } = useQuery({
    queryKey: ['airQuality', 'alert-status'],
    queryFn: fetchAlertStatus,
    refetchInterval: 5_000,
    retry: false,
  });

  return {
    latest:      sensorData?.latest   ?? null,
    history:     sensorData?.history  ?? FALLBACK_HISTORY,
    events:      eventsData           ?? [],
    alertStatus: alertStatus          ?? null,
    loading:     isFetching,
    error:       error ? (error as Error).message : null,
    lastUpdated: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ── Types ────────────────────────────────────────────────────────────────────

export interface Space {
  id: string;
  name: string;
  type: 'room' | 'corridor' | 'shaft' | 'outdoor';
  floor: number;
}

export interface Junction {
  id: string;
  name: string;
  type: string;
  space_ids: string[];
}

export interface PipeSegment {
  id: string;
  from_junction: string;
  to_junction: string;
}

export interface Sensor {
  id: string;
  type: string;
  unit: string;
  attached_to: string;
  attached_to_kind: 'junction' | 'pipe_segment';
}

export interface InfraAlert {
  id: number;
  sensor_id: string;
  component_id: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AgentEvent {
  id: number;
  title: string;
  status: string;
  severity: string | null;
  component_id: string;
  details: string;
  created_at: string;
  updated_at: string;
}

export interface ThroughputRow {
  hour: string;
  total_flow_lpm: number;
  total_liters: number;
}

export interface LatestReading {
  sensor_id: string;
  value: number;
  reading_ts: string;
}

export interface WaterInfraTopology {
  spaces: Space[];
  junctions: Junction[];
  pipes: PipeSegment[];
  sensors: Sensor[];
}

export interface WaterInfraData {
  topology: WaterInfraTopology | null;
  alerts: InfraAlert[];
  openEvents: AgentEvent[];
  throughput: ThroughputRow[];
  latestReadings: LatestReading[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastRefresh: Date | null;
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchTopology(): Promise<WaterInfraTopology> {
  const wi = supabase.schema('water_infra');

  const [spacesRes, junctionsRes, juncSpacesRes, pipesRes, sensorsRes] = await Promise.all([
    wi.from('spaces').select('id,name,type,floor'),
    wi.from('junctions').select('id,name,type'),
    wi.from('junction_spaces').select('junction_id,space_id'),
    wi.from('pipe_segments').select('id,from_junction,to_junction'),
    wi.from('sensors').select('id,type,unit,attached_to,attached_to_kind'),
  ]);

  if (spacesRes.error) throw new Error(spacesRes.error.message);
  if (junctionsRes.error) throw new Error(junctionsRes.error.message);
  if (juncSpacesRes.error) throw new Error(juncSpacesRes.error.message);
  if (pipesRes.error) throw new Error(pipesRes.error.message);
  if (sensorsRes.error) throw new Error(sensorsRes.error.message);

  const juncSpaceMap: Record<string, string[]> = {};
  for (const row of (juncSpacesRes.data ?? [])) {
    (juncSpaceMap[row.junction_id] = juncSpaceMap[row.junction_id] || []).push(row.space_id);
  }

  const junctions: Junction[] = (junctionsRes.data ?? []).map((j: { id: string; name: string; type: string }) => ({
    ...j,
    space_ids: juncSpaceMap[j.id] ?? [],
  }));

  return {
    spaces: spacesRes.data ?? [],
    junctions,
    pipes: pipesRes.data ?? [],
    sensors: sensorsRes.data ?? [],
  };
}

async function fetchAlerts(): Promise<InfraAlert[]> {
  const { data, error } = await supabase
    .schema('water_infra')
    .from('alerts')
    .select('id,sensor_id,component_id,severity')
    .eq('acknowledged', false);
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function fetchOpenEvents(): Promise<AgentEvent[]> {
  const { data, error } = await supabase
    .schema('water_infra')
    .from('agent_events')
    .select('id,title,status,severity,component_id,details,created_at,updated_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function fetchThroughput(): Promise<ThroughputRow[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.rpc('water_infra_hourly_throughput', { p_since: since });
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function fetchLatestReadings(): Promise<LatestReading[]> {
  const { data, error } = await supabase.rpc('water_infra_latest_readings');
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useWaterInfraData(): WaterInfraData {
  const [topology, setTopology] = useState<WaterInfraTopology | null>(null);
  const [alerts, setAlerts] = useState<InfraAlert[]>([]);
  const [openEvents, setOpenEvents] = useState<AgentEvent[]>([]);
  const [throughput, setThroughput] = useState<ThroughputRow[]>([]);
  const [latestReadings, setLatestReadings] = useState<LatestReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [topo, alrt, evts, thru, readings] = await Promise.all([
        fetchTopology(),
        fetchAlerts(),
        fetchOpenEvents(),
        fetchThroughput(),
        fetchLatestReadings(),
      ]);
      setTopology(topo);
      setAlerts(alrt);
      setOpenEvents(evts);
      setThroughput(thru);
      setLatestReadings(readings);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load infrastructure data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, [load]);

  return { topology, alerts, openEvents, throughput, latestReadings, loading, error, refresh: load, lastRefresh };
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Pool } from '../lib/waterConfig';

export interface Reading {
  timestamp: string;
  value: number;
}

export interface WaterData {
  poolOut: Reading[];
  poolIn: Reading[];
  seaData: Reading[];
  deltaData: Reading[];
  latestOut: number | null;
  latestIn: number | null;
  latestSea: number | null;
  latestDelta: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastRefresh: Date | null;
}

function computeDelta(poolOut: Reading[], poolIn: Reading[]): Reading[] {
  const n = Math.min(poolOut.length, poolIn.length);
  const out = poolOut.slice(poolOut.length - n);
  const ins = poolIn.slice(poolIn.length - n);
  return out.map((r, i) => ({
    timestamp: r.timestamp,
    value: Math.abs(r.value - ins[i].value),
  }));
}

function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}

export function useWaterData(selectedPool: Pool): WaterData {
  const [poolOut, setPoolOut] = useState<Reading[]>([]);
  const [poolIn, setPoolIn] = useState<Reading[]>([]);
  const [seaData, setSeaData] = useState<Reading[]>([]);
  const [deltaData, setDeltaData] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const doFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const LIMIT = 50;
      const [outRes, inRes, seaRes] = await Promise.all([
        supabase
          .from('pool_readings')
          .select('timestamp, value')
          .eq('location', selectedPool)
          .eq('sensor', 'outside')
          .eq('type', 'light_intensity')
          .order('timestamp', { ascending: false })
          .limit(LIMIT),
        supabase
          .from('pool_readings')
          .select('timestamp, value')
          .eq('location', selectedPool)
          .eq('sensor', 'inside')
          .eq('type', 'light_intensity')
          .order('timestamp', { ascending: false })
          .limit(LIMIT),
        supabase
          .from('weather_readings')
          .select('timestamp, value')
          .eq('location', 'Paphos Coast')
          .eq('type', 'sea_temperature')
          .order('timestamp', { ascending: false })
          .limit(LIMIT),
      ]);

      const pOut = ((outRes.data ?? []) as Reading[]).reverse();
      const pIn = ((inRes.data ?? []) as Reading[]).reverse();
      const sea = ((seaRes.data ?? []) as Reading[]).reverse();
      const delta = computeDelta(pOut, pIn);

      setPoolOut(pOut);
      setPoolIn(pIn);
      setSeaData(sea);
      setDeltaData(delta);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch error');
    } finally {
      setLoading(false);
    }
  }, [selectedPool]);

  useEffect(() => {
    doFetch();
    const interval = setInterval(doFetch, 60_000);
    return () => clearInterval(interval);
  }, [doFetch]);

  return {
    poolOut,
    poolIn,
    seaData,
    deltaData,
    latestOut: last(poolOut)?.value ?? null,
    latestIn: last(poolIn)?.value ?? null,
    latestSea: last(seaData)?.value ?? null,
    latestDelta: last(deltaData)?.value ?? null,
    loading,
    error,
    refresh: doFetch,
    lastRefresh,
  };
}

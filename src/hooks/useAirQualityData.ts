import { useState, useEffect, useCallback } from 'react';
import { getSubsystemBackendUrl } from '../config';

// ── Response shape from GET /api/air-quality-summary ─────────────────────────

export interface AirQualityLatest {
  pm25: number;
  pm10: number;
  no2: number;
  co2: number;
  co: number;
  temperature: number;
  humidity: number;
  pressure: number;
}

export interface AirQualityHistory24h {
  pm25: number[];
  no2: number[];
  co: number[];
}

export interface AnomalyInsight {
  hypothesis: string;
  risk_level: string;
  confidence: number;
}

export interface ForecastInsight {
  trend: string;
  risk_level: string;
  reasoning: string;
}

export interface AirQualityInsights {
  anomaly: AnomalyInsight;
  forecast: ForecastInsight;
}

export interface AirQualitySummary {
  latest: AirQualityLatest;
  history_24h: AirQualityHistory24h;
  insights: AirQualityInsights;
}

// ── Hook return type ──────────────────────────────────────────────────────────

export interface AirQualityData {
  latest: AirQualityLatest | null;
  history24h: AirQualityHistory24h | null;
  insights: AirQualityInsights | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastRefresh: Date | null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAirQualityData(): AirQualityData {
  const [latest, setLatest] = useState<AirQualityLatest | null>(null);
  const [history24h, setHistory24h] = useState<AirQualityHistory24h | null>(null);
  const [insights, setInsights] = useState<AirQualityInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const doFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const backendUrl = getSubsystemBackendUrl('air_quality');
      const response = await fetch(`${backendUrl}/api/air-quality-summary`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data: AirQualitySummary = await response.json();
      setLatest(data.latest);
      setHistory24h(data.history_24h);
      setInsights(data.insights);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    doFetch();
    const interval = setInterval(doFetch, 60_000);
    return () => clearInterval(interval);
  }, [doFetch]);

  return {
    latest,
    history24h,
    insights,
    loading,
    error,
    refresh: doFetch,
    lastRefresh,
  };
}

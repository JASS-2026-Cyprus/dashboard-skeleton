import { useState, useEffect } from 'react';

const BLACKBOARD_LOG_URL = '/proxy/blackboard/api/log';
const POLL_INTERVAL = 30_000;

export interface BlackboardSummary {
  overview: string;
  keywords: string[];
  key_concepts: string[];
  entry_count: number;
}

export function useBlackboardSummary() {
  const [summary, setSummary] = useState<BlackboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchSummary = async () => {
      try {
        const res = await fetch(BLACKBOARD_LOG_URL);
        if (!res.ok) return;
        const logs: string[] = await res.json();

        const prefix = 'blackboard_context_compressor: ';
        // Iterate from the end to find the latest compressor entry
        for (let i = logs.length - 1; i >= 0; i--) {
          const entry = logs[i];
          const idx = entry.indexOf(prefix);
          if (idx === -1) continue;
          const jsonStr = entry.slice(idx + prefix.length);
          try {
            const parsed: BlackboardSummary = JSON.parse(jsonStr);
            if (!cancelled) setSummary(parsed);
          } catch {
            // malformed JSON in this entry — try the next one
          }
          break;
        }
      } catch {
        // network error — keep previous value
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSummary();
    const id = setInterval(fetchSummary, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { summary, loading };
}

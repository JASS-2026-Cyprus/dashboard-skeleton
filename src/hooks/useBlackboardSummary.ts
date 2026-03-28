import { useState, useEffect } from 'react';

const BLACKBOARD_LOG_URL = '/proxy/blackboard/api/log';
const POLL_INTERVAL = 30_000;

/**
 * Schema expected from the blackboard_context_compressor log entry.
 *
 * The summary agent LLM should produce a JSON object that includes the
 * existing fields (overview, keywords, key_concepts, entry_count) PLUS
 * the following executive briefing fields:
 *
 *   status            — One short sentence (max 12 words) describing overall
 *                       city operational health. E.g. "All systems nominal" or
 *                       "Two active incidents in Zones 2 and 5".
 *
 *   severity          — "ok" | "warning" | "critical"
 *                       "ok"       = no issues
 *                       "warning"  = non-critical issues present
 *                       "critical" = urgent action needed
 *
 *   trend             — "stable" | "improving" | "escalating"
 *                       "stable"     = situation unchanged
 *                       "improving"  = issues resolving
 *                       "escalating" = getting worse
 *
 *   recommended_action — 1–2 short actionable sentences for the city manager,
 *                        or "No action required." (max 25 words total).
 *                        E.g. "Review drone report for Zone 3 structural damage."
 *
 *   active_alerts     — Array of up to 3 current alerts, each with:
 *                         team      — which monitoring team raised it
 *                                     (e.g. "Water", "Air", "Structural")
 *                         issue     — brief description, max 10 words
 *                                     (e.g. "Olympic Pool turbidity above threshold")
 *                         rationale — why it matters, max 15 words
 *                                     (e.g. "Clarity delta exceeded safe threshold for 2 hours")
 *                       Empty array when everything is normal.
 *
 * Full example output:
 * {
 *   "overview": "...",
 *   "keywords": [...],
 *   "key_concepts": [...],
 *   "entry_count": 42,
 *   "status": "Minor water quality issue in Zone 2 under investigation",
 *   "severity": "warning",
 *   "trend": "stable",
 *   "recommended_action": "Monitor Zone 2 pool water quality. No immediate closure needed.",
 *   "active_alerts": [
 *     {
 *       "team": "Water",
 *       "issue": "Olympic Pool turbidity above safe threshold",
 *       "rationale": "Clarity delta exceeded safe limit for 2 consecutive hours"
 *     }
 *   ]
 * }
 */
export interface BlackboardSummary {
  overview: string;
  keywords: string[];
  key_concepts: string[];
  entry_count: number;
  // Executive briefing fields — produced by the summary agent LLM:
  status?: string;
  severity?: 'ok' | 'warning' | 'critical';
  trend?: 'stable' | 'improving' | 'escalating';
  recommended_action?: string;
  active_alerts?: Array<{ team: string; issue: string; rationale: string }>;
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

import { useState, useEffect, useRef } from 'react';
import type { BlackboardSummary } from './useBlackboardSummary';

export interface ActiveAlert {
  team: string;
  issue: string;
  rationale: string;
}

export interface ExecutiveBriefing {
  status: string;
  severity: 'ok' | 'warning' | 'critical';
  trend: 'stable' | 'improving' | 'escalating';
  recommended_action: string;
  active_alerts: ActiveAlert[];
  updated_at: Date;
  entry_count: number;
}

const SYSTEM_PROMPT = `You are a city operations briefing assistant for CityScope, a city infrastructure monitoring dashboard. Given raw system log data, produce a concise executive briefing for a city manager. Respond ONLY with valid JSON matching this schema:
{
  "status": "one short sentence about overall city operational health",
  "severity": "ok" | "warning" | "critical",
  "recommended_action": "1-2 short sentences: what should the manager do right now, or 'No action required'",
  "trend": "stable" | "improving" | "escalating",
  "active_alerts": [{"team": "team name", "issue": "brief description", "rationale": "why this matters"}]
}
Rules:
- Be extremely concise. No jargon.
- status: max 12 words
- recommended_action: max 25 words
- active_alerts: max 3 items, each issue max 10 words, each rationale max 15 words
- severity: "ok" if no issues, "warning" if non-critical issues exist, "critical" if urgent action needed
- trend: "stable" if situation unchanged, "improving" if issues resolving, "escalating" if getting worse
- rationale: explain WHY this alert matters (e.g. "clarity delta exceeded safe threshold for 2 hours")
- If everything is normal, active_alerts should be an empty array`;

function buildUserPrompt(summary: BlackboardSummary): string {
  return `System data (${summary.entry_count} log entries):

Overview: ${summary.overview}

Keywords: ${summary.keywords.join(', ')}

Key concepts: ${summary.key_concepts.join('; ')}`;
}

async function callLlm(summary: BlackboardSummary): Promise<ExecutiveBriefing> {
  // Uses the same /api/vlm proxy as maintenance VLM — API key injected by Vite proxy
  const url = '/api/vlm/chat/completions';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'Qwen3-VL-8B-Instruct',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(summary) },
      ],
      temperature: 0.2,
      max_tokens: 300,
    }),
  });

  if (!res.ok) throw new Error(`LLM API error ${res.status}`);

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? '';

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in LLM response');

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    status: parsed.status || 'System status unavailable',
    severity: ['ok', 'warning', 'critical'].includes(parsed.severity) ? parsed.severity : 'ok',
    trend: ['stable', 'improving', 'escalating'].includes(parsed.trend) ? parsed.trend : 'stable',
    recommended_action: parsed.recommended_action || 'No action required.',
    active_alerts: Array.isArray(parsed.active_alerts)
      ? parsed.active_alerts.slice(0, 3).map((a: Record<string, string>) => ({
          team: a.team || 'Unknown',
          issue: a.issue || '',
          rationale: a.rationale || '',
        }))
      : [],
    updated_at: new Date(),
    entry_count: summary.entry_count,
  };
}

const FALLBACK: ExecutiveBriefing = {
  status: 'Monitoring active',
  severity: 'ok',
  trend: 'stable',
  recommended_action: 'No action required. Systems operating normally.',
  active_alerts: [],
  updated_at: new Date(),
  entry_count: 0,
};

export function useExecutiveBriefing(summary: BlackboardSummary | null, loading: boolean) {
  const [briefing, setBriefing] = useState<ExecutiveBriefing | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const lastEntryCount = useRef<number | null>(null);

  useEffect(() => {
    if (loading || !summary) return;
    // Only re-call LLM when entry_count changes
    if (lastEntryCount.current === summary.entry_count && briefing) return;
    lastEntryCount.current = summary.entry_count;

    let cancelled = false;
    setBriefingLoading(true);

    callLlm(summary)
      .then((result) => {
        if (!cancelled) setBriefing(result);
      })
      .catch(() => {
        // Fallback on error
        if (!cancelled) setBriefing(FALLBACK);
      })
      .finally(() => {
        if (!cancelled) setBriefingLoading(false);
      });

    return () => { cancelled = true; };
  }, [summary, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  return { briefing, briefingLoading };
}

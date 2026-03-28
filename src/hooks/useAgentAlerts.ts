import { useState, useEffect } from 'react';
import type { AlertEntry } from '../lib/waterConfig';
import { SENSOR_ID_TO_NAME } from '../lib/waterConfig';

const ALERTS_API = 'http://192.168.1.109:8000/status';

export interface AgentAlertsState {
  alertFeed: AlertEntry[];
  wsConnected: boolean;
}

export function useAgentAlerts(): AgentAlertsState {
  const [alertFeed, setAlertFeed] = useState<AlertEntry[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch(ALERTS_API);
        if (response.ok) {
          const data = await response.json() as { actions?: Record<string, string[]> };

          // Pre-existing active actions (sensor_actions state)
          const entries: AlertEntry[] = [];
          for (const [sid, acts] of Object.entries(data.actions ?? {})) {
            for (const act of acts as string[]) {
              entries.push({
                action:
                  act === 'alert'
                    ? 'post_alert'
                    : act === 'maintenance'
                    ? 'send_maintenance'
                    : 'close_facility',
                severity: act === 'closed' ? 'critical' : 'warning',
                message: `${SENSOR_ID_TO_NAME[sid] ?? sid} — active ${act}`,
                sensor_id: sid,
                time: '—',
                isInit: true,
              });
            }
          }
          setAlertFeed(entries);
          setWsConnected(true);
        } else {
          setWsConnected(false);
        }
      } catch {
        setWsConnected(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return { alertFeed, wsConnected };
}

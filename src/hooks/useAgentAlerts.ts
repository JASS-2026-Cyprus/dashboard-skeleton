import { useState, useEffect, useRef } from 'react';
import type { AlertEntry } from '../lib/waterConfig';

// The swarm agent calls send_alert() → POST /event on this server →
// broadcasts via WebSocket to all connected clients.
const DASHBOARD_WS = 'ws://192.168.1.166:2223/ws';

function fmtNow(): string {
  return new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export interface AgentAlertsState {
  alertFeed: AlertEntry[];
  wsConnected: boolean;
}

export function useAgentAlerts(): AgentAlertsState {
  const [liveFeed, setLiveFeed] = useState<AlertEntry[]>([]);
  const [initFeed, setInitFeed] = useState<AlertEntry[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  function connectWs() {
    const ws = new WebSocket(DASHBOARD_WS);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data as string);

        if (msg.type === 'init') {
          // Pre-existing active actions: {sensor_id: {warning?: expires, critical?: expires}}
          const entries: AlertEntry[] = [];
          for (const [sid, severities] of Object.entries(msg.actions ?? {})) {
            for (const sev of Object.keys(severities as Record<string, number>)) {
              const isCrit = sev === 'critical';
              entries.push({
                action: isCrit ? 'close_facility' : 'post_alert',
                severity: isCrit ? 'critical' : 'warning',
                message: `${sid} — active ${sev}`,
                sensor_id: sid,
                time: '—',
                isInit: true,
              });
            }
          }
          setInitFeed(entries);
        } else if (msg.type === 'action') {
          // Live alert from the water quality agent:
          // { type:"action", action:"post_alert", sensor_id:"Main Pool",
          //   severity:"warning"|"critical", message:"...", time:"HH:MM:SS" }
          const entry: AlertEntry = {
            action: msg.action,
            severity: msg.severity ?? (msg.action === 'close_facility' ? 'critical' : 'warning'),
            message: msg.message ?? msg.reason ?? '—',
            sensor_id: msg.sensor_id,
            time: msg.time ?? fmtNow(),
          };
          setLiveFeed((prev) => [entry, ...prev].slice(0, 50));
        }
      } catch {
        /* ignore parse errors */
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      reconnectTimer.current = setTimeout(connectWs, 5000);
    };

    ws.onerror = () => ws.close();
  }

  useEffect(() => {
    connectWs();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Live alerts first (newest first), then pre-existing init state at the end
  return {
    alertFeed: [...liveFeed, ...initFeed],
    wsConnected,
  };
}

// All pools that exist in Supabase pool_readings
export const POOLS = [
  'Bar Pool',
  'Indoor Pool 1',
  'Indoor Pool 2',
  'Infinity Pool',
  'Kids Pool',
  'Lap Pool',
  'Main Pool',
  'Olympic Pool',
  'Residential Pool 1',
  'Residential Pool 2',
  'Residential Pool 3',
  'Residential Pool 4',
  'Rooftop Pool',
  'Spa Pool',
] as const;

export type Pool = (typeof POOLS)[number];

// sensor_id in agent events equals the pool name directly (e.g. "Main Pool").
// All 14 pools are monitored by the water agent.

export interface AlertEntry {
  action: 'post_alert' | 'send_maintenance' | 'close_facility';
  severity: 'warning' | 'critical';
  message: string;
  sensor_id: string;
  time: string;
  isInit?: boolean;
}

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

// Only pools actively monitored by the swarm water agent have sensor IDs.
// Pools not listed here show data from Supabase but receive no agent alerts.
export const POOL_TO_SENSOR_ID: Partial<Record<Pool, string>> = {
  'Olympic Pool': 'pool_a',
  'Main Pool':    'pool_b',
  'Spa Pool':     'pool_c',
};

export const SENSOR_ID_TO_NAME: Record<string, string> = {
  pool_a: 'Olympic Pool',
  pool_b: 'Main Pool',
  pool_c: 'Spa Pool',
};

export interface AlertEntry {
  action: 'post_alert' | 'send_maintenance' | 'close_facility';
  severity: 'warning' | 'critical';
  message: string;
  sensor_id: string;
  time: string;
  isInit?: boolean;
}

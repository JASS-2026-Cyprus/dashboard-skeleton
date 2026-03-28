export interface AppConfig {
  subsystems: Record<string, { backendUrl: string }>;
}

let config: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig | null> {
  const response = await fetch('/config.json');
  if (!response.ok) throw new Error('Failed to load config');
  config = await response.json();
  return config;
}

export function getConfig(): AppConfig {
  if (!config) {
    throw new Error('Config not loaded. Call loadConfig() first.');
  }
  return config;
}

export function getSubsystemBackendUrl(subsystemName: string): string {
  const cfg = getConfig();
  const subsystem = cfg.subsystems[subsystemName];
  if (!subsystem) {
    throw new Error(`Subsystem "${subsystemName}" not configured`);
  }
  return subsystem.backendUrl;
}

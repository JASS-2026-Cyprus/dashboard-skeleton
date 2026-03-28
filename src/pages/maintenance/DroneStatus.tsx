import { useState, useEffect } from 'react';

// Hardcoded IP - easy to change
const DRONE_IP = '192.168.1.109';
const DRONE_PORT = '8000';


interface DroneStatusData {
  status: 'streaming' | 'no_stream' | 'offline';
  rtsp_url?: string | null;
  is_airborne?: boolean;
  current_position?: [number, number];
}

interface DroneInfo {
  connected: boolean;
  airborne: boolean;
  latitude: number | null;
  longitude: number | null;
}

export default function DroneStatus() {
  const [droneInfo, setDroneInfo] = useState<DroneInfo>({
    connected: false,
    airborne: false,
    latitude: null,
    longitude: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDroneStatus = async () => {
      try {
        setIsLoading(true);
        const url = `http://${DRONE_IP}:${DRONE_PORT}/status`;
        const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

        if (response.ok) {
          const data = (await response.json()) as DroneStatusData;
          console.log(data);
          setDroneInfo({
            connected: true,
            airborne: data.is_airborne ?? false,
            latitude: data.current_position ? data.current_position[0] : null,
            longitude: data.current_position ? data.current_position[1] : null,
          });
        } else {
          setDroneInfo({
            connected: false,
            airborne: false,
            latitude: null,
            longitude: null,
          });
        }
      } catch {
        setDroneInfo({
          connected: false,
          airborne: false,
          latitude: null,
          longitude: null,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDroneStatus();
    const interval = setInterval(fetchDroneStatus, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const isConnected = droneInfo.connected;
  const bgColor = isConnected ? '#f1f8e9' : '#f3f4f6';
  const borderColor = isConnected ? '#c6e9a8' : '#e5e7eb';
  const statusColor = isConnected ? '#558b2f' : '#6b7280';
  const dotColor = isConnected ? '#7cb342' : '#d1d5db';

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', marginTop: '1rem', textTransform: 'uppercase' }}>
        Drone Status
      </div>
      <div
        style={{
          background: bgColor,
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: dotColor,
              opacity: isLoading ? 0.6 : 1,
              flexShrink: 0,
            }}
          />
          <div style={{ fontSize: 18, fontWeight: 700, color: statusColor }}>
            {isLoading ? 'Checking...' : isConnected ? 'Connected' : 'Offline'}
          </div>
        </div>

        {isConnected && !isLoading && droneInfo.airborne && (
          <div style={{ fontSize: 13, fontWeight: 600, color: statusColor, lineHeight: 1.5 }}>
            {droneInfo.latitude !== null && droneInfo.longitude !== null && (
              <div>
                Lat: {droneInfo.latitude.toFixed(4)}, Lon: {droneInfo.longitude.toFixed(4)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

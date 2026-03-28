/**
 * Client for the Drone Mission API (mission_server.py).
 * Uses Vite dev proxy at /api/drone → localhost:8000.
 *
 * Three-step mission flow:
 *   1. goToLocation  — takeoff + navigate to target
 *   2. squarePattern — scan pattern at the location
 *   3. returnToBase  — fly home + land
 *
 * 200 = success (proceed). Non-200 = do not proceed.
 */

const BASE = '/api/drone';

export interface LocationResponse {
  status: string;
  message: string;
  executed_location?: [number, number] | null;
}

export interface SquareResponse {
  status: string;
  message: string;
  executed_square_size?: number | null;
}

export interface BaseResponse {
  status: string;
  message: string;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    let detail: string;
    try {
      const json = await res.json();
      detail = json.detail || json.message || `Error ${res.status}`;
    } catch {
      detail = await res.text();
    }
    throw new Error(detail);
  }

  return res.json();
}

export function goToLocation(location: [number, number]): Promise<LocationResponse> {
  return post('/go-to-location', { location });
}

export function squarePattern(squareSize: number = 1.0): Promise<SquareResponse> {
  return post('/square-pattern', { square_size: squareSize });
}

export function returnToBase(): Promise<BaseResponse> {
  return post('/return-to-base');
}

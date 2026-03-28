import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mbscfyikhkbvaotthcnm.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ic2NmeWlraGtidmFvdHRoY25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MzI2MjMsImV4cCI6MjA5MDAwODYyM30.pR3B-W1rkFJt_DY4UZ4d7lPVPp0AfadoOozcnH8audY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Earthquake Supabase (separate project) ──────────────────────────
const EQ_URL = 'https://wfjpiqdbqpiyiypvneio.supabase.co';
const EQ_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmanBpcWRicXBpeWl5cHZuZWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MzQ2NTcsImV4cCI6MjA5MDAxMDY1N30.7bTE1uUs1vISrO9he7vbDjz3pIAZ53XCVeBi-5rh520';

const eqHeaders = {
  apikey: EQ_KEY,
  Authorization: `Bearer ${EQ_KEY}`,
  'Content-Type': 'application/json',
};

export interface EqEvent {
  id: number;
  created_at: string;
  probability: number;
  pga_g: number;
}

export async function fetchEqEvents(limit = 10): Promise<EqEvent[]> {
  const res = await fetch(
    `${EQ_URL}/rest/v1/sensor_events?order=created_at.desc&limit=${limit}`,
    { headers: eqHeaders }
  );
  return res.ok ? res.json() : [];
}

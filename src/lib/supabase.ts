import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mbscfyikhkbvaotthcnm.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ic2NmeWlraGtidmFvdHRoY25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MzI2MjMsImV4cCI6MjA5MDAwODYyM30.pR3B-W1rkFJt_DY4UZ4d7lPVPp0AfadoOozcnH8audY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance = null;
try {
  supabaseInstance = createClient(
    supabaseUrl || 'https://tzejgnbmliuewmyadbff.supabase.co',
    supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6ZWpnbmJtbGl1ZXdteWFkYmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NzM0OTcsImV4cCI6MjA5NDM0OTQ5N30.8MvqeDIPk5B40XaDvrt2nBSrsSMzuzlTxR39pY_mw5o'
  );
} catch (e) {
  console.error('Supabase init error:', e);
}

export const supabase = supabaseInstance;

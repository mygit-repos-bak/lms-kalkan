import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Disable auth session persistence
    autoRefreshToken: false, // Disable token refresh
  }
});

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl !== 'undefined' &&
  supabaseKey !== 'undefined' &&
  supabaseUrl.startsWith('https://') &&
  supabaseKey.length > 20
);
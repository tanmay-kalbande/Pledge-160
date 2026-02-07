import { createClient } from '@supabase/supabase-js';

// Access environment variables securely
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Export client if keys exist, otherwise null
// We will handle the fallback logic in the data service
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const isSupabaseConfigured = !!supabase;

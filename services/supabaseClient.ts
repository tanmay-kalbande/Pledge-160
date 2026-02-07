import { createClient } from '@supabase/supabase-js';

// Access environment variables using Vite's import.meta.env
// Vercel env vars must be prefixed with VITE_ to be exposed to the client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Export client if keys exist, otherwise null
// We will handle the fallback logic in the data service
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const isSupabaseConfigured = !!supabase;

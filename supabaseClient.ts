import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables
// Safely access import.meta.env to prevent crashes if it's undefined or incorrectly polyfilled
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Only export client if keys exist
// This prevents the app from crashing if the user hasn't set up Supabase yet
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
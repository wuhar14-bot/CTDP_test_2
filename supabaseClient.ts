import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables
// Safely access import.meta.env to prevent crashes if it's undefined or incorrectly polyfilled
const env = (import.meta as any).env || {};

// Check env vars first, then local storage
// This allows users to input keys in the UI if they don't have access to .env
const supabaseUrl = env.VITE_SUPABASE_URL || (typeof localStorage !== 'undefined' ? localStorage.getItem('sb_url') : null);
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || (typeof localStorage !== 'undefined' ? localStorage.getItem('sb_key') : null);

// Only export client if keys exist
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
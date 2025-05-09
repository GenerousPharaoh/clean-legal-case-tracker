import supabaseClient from './services/supabaseClient';

// Wrapper to safely access storage URL
export function getStorageUrl(): string {
  return `${import.meta.env.VITE_SUPABASE_URL || ''}/storage/v1`;
}

export function getSupabaseKey(): string {
  // Safe way to access the Supabase key without direct property access
  return import.meta.env.VITE_SUPABASE_ANON_KEY || '';
}

export default supabaseClient; 
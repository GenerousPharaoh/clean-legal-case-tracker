import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const allowLocalStorageFallback = import.meta.env.VITE_ALLOW_LOCAL_STORAGE_FALLBACK === 'true';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key not found. Please check your environment variables.');
  throw new Error('Missing Supabase credentials');
}

// Create Supabase client with type safety
const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Use local storage as fallback when cookies fail (for local development)
    storageKey: allowLocalStorageFallback ? 'supabase.auth.token' : undefined,
    storage: allowLocalStorageFallback ? localStorage : undefined
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js/2.x',
    },
    // Simplified fetch handler - removed complex CORS handling that could cause overhead
    fetch: (url, options = {}) => {
      // Prevent fetch during unload events
      if (document.readyState === 'unloading') {
        return Promise.reject(new Error('Page is unloading'));
      }
      
      // Log authentication attempts in development
      if (import.meta.env.DEV) {
        if (typeof url === 'string' && url.includes('/auth/')) {
          console.log('Auth request:', url);
        }
      }
      
      return fetch(url, options);
    }
  }
});

// Helper function to refresh data manually
export const manualRefresh = {
  files: async (projectId: string) => {
    try {
      const { data, error } = await supabaseClient
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .order('added_at', { ascending: false });
        
      if (error) throw error;
      
      // Always ensure we return an array
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error manually refreshing files:', error);
      return [];
    }
  }
};

export default supabaseClient; 
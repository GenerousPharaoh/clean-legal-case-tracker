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

// Log the Supabase URL being used (for debugging)
console.log('Using Supabase URL:', supabaseUrl);

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
  realtime: {
    params: {
      eventsPerSecond: 5
    },
    encode: (payload) => JSON.stringify(payload),
    decode: (payload) => JSON.parse(payload),
    reconnectAfterMs: (retryCount) => Math.min(1000 * (retryCount + 1), 10000),
    heartbeatIntervalMs: 15000
  },
  // Add global error handler
  global: {
    headers: {
      // Add required headers for CORS
      'X-Client-Info': 'supabase-js/2.x',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    fetch: (...args) => {
      // Log authentication attempts in development
      if (import.meta.env.DEV) {
        const [resource, config] = args;
        if (typeof resource === 'string' && resource.includes('/auth/')) {
          console.log('Auth request:', resource);
        }
      }
      
      // Enhanced fetch with CORS settings
      const [resource, options = {}] = args;
      const fetchOptions = {
        ...options,
        credentials: 'include',
        mode: 'cors',
        headers: {
          ...options.headers,
        }
      };
      
      return fetch(resource, fetchOptions).catch(err => {
        console.error('Network error:', err);
        throw err;
      });
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
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types/supabase';

// Type definition for window augmentation
declare global {
  interface Window {
    __SUPABASE_CLIENT__?: any;
    __DEBUGGING_AUTH__?: boolean;
    __SUPABASE_LISTENER__?: boolean;
  }
}

// Enable auth debugging in development
const DEBUG_AUTH = true;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials are missing in environment variables!');
}

// Determine if we're in a production environment
const isProduction = import.meta.env.PROD;
const isSSR = typeof window === 'undefined';
const isLocalhost = !isSSR && window.location.hostname === 'localhost';

// Get base URL for redirects
const port = import.meta.env.PORT || 8000;
const baseUrl = isSSR 
  ? 'https://legal-case-tracker-one.vercel.app' // Default to Vercel URL for SSR
  : (isLocalhost 
      ? `http://localhost:${port}` // Use environment port or default to 8000
      : window.location.origin);

// Track consecutive refresh failures
let refreshFailureCount = 0;
const MAX_REFRESH_FAILURES = 3;
let lastRefreshAttempt = 0;
const REFRESH_COOLDOWN = 10000; // 10 seconds
const RETRY_DELAY = 1000; // 1 second between retries

// Create options object with auto-refresh and better error handling
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // For OAuth flows, we need to be explicit about the redirect URL
    flowType: 'pkce', // Use PKCE flow for best security
    storageKey: 'sb-auth-token', // Consistent key name
    storage: {
      getItem: (key: string) => {
        try {
          if (isSSR) return null;
          const item = localStorage.getItem(key);
          if (DEBUG_AUTH) console.log(`[Auth Storage] Reading key: ${key}`, item ? 'found' : 'not found');
          return item;
        } catch (error) {
          console.error('[Auth Storage] Error reading from localStorage:', error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          if (isSSR) return;
          if (DEBUG_AUTH) console.log(`[Auth Storage] Setting key: ${key}`, value ? 'with value' : 'empty');
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('[Auth Storage] Error writing to localStorage:', error);
        }
      },
      removeItem: (key: string) => {
        try {
          if (isSSR) return;
          if (DEBUG_AUTH) console.log(`[Auth Storage] Removing key: ${key}`);
          localStorage.removeItem(key);
        } catch (error) {
          console.error('[Auth Storage] Error removing from localStorage:', error);
        }
      },
    },
    // Always use the current origin for redirects plus auth callback path
    redirectTo: `${baseUrl}/auth/callback`,
  },
  global: {
    // Enhanced fetch with timeout and error handling
    fetch: (url: string, options: RequestInit) => {
      // Create an AbortController to handle timeouts
      const controller = new AbortController();
      const { signal } = controller;
      
      // Set timeout (120 seconds for file operations)
      const isFileOperation = url.includes('storage') || url.includes('object');
      const timeout = isFileOperation ? 120000 : 30000;
      
      // Set the timeout
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Check network status
      if (!isSSR && !navigator.onLine) {
        return Promise.reject(new Error('You are currently offline. Please check your internet connection.'));
      }
      
      // Perform the fetch with the abort signal
      return fetch(url, { 
        ...options, 
        signal,
      }).finally(() => {
        clearTimeout(timeoutId);
      }).catch(error => {
        if (error.name === 'AbortError') {
          throw new Error(`Request timed out after ${timeout/1000} seconds. Please try again later.`);
        }
        throw error;
      });
    },
  },
  debug: !isProduction || isLocalhost, // Enable debug mode in development
};

console.log('[Supabase Client] Initializing with URL:', supabaseUrl ? 'Found' : 'Not found');
console.log('[Supabase Client] Initializing with Key:', supabaseKey ? 'Found' : 'Not found');
console.log('[Supabase Client] Environment:', isProduction ? 'Production' : 'Development');
console.log('[Supabase Client] Auth flow:', options.auth.flowType);
console.log('[Supabase Client] Redirect URL:', options.auth.redirectTo);

// Create a singleton instance of the Supabase client
// This prevents multiple GoTrueClient instances
let supabaseInstance: ReturnType<typeof createClient> | null = null;

// Function to create or return the Supabase client
const createSupabaseClient = () => {
  // If we already have a client instance, return it
  if (supabaseInstance) {
    console.log('[Supabase Client] Reusing existing client instance');
    return supabaseInstance;
  }
  
  // Create a new client
  console.log('[Supabase Client] Creating a new client instance');
  supabaseInstance = createClient<Database>(supabaseUrl, supabaseKey, options);
  
  // Add centralized auth state listener that updates the auth store directly
  if (!isSSR && !window.__SUPABASE_LISTENER__) {
    console.log('[Supabase Client] Setting up centralized auth listener');
    
    supabaseInstance.auth.onAuthStateChange((event, session) => {
      // Import store directly to avoid circular dependencies
      // Dynamic require causing error in browser environment
      let authStore: any = null;
      
      // Use dynamic import instead of require
      import('./store/store').then(module => {
        authStore = module.useAuthStore;
        const { setSession, setUser, clearUser } = authStore.getState();
        
        console.log(`[Supabase Auth] Auth state changed: ${event}`, session ? 'Session exists' : 'No session');
        
        if (event === 'SIGNED_IN' && session) {
          console.log('[Supabase Auth] User signed in successfully');
          setSession(session);
          setUser(session?.user ? {
            id: session.user.id,
            email: session.user.email || '',
          } : null);
          
          // Reset refresh failure counter when signed in successfully
          refreshFailureCount = 0;
          
          // Dispatch an event for components to know auth state changed
          window.dispatchEvent(new CustomEvent('supabase-signed-in', { detail: { session } }));
        } else if (event === 'SIGNED_OUT') {
          console.log('[Supabase Auth] User signed out');
          clearUser(); // Clear both session and user
          
          // Clean up any potentially corrupted token data
          try {
            localStorage.removeItem(options.auth.storageKey);
          } catch (e) {
            console.error('[Supabase Auth] Failed to clean up storage on sign out', e);
          }
          
          // Dispatch an event for components to know auth state changed
          window.dispatchEvent(new CustomEvent('supabase-signed-out'));
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('[Supabase Auth] Token refreshed successfully');
          setSession(session);
          
          // Reset refresh failure counter when token refreshed successfully
          refreshFailureCount = 0;
          
          // Dispatch an event for components to know token was refreshed
          window.dispatchEvent(new CustomEvent('supabase-token-refreshed', { detail: { session } }));
        } else if (event === 'USER_UPDATED') {
          console.log('[Supabase Auth] User data updated');
          setSession(session);
          if (session?.user) {
            setUser(prev => ({
              ...prev,
              id: session.user.id,
              email: session.user.email || ''
            }));
          }
          
          // Dispatch an event for components to know user data changed
          window.dispatchEvent(new CustomEvent('supabase-user-updated', { detail: { session } }));
        }
      }).catch(error => {
        console.error('[Supabase Auth] Error importing auth store:', error);
      });
    });
    
    // Mark that we've set up the listener
    window.__SUPABASE_LISTENER__ = true;
  }
  
  // Attach to window for debugging
  if (!isSSR && (DEBUG_AUTH || !isProduction)) {
    window.__SUPABASE_CLIENT__ = supabaseInstance;
  }
  
  return supabaseInstance;
};

export const supabase = createSupabaseClient();

// Initialize the auth store with the session on app boot
if (!isSSR) {
  console.log('[Supabase Client] Initializing auth store with session');
  
  // Import here to avoid circular dependencies
  import('./store/store').then(({ useAuthStore }) => {
    const { setSession, setUser, setLoading } = useAuthStore.getState();
    
    // Set loading state while we check for a session
    setLoading(true);
    
    // Get the session and update the store
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
        
        // Optional: Fetch user profile data and update store
        // This would typically include role, name, etc.
      } else {
        setUser(null);
      }
      
      // Mark loading as complete
      setLoading(false);
    }).catch(error => {
      console.error('[Supabase Client] Error initializing auth store:', error);
      setLoading(false);
    });
  }).catch(error => {
    console.error('[Supabase Client] Error importing auth store:', error);
  });
}

// Force clearing any URL fragments to prevent issues in hash-based routing
if (!isSSR && window.location.hash && !window.location.hash.startsWith('#/')) {
  console.log('[Supabase Client] Clearing URL hash fragment:', window.location.hash);
  setTimeout(() => {
    // Only clear non-route hashes
    if (window.location.hash && !window.location.hash.startsWith('#/')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, 100);
}

// Helper function to determine if we have an active session
export const hasActiveSession = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[supabaseClient] Error checking session:', error.message);
      return false;
    }
    
    return !!data.session && new Date(data.session.expires_at * 1000) > new Date();
  } catch (error) {
    console.error('[supabaseClient] Unexpected error checking session:', error);
    return false;
  }
};

// Helper to refresh session token with exponential backoff and circuit breaker
export const refreshSession = async (): Promise<boolean> => {
  const now = Date.now();
  
  // Avoid excessive refresh attempts
  if (now - lastRefreshAttempt < REFRESH_COOLDOWN) {
    console.warn('[Supabase Client] Refresh attempted too soon, in cooldown period');
    return false;
  }
  
  // Check if we've hit the circuit breaker
  if (refreshFailureCount >= MAX_REFRESH_FAILURES) {
    console.error(`[Supabase Client] Too many refresh failures (${refreshFailureCount}), stopping attempts`);
    // Dispatch an event for components to know refresh is failing
    if (!isSSR) {
    window.dispatchEvent(new CustomEvent('supabase-refresh-circuit-broken'));
    }
    return false;
  }
  
  // Update refresh attempt timestamp
  lastRefreshAttempt = now;
  
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('[supabaseClient] Error refreshing session:', error.message);
      refreshFailureCount++;
      return false;
    }
    
    return !!data.session;
  } catch (error) {
    console.error('[supabaseClient] Unexpected error refreshing session:', error);
    refreshFailureCount++;
    return false;
  }
};

// Helper function for delayed retry
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Error response type for Supabase responses
type ErrorResponse = {
  error: {
    status?: number;
    code?: string;
    message?: string;
  }
};

// Function to determine if a response has an auth error
const hasAuthError = (result: any): boolean => {
  if (!result || !result.error) return false;
  
  const { status, message, code } = result.error;
  
  return (
    status === 401 || 
    code === 'PGRST116' ||
    (message && (
      message.includes('JWT expired') || 
      message.includes('invalid token') || 
      message.includes('not authenticated') ||
      message.includes('Invalid JWT')
    ))
  );
};

// Detect connection status and attempt to recover
if (!isSSR) {
window.addEventListener('online', async () => {
  console.log('[Supabase Client] Network connection restored');
  // Try to refresh session when connection is restored
  if (await hasActiveSession()) {
    refreshSession();
  }
});
}

// Proxy the Supabase client to add automatic retry for 401 errors
export const getClientWithAutoRetry = () => {
  // Create a proxy to intercept Supabase method calls
  const proxy = new Proxy(supabase, {
    get(target, prop, receiver) {
      // Get the original property
      const originalValue = Reflect.get(target, prop, receiver);

      // If it's not a function or we're accessing auth directly, just return it
      if (typeof originalValue !== 'function' || prop === 'auth') {
        return originalValue;
      }

      // Return a function that wraps the original
      return async function(...args: any[]) {
        try {
          // Call the original method
          const result = await originalValue.apply(target, args);

          // Check if we got an auth error
          if (hasAuthError(result)) {
            console.warn(`[Auto-retry] Auth error detected: ${result.error.message || 'Unknown auth error'}`);

            // Try to refresh the token
            const refreshSucceeded = await refreshSession();
            
            if (!refreshSucceeded) {
              console.error('[Auto-retry] Token refresh failed, returning original error');
              return result;
            }
            
            // Add some delay before retry to ensure token propagation
            await sleep(RETRY_DELAY);
            
            console.log('[Auto-retry] Token refreshed, retrying request');
            
            // Retry the original request with the new token
            return await originalValue.apply(target, args);
          }
          
          // Return the original result if no auth error or token was refreshed successfully
          return result;
        } catch (error) {
          console.error('[Auto-retry] Unexpected error:', error);
          throw error;
        }
      };
    }
  });

  return proxy as SupabaseClient<Database>;
};

export default supabase;
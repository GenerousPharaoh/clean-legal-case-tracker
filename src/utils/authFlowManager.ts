/**
 * authFlowManager.ts
 * 
 * This utility provides a more robust auth flow to prevent issues during
 * authentication state changes and navigation.
 */
import { supabase } from '../supabaseClient';
import { ErrorCategory, reportError } from './authErrorHandler';

/**
 * Manages safe navigation during authentication flows
 */
export const initAuthFlowManager = (): void => {
  try {
    console.log('[AuthFlowManager] Initializing auth flow manager...');

    if (typeof window === 'undefined') return;

    // Flag to track if we're currently handling an auth state change
    let isAuthStateChanging = false;
    
    // Track the number of auth state changes to detect potential issues
    let authStateChangeCount = 0;
    const AUTH_STATE_CHANGE_THRESHOLD = 5;
    const AUTH_STATE_CHANGE_WINDOW = 5000; // 5 seconds
    
    // Cache the auth status to prevent redundant checks
    let lastAuthCheck = 0;
    const AUTH_CHECK_COOLDOWN = 2000; // 2 seconds
    
    // Listen for auth state changes to prevent rapid re-renders
    const safeAuthStateChange = (callback: (event: string) => void) => {
      if (isAuthStateChanging) {
        console.log('[AuthFlowManager] Auth state change already in progress, deferring');
        setTimeout(() => safeAuthStateChange(callback), 500);
        return;
      }
      
      isAuthStateChanging = true;
      
      // Increment the counter and check for potential issues
      authStateChangeCount++;
      setTimeout(() => {
        authStateChangeCount = Math.max(0, authStateChangeCount - 1);
      }, AUTH_STATE_CHANGE_WINDOW);
      
      // If we're seeing too many auth state changes, something might be wrong
      if (authStateChangeCount > AUTH_STATE_CHANGE_THRESHOLD) {
        console.warn(`[AuthFlowManager] Detected ${authStateChangeCount} auth state changes in ${AUTH_STATE_CHANGE_WINDOW}ms`);
      }
      
      // Execute the callback
      try {
        callback('AUTH_STATE_CHANGE');
      } catch (error) {
        console.error('[AuthFlowManager] Error in auth state change callback:', error);
      } finally {
        // Release the lock after a short delay to prevent rapid state changes
        setTimeout(() => {
          isAuthStateChanging = false;
        }, 500);
      }
    };
    
    // Handle login redirects safely
    const safeLoginRedirect = (redirectUrl: string) => {
      console.log(`[AuthFlowManager] Safely redirecting to: ${redirectUrl}`);
      
      // Clean up any pending operations
      const highestTimeout = window.setTimeout(() => {}, 0);
      for (let i = 0; i < highestTimeout; i++) {
        window.clearTimeout(i);
      }
      
      // Clean up potential memory leaks
      try {
        // Remove most event listeners
        const events = ['click', 'keydown', 'mousemove', 'resize', 'scroll'];
        for (const event of events) {
          window.removeEventListener(event, () => {});
        }
      } catch (e) {
        // Ignore errors in cleanup
      }
      
      // Perform the redirect
      window.location.href = redirectUrl;
    };
    
    // Add a safe navigation method to window
    (window as any).safeNavigate = safeLoginRedirect;
    
    // Helper to safely check auth status with debouncing
    const checkAuthStatus = async (): Promise<{isAuthenticated: boolean, userId?: string}> => {
      const now = Date.now();
      if (now - lastAuthCheck < AUTH_CHECK_COOLDOWN) {
        console.log('[AuthFlowManager] Auth check on cooldown, using cached result');
        return { 
          isAuthenticated: !!(window as any).__AUTH_STATUS__?.isAuthenticated,
          userId: (window as any).__AUTH_STATUS__?.userId
        };
      }
      
      lastAuthCheck = now;
      
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[AuthFlowManager] Error checking session:', error);
          return { isAuthenticated: false };
        }
        
        const isAuthenticated = !!data.session;
        const userId = data.session?.user?.id;
        
        // Cache the result
        (window as any).__AUTH_STATUS__ = { isAuthenticated, userId };
        
        return { isAuthenticated, userId };
      } catch (error) {
        console.error('[AuthFlowManager] Unexpected error checking session:', error);
        return { isAuthenticated: false };
      }
    };
    (window as any).checkAuthStatus = checkAuthStatus;
    
    // Instrument navigation events to prevent issues during auth flows
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      try {
        // Check if this is a sensitive navigation during auth
        const url = args[2] as string;
        if (url && (url.includes('/auth/') || url.includes('/login') || url.includes('/signup'))) {
          console.log(`[AuthFlowManager] Sensitive navigation detected to: ${url}`);
          
          // Clean up before navigating
          safeAuthStateChange(() => {
            originalPushState.apply(this, args);
          });
          return;
        }
      } catch (e) {
        console.error('[AuthFlowManager] Error in pushState override:', e);
      }
      
      // Default behavior
      return originalPushState.apply(this, args);
    };
    
    // Create a global auth error recovery function
    (window as any).recoverFromAuthError = () => {
      console.log('[AuthFlowManager] Attempting to recover from auth error');
      
      try {
        // Clear any stored auth tokens
        localStorage.removeItem('sb-auth-token');
        sessionStorage.removeItem('auth_error');
        
        // Report the error
        reportError(
          'Authentication error recovered',
          ErrorCategory.AUTH,
          'Automatically recovered from authentication error.'
        );
        
        // Navigate to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      } catch (e) {
        console.error('[AuthFlowManager] Error in auth recovery:', e);
        // Last resort
        window.location.href = '/login';
      }
    };
    
    console.log('[AuthFlowManager] Auth flow manager initialized successfully');
  } catch (error) {
    console.error('[AuthFlowManager] Failed to initialize auth flow manager:', error);
  }
};

export default initAuthFlowManager;

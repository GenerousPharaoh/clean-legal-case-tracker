import { supabase } from '../supabaseClient';
import { useAuthStore } from '../store/store';
import { reportError, ErrorCategory, isAuthError } from './authErrorHandler';

interface ApiOptions {
  noAuth?: boolean;
  retries?: number;
  requirePermission?: string; // Optional permission to check
}

// Get store instance for direct state access
const authStore = useAuthStore;

// Check if token needs refresh (older than 55 minutes)
const isTokenExpired = (): boolean => {
  const lastRefresh = authStore.getState().lastTokenRefresh;
  if (!lastRefresh) return true;
  
  const now = new Date();
  const refreshTime = new Date(lastRefresh);
  const diffMinutes = (now.getTime() - refreshTime.getTime()) / (1000 * 60);
  
  // If token is older than 55 minutes, consider it expired (Supabase tokens last 60 min)
  return diffMinutes > 55;
};

/**
 * A wrapper for API calls that handles authentication and retries
 * 
 * This function:
 * 1. Checks and refreshes auth token if needed
 * 2. Executes the API call
 * 3. Handles auth errors with retries
 * 4. Reports errors appropriately
 */
export async function apiCall<T>(
  apiFn: () => Promise<T>,
  options: ApiOptions = {}
): Promise<T> {
  const { noAuth = false, retries = 1, requirePermission } = options;
  
  try {
    // Check permission if required
    if (requirePermission) {
      if (!authStore.getState().hasPermission(requirePermission)) {
        console.error(`[API] Permission denied: ${requirePermission}`);
        throw new Error(`You don't have permission to perform this action (${requirePermission})`);
      }
    }
    
    // For auth-required endpoints, check if token needs refresh
    if (!noAuth && isTokenExpired()) {
      console.log('[API] Token expired, attempting refresh');
      const refreshSuccess = await authStore.getState().refreshToken();
      if (!refreshSuccess) {
        console.error('[API] Token refresh failed');
        throw new Error('Your session has expired. Please log in again.');
      }
      console.log('[API] Token refreshed successfully');
    }
    
    // Execute the actual API call
    return await apiFn();
  } catch (error: any) {
    console.error('[API] Call failed:', error);
    
    // Handle auth errors
    if (isAuthError(error)) {
      // If this was a permission error and we haven't already retried
      if (retries > 0) {
        console.log('[API] Auth error detected, attempting token refresh...');
        // Try to refresh the token
        const refreshSuccess = await authStore.getState().refreshToken();
        
        if (refreshSuccess) {
          console.log('[API] Token refreshed, retrying call...');
          // Retry the API call with reduced retry count
          return apiCall(apiFn, { ...options, retries: retries - 1 });
        } else {
          console.error('[API] Token refresh failed after auth error, clearing session');
          // If refresh failed, clear the user session
          authStore.getState().clearUser();
          
          reportError(
            'Your session has expired. Please log in again.',
            ErrorCategory.AUTH,
            'Session expired during API call'
          );
          
          throw error;
        }
      } else {
        console.error('[API] No more retries left for auth error');
        // No more retries left, report the error and throw
        reportError(
          'You don\'t have permission to perform this action.',
          ErrorCategory.PERMISSION,
          'Max retries exceeded for API call'
        );
        
        throw error;
      }
    }
    
    // For other errors, just report and rethrow
    const { message, category } = isAuthError(error) 
      ? { message: 'Authentication error occurred.', category: ErrorCategory.AUTH }
      : { message: error.message || 'An error occurred.', category: ErrorCategory.GENERAL };
    
    reportError(message, category, 'API call failed');
    throw error;
  }
}

// Helper function to create a function that checks for a specific permission before executing
export function withPermission<T>(
  permission: string,
  apiFn: () => Promise<T>
): () => Promise<T> {
  return async () => {
    return apiCall(apiFn, { requirePermission: permission });
  };
}

export default {
  apiCall,
  withPermission
}; 
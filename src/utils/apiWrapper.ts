import { supabase } from '../supabaseClient';
import { useAuthStore } from '../store/store';
import { reportError, ErrorCategory, isAuthError } from './authErrorHandler';

interface ApiOptions {
  noAuth?: boolean;
  retries?: number;
}

// Check if token needs refresh (older than 55 minutes)
const isTokenExpired = (): boolean => {
  const lastRefresh = useAuthStore.getState().lastTokenRefresh;
  if (!lastRefresh) return true;
  
  const now = new Date();
  const refreshTime = new Date(lastRefresh);
  const diffMinutes = (now.getTime() - refreshTime.getTime()) / (1000 * 60);
  
  // If token is older than 55 minutes, consider it expired (Supabase tokens last 60 min)
  return diffMinutes > 55;
};

// Wrapper function for API calls that handles token refresh
export async function apiCall<T>(
  apiFn: () => Promise<T>,
  options: ApiOptions = {}
): Promise<T> {
  const { noAuth = false, retries = 1 } = options;
  
  try {
    // For auth-required endpoints, check if token needs refresh
    if (!noAuth && isTokenExpired()) {
      const refreshSuccess = await useAuthStore.getState().refreshToken();
      if (!refreshSuccess) {
        throw new Error('Your session has expired. Please log in again.');
      }
    }
    
    // Execute the actual API call
    return await apiFn();
  } catch (error: any) {
    console.error('API call failed:', error);
    
    // Handle auth errors
    if (isAuthError(error)) {
      // If this was a permission error and we haven't already retried
      if (retries > 0) {
        // Try to refresh the token
        const refreshSuccess = await useAuthStore.getState().refreshToken();
        
        if (refreshSuccess) {
          // Retry the API call with reduced retry count
          return apiCall(apiFn, { ...options, retries: retries - 1 });
        } else {
          // If refresh failed, clear the user session
          useAuthStore.getState().clearUser();
          
          reportError(
            'Your session has expired. Please log in again.',
            ErrorCategory.AUTH
          );
          
          throw error;
        }
      } else {
        // No more retries left, report the error and throw
        reportError(
          'You don\'t have permission to perform this action.',
          ErrorCategory.PERMISSION
        );
        
        throw error;
      }
    }
    
    // For other errors, just report and rethrow
    const { message, category } = isAuthError(error) 
      ? { message: 'Authentication error occurred.', category: ErrorCategory.AUTH }
      : { message: error.message || 'An error occurred.', category: ErrorCategory.GENERAL };
    
    reportError(message, category);
    throw error;
  }
}

// Helper function to create a function that checks for a specific permission before executing
export function withPermission<T>(
  permission: string,
  apiFn: () => Promise<T>
): () => Promise<T> {
  return async () => {
    if (!useAuthStore.getState().hasPermission(permission)) {
      const error = new Error(`You don't have permission to perform this action (${permission})`);
      reportError(
        `You don't have permission to perform this action.`,
        ErrorCategory.PERMISSION
      );
      throw error;
    }
    
    return apiFn();
  };
}

export default {
  apiCall,
  withPermission
}; 
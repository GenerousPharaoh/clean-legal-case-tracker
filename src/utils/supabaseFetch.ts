import { supabase } from '../supabaseClient';
import { isAuthError, parseAuthError } from './authErrorHandler';
import { reportError, ErrorCategory } from '../components/ErrorNotification';

export interface RequestOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  requireAuth?: boolean;
}

const DEFAULT_OPTIONS: RequestOptions = {
  retries: 2,
  retryDelay: 1000,
  requireAuth: true,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Enhanced fetch utility for making authenticated requests to Supabase
 */
export async function supabaseFetch<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  // Merge default options
  const mergedOptions: RequestOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    headers: {
      ...DEFAULT_OPTIONS.headers,
      ...options.headers,
    },
  };

  const { retries = 2, retryDelay = 1000, requireAuth = true } = mergedOptions;
  
  // Remove custom options before passing to fetch
  delete mergedOptions.retries;
  delete mergedOptions.retryDelay;
  delete mergedOptions.requireAuth;

  // Get the current session for auth token
  if (requireAuth) {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      // Dispatch auth error event
      const event = new CustomEvent('fetcherror', {
        detail: { status: 401, url }
      });
      window.dispatchEvent(event);
      
      // Report error to user
      reportError(
        'Authentication required',
        ErrorCategory.AUTH,
        'You need to be logged in to perform this action'
      );
      
      throw new Error('Authentication required');
    }
    
    // Add auth header to request
    const authHeader = sessionData.session.access_token
      ? { Authorization: `Bearer ${sessionData.session.access_token}` }
      : {};
      
    mergedOptions.headers = {
      ...mergedOptions.headers,
      ...authHeader,
    };
  }

  // Implement retry logic
  let lastError: Error | null = null;
  let attemptCount = 0;

  while (attemptCount <= retries) {
    try {
      const response = await fetch(url, mergedOptions);
      
      // Handle HTTP error responses
      if (!response.ok) {
        const statusCode = response.status;
        
        // Try to parse error response
        let errorData: any;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: response.statusText };
        }
        
        // Handle specific error status codes
        if (statusCode === 401 || statusCode === 403) {
          // Auth error - dispatch event for global handler
          const event = new CustomEvent('fetcherror', {
            detail: { status: statusCode, url }
          });
          window.dispatchEvent(event);
          
          // Report auth error
          reportError(
            'Authentication error',
            ErrorCategory.AUTH,
            'Your session may have expired'
          );
          
          throw new Error('Authentication failed');
        }
        
        if (statusCode === 429) {
          // Rate limiting - dispatch event
          window.dispatchEvent(new Event('ratelimit'));
          
          // If we have retries left, wait and try again
          if (attemptCount < retries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attemptCount + 1)));
            attemptCount++;
            continue;
          }
        }
        
        if (statusCode >= 500) {
          // Server error - dispatch event
          window.dispatchEvent(new Event('servererror'));
          
          reportError(
            'Server error',
            ErrorCategory.SERVER,
            'The server encountered an error processing your request'
          );
          
          throw new Error(`Server error: ${statusCode}`);
        }
        
        // For other error types, throw with the message from the API
        const errorMessage = errorData?.message || errorData?.error || `Request failed with status ${statusCode}`;
        throw new Error(errorMessage);
      }

      // Parse successful response
      const isJson = response.headers.get('content-type')?.includes('application/json');
      if (isJson) {
        return await response.json() as T;
      } else {
        // For non-JSON responses, return response directly
        return response as unknown as T;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if it's a network error (likely offline)
      if (lastError.message.includes('fetch') || lastError.message.includes('network')) {
        window.dispatchEvent(new Event('appoffline'));
      }
      
      // Don't retry if it's an auth error
      if (isAuthError(error)) {
        break;
      }
      
      // Otherwise retry if we have attempts left
      if (attemptCount < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attemptCount + 1)));
        attemptCount++;
      } else {
        break;
      }
    }
  }

  // All retries failed
  if (lastError) {
    // Format the error message nicely
    const errorMessage = parseAuthError(lastError);
    
    // Determine error category
    let category = ErrorCategory.UNKNOWN;
    if (isAuthError(lastError)) {
      category = ErrorCategory.AUTH;
    } else if (lastError.message.includes('network') || lastError.message.includes('fetch')) {
      category = ErrorCategory.NETWORK;
    }
    
    // Report the error to the user
    reportError(
      errorMessage,
      category,
      lastError.message
    );
    
    throw lastError;
  }

  // This shouldn't happen, but just in case
  throw new Error('Request failed');
}

export default supabaseFetch; 
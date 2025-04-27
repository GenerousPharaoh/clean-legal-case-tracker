import { supabase } from '../supabaseClient';
import { isAuthError, parseAuthError } from './authErrorHandler';

// Custom fetch error event
export class FetchError extends Error {
  status: number;
  url: string;
  isAuthError: boolean;

  constructor(message: string, status: number, url: string, isAuth: boolean = false) {
    super(message);
    this.name = 'FetchError';
    this.status = status;
    this.url = url;
    this.isAuthError = isAuth;
  }
}

/**
 * Enhanced fetch utility that:
 * 1. Adds auth token to requests
 * 2. Handles token refresh when needed
 * 3. Dispatches auth events for global handling
 */
export async function fetchWithAuth(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Clone headers to avoid mutating the original options
  const headers = new Headers(options.headers || {});
  
  // Add auth token if available
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  
  // Prepare the request
  const request: RequestInit = {
    ...options,
    headers
  };
  
  try {
    // Make the initial request
    const response = await fetch(url, request);
    
    // If the response is 401 or 403, try to refresh the token
    if (response.status === 401 || response.status === 403) {
      // Attempt to refresh the session
      const { data, error } = await supabase.auth.refreshSession();
      
      // If refresh failed, dispatch auth error and throw
      if (error || !data.session) {
        // Dispatch auth error event for global handling
        window.dispatchEvent(new CustomEvent('fetcherror', {
          detail: { status: response.status, url }
        }));
        
        throw new FetchError(
          `Authentication error: ${response.statusText}`,
          response.status,
          url,
          true
        );
      }
      
      // Refresh succeeded, try the request again with new token
      headers.set('Authorization', `Bearer ${data.session.access_token}`);
      
      const retryRequest: RequestInit = {
        ...options,
        headers
      };
      
      const retryResponse = await fetch(url, retryRequest);
      
      // If still unauthorized, dispatch auth error event
      if (retryResponse.status === 401 || retryResponse.status === 403) {
        window.dispatchEvent(new CustomEvent('fetcherror', {
          detail: { status: retryResponse.status, url }
        }));
        
        throw new FetchError(
          `Authentication error after token refresh: ${retryResponse.statusText}`,
          retryResponse.status,
          url,
          true
        );
      }
      
      return retryResponse;
    }
    
    // For other error status codes
    if (!response.ok) {
      const errorText = await response.text();
      
      // Check if it's an auth error based on response content
      const isAuth = isAuthError(errorText);
      
      // If it's an auth error, dispatch event for global handling
      if (isAuth) {
        window.dispatchEvent(new CustomEvent('fetcherror', {
          detail: { status: response.status, url }
        }));
      }
      
      throw new FetchError(
        `HTTP error ${response.status}: ${errorText}`,
        response.status,
        url,
        isAuth
      );
    }
    
    return response;
  } catch (error) {
    // For network errors or other exceptions
    if (error instanceof FetchError) {
      throw error;
    }
    
    // Check if it's an auth error
    const isAuth = isAuthError(error);
    
    // If it's an auth error, dispatch event
    if (isAuth) {
      window.dispatchEvent(new CustomEvent('fetcherror', {
        detail: { status: 0, url }
      }));
    }
    
    throw new FetchError(
      `Request failed: ${error instanceof Error ? error.message : String(error)}`,
      0,
      url,
      isAuth
    );
  }
}

// Utility functions for common HTTP methods with auth
export const authFetch = {
  get: (url: string, options: RequestInit = {}) => 
    fetchWithAuth(url, { ...options, method: 'GET' }),
    
  post: (url: string, data?: any, options: RequestInit = {}) => 
    fetchWithAuth(url, { 
      ...options, 
      method: 'POST',
      headers: {
        ...options.headers,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    }),
    
  put: (url: string, data?: any, options: RequestInit = {}) => 
    fetchWithAuth(url, { 
      ...options, 
      method: 'PUT',
      headers: {
        ...options.headers,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    }),
    
  patch: (url: string, data?: any, options: RequestInit = {}) => 
    fetchWithAuth(url, { 
      ...options, 
      method: 'PATCH',
      headers: {
        ...options.headers,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    }),
    
  delete: (url: string, options: RequestInit = {}) => 
    fetchWithAuth(url, { ...options, method: 'DELETE' })
};

export default authFetch; 
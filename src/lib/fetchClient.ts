import { supabase, refreshSession } from '../supabaseClient';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
}

/**
 * Enhanced fetch client with automatic retry, auth handling, and offline detection
 */
export const fetchClient = async (url: string, options: FetchOptions = {}): Promise<Response> => {
  const {
    retries = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  // Check if we're offline
  if (!navigator.onLine) {
    // Create and dispatch offline event
    const offlineEvent = new CustomEvent('appoffline', {
      detail: { url, options: fetchOptions }
    });
    window.dispatchEvent(offlineEvent);

    // Throw a specific offline error
    throw new Error('Network offline');
  }

  // Set default headers
  const headers = new Headers(fetchOptions.headers || {});
  
  // If content-type isn't set and we're not sending FormData, set to JSON
  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Add auth token if available
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    headers.set('Authorization', `Bearer ${data.session.access_token}`);
  }

  // Prepare the request
  const request = new Request(url, {
    ...fetchOptions,
    headers
  });

  let lastError: Error | null = null;
  
  // Try up to retries + 1 times (initial + retries)
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Make the request
      const response = await fetch(request.clone());
      
      // If auth error (401/403) and not the last attempt, try to refresh the session
      if ((response.status === 401 || response.status === 403) && attempt < retries) {
        // Try to refresh the token
        const refreshSuccessful = await refreshSession();
        
        if (refreshSuccessful) {
          // Update the authorization header with the new token
          const { data: refreshedData } = await supabase.auth.getSession();
          if (refreshedData.session?.access_token) {
            const newHeaders = new Headers(request.headers);
            newHeaders.set('Authorization', `Bearer ${refreshedData.session.access_token}`);
            
            // Create a new request with the updated headers
            const newRequest = new Request(request.url, {
              ...fetchOptions,
              headers: newHeaders
            });
            
            // Try again with the new token
            continue;
          }
        }
        
        // If we couldn't refresh the token, create and dispatch an auth error event
        const authErrorEvent = new CustomEvent('fetcherror', {
          detail: { status: response.status, url, request, response }
        });
        window.dispatchEvent(authErrorEvent);
      }
      
      // For non-auth errors, check if we should throw based on status
      if (!response.ok) {
        // For errors we want to handle specifically, generate events
        if (response.status === 429) {
          // Rate limit error
          const rateLimitEvent = new CustomEvent('ratelimit', {
            detail: { response, request }
          });
          window.dispatchEvent(rateLimitEvent);
        } else if (response.status >= 500) {
          // Server error
          const serverErrorEvent = new CustomEvent('servererror', {
            detail: { response, request }
          });
          window.dispatchEvent(serverErrorEvent);
          
          // For server errors, retry if attempts remain
          if (attempt < retries) {
            // Calculate delay with exponential backoff
            const delay = retryDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // For any error response, let caller handle the details
        return response;
      }
      
      // Success response
      return response;
    } catch (error) {
      lastError = error as Error;
      
      // Only retry on network errors
      if (error instanceof TypeError && error.message.includes('network')) {
        if (attempt < retries) {
          // Calculate delay with exponential backoff
          const delay = retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // For other errors, don't retry
      throw error;
    }
  }
  
  // If we got here, we've exhausted our retries
  throw lastError || new Error('Maximum retries exceeded');
};

/**
 * GET request with JSON response
 */
export const fetchJson = async <T>(url: string, options: FetchOptions = {}): Promise<T> => {
  const response = await fetchClient(url, {
    method: 'GET',
    ...options,
  });
  
  return response.json() as Promise<T>;
};

/**
 * POST request with JSON body and response
 */
export const postJson = async <T, R = any>(
  url: string, 
  data: T, 
  options: FetchOptions = {}
): Promise<R> => {
  const response = await fetchClient(url, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
  
  return response.json() as Promise<R>;
};

/**
 * PUT request with JSON body and response
 */
export const putJson = async <T, R = any>(
  url: string, 
  data: T, 
  options: FetchOptions = {}
): Promise<R> => {
  const response = await fetchClient(url, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  });
  
  return response.json() as Promise<R>;
};

/**
 * PATCH request with JSON body and response
 */
export const patchJson = async <T, R = any>(
  url: string, 
  data: T, 
  options: FetchOptions = {}
): Promise<R> => {
  const response = await fetchClient(url, {
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options,
  });
  
  return response.json() as Promise<R>;
};

/**
 * DELETE request
 */
export const deleteResource = async (url: string, options: FetchOptions = {}): Promise<void> => {
  await fetchClient(url, {
    method: 'DELETE',
    ...options,
  });
  
  return;
};

export default {
  fetchClient,
  fetchJson,
  postJson,
  putJson,
  patchJson,
  deleteResource
}; 
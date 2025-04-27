// CORS utility functions for Supabase Edge Functions

/**
 * Handle CORS preflight requests
 */
export function handleCors(req: Request): Response | null {
  const origin = req.headers.get("origin");
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    });
  }
  
  return null;
}

/**
 * Get CORS headers for a response
 */
export function getCorsHeaders(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Create a JSON response with proper CORS headers
 */
export function createJsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...getCorsHeaders(null),
    },
  });
}

/**
 * Create an error response with proper CORS headers
 */
export function createErrorResponse(message: string, status: number = 500): Response {
  return createJsonResponse({ error: message }, status);
} 
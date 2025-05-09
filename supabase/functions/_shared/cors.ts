// Handle CORS for all responses, including preflight OPTIONS requests
export function handleCors(req: Request, res?: Response): Response | null {
  const headers = {
    'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  };
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  // For actual requests, attach CORS headers to given response
  if (res) {
    Object.entries(headers).forEach(([key, value]) => {
      res.headers.set(key, value);
    });
    return res;
  }
  // If no response provided, continue processing
  return null;
} 
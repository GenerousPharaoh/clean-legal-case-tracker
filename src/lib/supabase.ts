// Adapter file for compatibility with v1 code
// This redirects all imports to the main singleton Supabase client

import { supabase } from '../supabaseClient';

// Flag for debugging
console.log('[lib/supabase] Redirecting to global Supabase instance');

// Export the global singleton instance
export default supabase;
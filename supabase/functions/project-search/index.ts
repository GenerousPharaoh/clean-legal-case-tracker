// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { corsHeaders } from '../_shared/cors.ts'
import { generateEmbedding } from '../_shared/google_auth.ts'

// Types for input parameters
interface SearchFilters {
  dateRange?: { start?: string; end?: string }
  fileTypes?: string[]
  tags?: string[]
  entities?: { type: string; text: string }[]
  searchType?: 'keyword' | 'semantic' | 'combined'
}

interface SearchRequest {
  projectId: string
  queryText?: string
  filters?: SearchFilters
  pagination?: { limit: number; offset: number }
}

console.log("Hello from Functions!")

// Main search function handler
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create supabase client with service key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request
    const { projectId, queryText, filters, pagination } = await req.json() as SearchRequest

    // Validate required inputs
    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'Project ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Set pagination defaults
    const limit = pagination?.limit || 50
    const offset = pagination?.offset || 0

    // Verify user has access to project (auth check)
    const auth = req.headers.get('Authorization')?.split(' ')[1]
    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Validate user access to the project
    const { data: authData, error: authError } = await supabase.auth.getUser(auth)
    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }
    
    const userId = authData.user.id
    
    // Check if user is project owner or collaborator
    const { data: accessData, error: accessError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single()
    
    if (accessError) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }
    
    // If user is not the owner, check if they're a collaborator
    if (accessData.owner_id !== userId) {
      const { data: collabData, error: collabError } = await supabase
        .from('project_collaborators')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .eq('status', 'accepted')
        .single()
      
      if (collabError || !collabData) {
        return new Response(
          JSON.stringify({ error: 'Not authorized to access this project' }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      }
    }

    // Base query - start with files in this project
    let query = supabase
      .from('files')
      .select('id, name, project_id, owner_id, storage_path, content_type, size, file_type, metadata, added_at, uploaded_by, exhibit_id')
      .eq('project_id', projectId)
      
    // Apply date range filter
    if (filters?.dateRange) {
      if (filters.dateRange.start) {
        query = query.gte('added_at', filters.dateRange.start)
      }
      if (filters.dateRange.end) {
        query = query.lte('added_at', filters.dateRange.end)
      }
    }
    
    // Apply file type filter
    if (filters?.fileTypes && filters.fileTypes.length > 0) {
      query = query.in('file_type', filters.fileTypes)
    }
    
    // Apply tags filter (using containment operator on JSONB)
    if (filters?.tags && filters.tags.length > 0) {
      // Convert tags to JSONB array format
      const tagsJson = JSON.stringify(filters.tags)
      // Use containment operator for JSONB
      query = query.filter('metadata->tags', 'cs', `{${filters.tags.join(',')}}`)
    }
    
    // Apply entity filters
    if (filters?.entities && filters.entities.length > 0) {
      // Build subquery for matching entities
      const entityConditions = filters.entities.map(e => {
        return `(lower(entity_text) = '${e.text.toLowerCase()}' AND entity_type = '${e.type}')`
      }).join(' OR ')
      
      // Find files that have any of these entities
      const { data: entityFilesData } = await supabase
        .from('entities')
        .select('source_file_id')
        .eq('project_id', projectId)
        .or(entityConditions)
        
      if (entityFilesData && entityFilesData.length > 0) {
        const fileIds = entityFilesData.map(ef => ef.source_file_id)
        query = query.in('id', fileIds)
      } else if (filters.entities.length > 0) {
        // If no files match the entity filter, return empty results early
        return new Response(
          JSON.stringify({ files: [], totalCount: 0 }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      }
    }
    
    // Apply text search (keyword, semantic, or combined)
    const searchType = filters?.searchType || 'combined'
    let semanticFileIds: string[] = []
    
    // If semantic or combined search and we have a query text
    if ((searchType === 'semantic' || searchType === 'combined') && queryText && queryText.trim() !== '') {
      try {
        // Generate embedding for the query text using Google's Vertex AI
        const queryEmbedding = await generateEmbedding(queryText)
        
        // Perform vector similarity search
        const { data: semanticResults } = await supabase.rpc(
          'match_chunks',
          {
            query_embedding: queryEmbedding,
            match_threshold: 0.7,
            match_count: 50,
            p_project_id: projectId
          }
        )
        
        if (semanticResults && semanticResults.length > 0) {
          // Extract unique file IDs from semantic search results
          semanticFileIds = [...new Set(semanticResults.map(result => result.file_id))]
          
          // For semantic-only search, restrict to these files
          if (searchType === 'semantic') {
            query = query.in('id', semanticFileIds)
          }
        } else if (searchType === 'semantic') {
          // If semantic-only and no results, return empty results
          return new Response(
            JSON.stringify({ files: [], totalCount: 0 }),
            { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          )
        }
      } catch (error) {
        console.error('Semantic search error:', error)
        // Fall back to keyword search if semantic fails
      }
    }
    
    // Apply keyword search if requested
    if ((searchType === 'keyword' || searchType === 'combined') && queryText && queryText.trim() !== '') {
      // For combined search with semantic results, we use OR to include both
      if (searchType === 'combined' && semanticFileIds.length > 0) {
        query = query.or(`id.in.(${semanticFileIds.join(',')}),name.ilike.%${queryText}%`)
      } else {
        // For keyword-only or combined with no semantic results
        query = query.ilike('name', `%${queryText}%`)
      }
    }
    
    // Clone the query for count
    const countQuery = query.clone()
    
    // Apply sorting and pagination to the main query
    query = query.order('added_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Execute the main query for files
    const { data: files, error: filesError } = await query
    
    if (filesError) {
      return new Response(
        JSON.stringify({ error: filesError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }
    
    // Get total count (without pagination)
    const { count: totalCount, error: countError } = await countQuery.count()
    
    if (countError) {
      return new Response(
        JSON.stringify({ error: countError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }
    
    // Return combined results
    return new Response(
      JSON.stringify({ files, totalCount: totalCount || 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
    
  } catch (error) {
  return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/project-search' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

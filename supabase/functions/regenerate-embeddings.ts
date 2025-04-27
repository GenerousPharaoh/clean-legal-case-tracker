// Utility script to regenerate embeddings for all files using Google's Vertex AI API
// Use this after migrating from OpenAI to Google embeddings

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { corsHeaders } from "./_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get admin credentials
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase credentials" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Create supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request
    const { projectId, limit } = await req.json();
    
    // Validate required parameters
    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "Project ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Get files needing embeddings regeneration
    const queryLimit = limit || 50; // Default to 50 files at a time
    const { data: files, error: filesError } = await supabase
      .from("files")
      .select("id, name, project_id")
      .eq("project_id", projectId)
      .order("added_at", { ascending: false })
      .limit(queryLimit);
    
    if (filesError) {
      return new Response(
        JSON.stringify({ error: `Error fetching files: ${filesError.message}` }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ message: "No files found for regeneration" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Queue regeneration jobs for each file
    const regenerationResults = [];
    
    for (const file of files) {
      try {
        // First delete existing embeddings
        await supabase
          .from("document_chunks")
          .delete()
          .eq("file_id", file.id);
        
        // Then queue the regeneration job
        const { error: invocationError } = await supabase.functions.invoke("generate-embeddings", {
          body: { fileId: file.id, projectId }
        });
        
        if (invocationError) {
          regenerationResults.push({ 
            fileId: file.id, 
            fileName: file.name, 
            status: "error", 
            message: invocationError.message 
          });
        } else {
          regenerationResults.push({ 
            fileId: file.id, 
            fileName: file.name, 
            status: "queued"
          });
        }
      } catch (error) {
        regenerationResults.push({ 
          fileId: file.id, 
          fileName: file.name, 
          status: "error", 
          message: error.message 
        });
      }
    }
    
    // Return results
    return new Response(
      JSON.stringify({
        message: `Regeneration queued for ${regenerationResults.length} files`,
        results: regenerationResults,
        total: files.length
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Regeneration failed: ${error.message}` }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

/* 
Usage instructions:

1. Deploy this function to your Supabase project:
   supabase functions deploy regenerate-embeddings

2. Call the function with the projectId parameter to regenerate embeddings:
   curl -X POST 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/regenerate-embeddings' \
     -H 'Authorization: Bearer [SUPABASE_SERVICE_ROLE_KEY]' \
     -H 'Content-Type: application/json' \
     -d '{"projectId": "your-project-id", "limit": 20}'

3. You can regenerate in batches by setting the limit parameter and making multiple calls

Note: This is a resource-intensive operation. Consider running it during off-peak hours.
*/ 
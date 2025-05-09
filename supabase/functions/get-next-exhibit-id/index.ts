import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getNextExhibitId } from "../utils/database.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

interface RequestParams {
  projectId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { projectId } = await req.json() as RequestParams;

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "Project ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the next exhibit ID
    const nextExhibitId = await getNextExhibitId(projectId);

    // Return the result
    return new Response(
      JSON.stringify({ 
        exhibitId: nextExhibitId 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in get-next-exhibit-id function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to get next exhibit ID",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}); 
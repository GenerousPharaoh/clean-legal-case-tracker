import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { generateText } from "../utils/googleai.ts";
import { getFile, getNextExhibitId } from "../utils/database.ts";

interface RequestParams {
  fileId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { fileId } = await req.json() as RequestParams;

    if (!fileId) {
      return new Response(
        JSON.stringify({ error: "File ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get file details
    const file = await getFile(fileId);
    if (!file) {
      return new Response(
        JSON.stringify({ error: "File not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the next exhibit ID
    const nextExhibitId = await getNextExhibitId(file.project_id);

    // Extract metadata
    const metadata = file.metadata || {};
    const fileType = file.file_type;
    const name = file.name;
    
    // Build prompt for Gemini
    const prompt = `
    I'm a legal professional organizing evidence files for a case. 
    Based on the following information about a document, suggest 3 clear, concise, and professional file names that would be appropriate in a legal context.
    
    Original filename: ${name}
    File type: ${fileType}
    Additional metadata: ${JSON.stringify(metadata)}
    
    The names should:
    - Be descriptive but concise (under 60 characters)
    - Follow standard naming conventions for legal documents
    - Be easily searchable
    - Indicate the document type or content when possible
    - Not include special characters (except underscores or hyphens)
    
    Format your response as a JSON object with an array of 3 suggested names, like this:
    {"suggestedNames": ["Name 1", "Name 2", "Name 3"]}
    `;

    // Generate suggestions using Gemini
    const suggestionText = await generateText(prompt);
    
    // Parse the response
    let suggestions;
    try {
      suggestions = JSON.parse(suggestionText);
    } catch (e) {
      // If parsing fails, create a fallback response
      suggestions = {
        suggestedNames: [
          `${fileType}_document_${nextExhibitId}`,
          name,
          `Evidence_${nextExhibitId}`
        ]
      };
    }

    // Return the result
    return new Response(
      JSON.stringify({ 
        suggestedNames: suggestions.suggestedNames,
        nextExhibitId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in suggest-filename function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to suggest filenames",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}); 
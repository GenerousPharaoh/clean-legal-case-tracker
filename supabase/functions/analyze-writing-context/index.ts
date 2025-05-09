import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { generateText } from '../utils/googleai.ts';

interface RequestParams {
  text: string;
  projectId?: string;
}

serve(async (req) => {
  console.log("[analyze-writing-context] Function invoked");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("[analyze-writing-context] Handling CORS preflight");
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("[analyze-writing-context] Parsing request body");
    
    // Parse request body
    let params: RequestParams;
    try {
      params = await req.json() as RequestParams;
    } catch (error) {
      console.error("[analyze-writing-context] Failed to parse request body:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse request body",
          details: error.message 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    const { text, projectId } = params;

    if (!text) {
      console.error("[analyze-writing-context] Missing required parameter: text");
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log("[analyze-writing-context] Processing text of length:", text.length);
    if (projectId) {
      console.log("[analyze-writing-context] For project:", projectId);
    }
    
    // Truncate text if it's too long (Gemini has context limits)
    const truncatedText = text.length > 10000 ? text.substring(0, 10000) + '...' : text;

    // Build prompt for Gemini 2.5 Pro
    const prompt = `
    I need you to analyze the following legal text and extract key information. 
    The text is from a document related to a legal case.
    
    Text to analyze:
    """
    ${truncatedText}
    """
    
    Please provide a comprehensive analysis with the following:
    
    1. Content Overview: A brief summary of what this document contains (2-3 sentences).
    2. Key Entities: People, organizations, locations, or other entities mentioned.
    3. Important Dates: Any dates mentioned and their significance.
    4. Legal Concepts: Identify key legal concepts, claims, or arguments present.
    5. Suggested Topics: Based on content, suggest 3-5 key topics this document relates to.
    
    Format your response as a JSON object with the following structure:
    {
      "summary": "Brief overview of content",
      "entities": [{"name": "Entity name", "type": "person/org/location"}],
      "dates": [{"date": "YYYY-MM-DD", "significance": "brief description"}],
      "legalConcepts": ["concept 1", "concept 2"],
      "suggestedTopics": ["topic 1", "topic 2", "topic 3"],
      "confidenceScore": 0.95
    }
    
    Ensure your analysis is accurate, objective, and focused on extracting factual information.
    For the confidenceScore, provide a value between 0 and 1 that reflects how confident you are in your analysis.
    `;

    console.log("[analyze-writing-context] Calling Gemini API for text analysis");
    
    // Generate analysis using Gemini
    let analysisText: string;
    try {
      analysisText = await generateText(prompt);
      console.log("[analyze-writing-context] Successfully received response from Gemini API, length:", analysisText.length);
    } catch (error) {
      console.error("[analyze-writing-context] Error calling Gemini API:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to generate analysis", 
          details: error.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Parse the response
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
      console.log("[analyze-writing-context] Successfully parsed Gemini response as JSON");
    } catch (e) {
      console.error("[analyze-writing-context] Failed to parse Gemini response as JSON:", e);
      // For debugging, return a portion of the raw text if parsing fails
      const previewText = analysisText.length > 500 ? analysisText.substring(0, 500) + '...' : analysisText;
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse analysis result", 
          rawResponse: previewText,
          details: e.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate the response has expected structure
    if (!analysis.summary || !analysis.entities || !analysis.dates || 
        !analysis.legalConcepts || !analysis.suggestedTopics) {
      console.error("[analyze-writing-context] Gemini response is missing required fields");
      return new Response(
        JSON.stringify({ 
          error: "Invalid analysis result, missing required fields",
          partialResult: analysis
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log("[analyze-writing-context] Successfully completed analysis");
    
    // Return the result
    return new Response(
      JSON.stringify(analysis),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("[analyze-writing-context] Unhandled error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to analyze writing context",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}); 
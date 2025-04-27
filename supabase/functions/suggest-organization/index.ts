// Follow Deno Edge Function conventions
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, createJsonResponse, createErrorResponse } from "../_shared/cors.ts";

interface RequestBody {
  projectId: string;
  answers: {
    goal: string;
    parties: string;
    documentTypes: string;
  };
}

// No longer need OPENAI_API_KEY
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const GOOGLE_APPLICATION_CREDENTIALS_JSON = Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS_JSON");
const GEMINI_MODEL = Deno.env.get("GOOGLE_GEMINI_MODEL") || "gemini-2.5-pro-preview-03-25";

// Check for required environment variables
if (!GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable");
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Parse request body
    const { projectId, answers } = await req.json() as RequestBody;
    if (!projectId || !answers) {
      return createErrorResponse("Missing projectId or answers", 400);
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return createErrorResponse("Project not found", 404);
    }

    // Call Gemini API to suggest tags
    const tags = await suggestTags(answers);

    // Update files in the project with the suggested tags
    const { data: files, error: filesError } = await supabase
      .from("files")
      .select("id, metadata")
      .eq("project_id", projectId);

    if (filesError) {
      return createErrorResponse("Error fetching files", 500);
    }

    // Update each file's metadata with the suggested tags
    for (const file of files) {
      const metadata = file.metadata || {};
      metadata.tags = tags;

      const { error: updateError } = await supabase
        .from("files")
        .update({ metadata })
        .eq("id", file.id);

      if (updateError) {
        console.error(`Error updating file ${file.id}:`, updateError);
      }
    }

    // Mark the project as AI-organized
    const { error: updateProjectError } = await supabase
      .from("projects")
      .update({ is_ai_organized: true })
      .eq("id", projectId);

    if (updateProjectError) {
      return createErrorResponse("Error updating project", 500);
    }

    return createJsonResponse({ 
      success: true, 
      tags,
      message: "Project successfully organized with AI" 
    });
  } catch (error) {
    console.error("Error:", error);
    return createErrorResponse(error.message || "Internal server error", 500);
  }
});

/**
 * Get an access token for Google Cloud APIs using service account credentials
 */
async function getAccessToken(): Promise<string> {
  try {
    const credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON!);
    const jwtHeader = {
      alg: "RS256",
      typ: "JWT",
      kid: credentials.private_key_id
    };

    const now = Math.floor(Date.now() / 1000);
    const expiryTime = now + 3600; // 1 hour from now

    const jwtClaimSet = {
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      exp: expiryTime,
      iat: now
    };

    // Encode JWT header and claim set
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const encodedHeader = btoa(JSON.stringify(jwtHeader))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const encodedClaimSet = btoa(JSON.stringify(jwtClaimSet))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Create the content to sign
    const signContent = `${encodedHeader}.${encodedClaimSet}`;

    // Import the private key for signing
    const privateKey = credentials.private_key;
    const algorithm = { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-256" } };

    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    
    // Extract the base64 part of the private key
    const pemContents = privateKey
      .replace(pemHeader, "")
      .replace(pemFooter, "")
      .replace(/\s/g, "");
    
    // Convert the base64 string to binary
    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    
    // Import the key
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      algorithm,
      false,
      ["sign"]
    );

    // Sign the content
    const signature = await crypto.subtle.sign(
      algorithm.name,
      cryptoKey,
      encoder.encode(signContent)
    );

    // Convert signature to Base64URL
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Create the complete JWT
    const jwt = `${signContent}.${encodedSignature}`;

    // Exchange JWT for access token
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
    }

    const tokenData = await response.json();
    return tokenData.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    throw error;
  }
}

/**
 * Suggest tags using Gemini 2.5 Pro
 */
async function suggestTags(answers: RequestBody["answers"]): Promise<string[]> {
  try {
    const credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON!);
    const projectId = credentials.project_id;
    const location = "global"; // Gemini 2.5 Pro is available in global API endpoint
    
    const prompt = `
      You are an expert legal assistant helping to organize a legal case. 
      Based on the following information, suggest 5-10 relevant tags that would be useful for organizing files in this case.
      
      Primary goal/type of case: ${answers.goal}
      Key parties/entities: ${answers.parties}
      Main document types anticipated: ${answers.documentTypes}
      
      Provide your response ONLY as a JSON array of tag strings, with no additional explanation. 
      Example: ["contract", "evidence", "witness", "financials", "correspondence"]
    `;

    const requestBody = {
      contents: [
        {
          role: "system",
          parts: [{ text: "You are a legal assistant that specializes in organizing case files." }]
        },
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
        responseMimeType: "application/json"
      }
    };

    const accessToken = await getAccessToken();
    
    const response = await fetch(
      `https://global-aiplatform.googleapis.com/v1/projects/${projectId}/locations/global/publishers/google/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    let content = "";
    
    if (result.candidates && result.candidates.length > 0 && 
        result.candidates[0].content && result.candidates[0].content.parts && 
        result.candidates[0].content.parts.length > 0) {
      content = result.candidates[0].content.parts[0].text;
    } else {
      throw new Error("No content returned from Gemini");
    }

    try {
      // Extract JSON array from the response
      // First, try direct JSON parsing
      let tags;
      try {
        tags = JSON.parse(content);
      } catch (e) {
        // If direct parsing fails, try to extract JSON from text
        const jsonMatch = content.match(/\[.*\]/s);
        if (jsonMatch) {
          tags = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not parse JSON from Gemini response");
        }
      }

      if (!Array.isArray(tags)) {
        throw new Error("Gemini response is not an array");
      }

      return tags.filter(tag => typeof tag === 'string');
    } catch (error) {
      console.error("Error parsing Gemini response:", error, "Content:", content);
      throw new Error("Failed to parse tags from Gemini response");
    }
  } catch (error) {
    console.error("Error in suggestTags:", error);
    throw error;
  }
} 
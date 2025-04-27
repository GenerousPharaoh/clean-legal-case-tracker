import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, createJsonResponse, createErrorResponse } from '../_shared/cors.ts'
import { generateEmbedding } from "../_shared/google_auth.ts";
import { codeBlock, oneLine } from 'https://esm.sh/common-tags@1.8.2'

interface RequestPayload {
  projectId: string
  currentText: string
}

interface Suggestion {
  type: 'support' | 'contradiction' | 'question' | 'elaborate'
  text: string
  fileId?: string
  location?: string
  quote?: string
}

interface SuggestionsResponse {
  suggestions: Suggestion[]
}

interface ChunkWithMetadata {
  content: string
  file_id: string
  file_name?: string
  metadata?: {
    page?: number
    timestamp?: number
  }
}

// Initialize environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const GOOGLE_APPLICATION_CREDENTIALS_JSON = Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS_JSON");
const GEMINI_MODEL = Deno.env.get("GOOGLE_GEMINI_MODEL") || "gemini-2.5-pro-preview-03-25";

// Check for required environment variables
if (!GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS_JSON");
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const authorization = req.headers.get('Authorization')
    if (!authorization) {
      return createErrorResponse('Missing Authorization header', 401);
    }

    // Create a Supabase client with the auth header from the request
    const supabaseClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { global: { headers: { Authorization: authorization } } }
    )

    // Parse the request body
    const { projectId, currentText }: RequestPayload = await req.json()

    if (!projectId || !currentText) {
      return createErrorResponse('projectId and currentText are required', 400);
    }

    // Verify the user has access to this project
    const { error: projectAccessError } = await verifyProjectAccess(
      supabaseClient,
      projectId
    )
    if (projectAccessError) {
      return createErrorResponse(`Unauthorized: ${projectAccessError.message}`, 403);
    }

    // Get the project goal for context
    const { data: projectData, error: projectError } = await supabaseClient
      .from('projects')
      .select('goal')
      .eq('id', projectId)
      .single()

    if (projectError) {
      return createErrorResponse(`Failed to retrieve project: ${projectError.message}`, 500);
    }

    const projectGoal = projectData.goal || 'No goal specified'

    // Generate embedding for the current text using Google's text-embedding model
    const textEmbedding = await generateEmbedding(currentText)

    // Get relevant document chunks using similarity search
    const relevantChunks = await getRelevantChunks(
      supabaseClient,
      projectId,
      textEmbedding
    )

    // Analyze with Gemini 2.5 Pro
    const promptResponse = await analyzeWithGemini(
      projectGoal,
      currentText,
      relevantChunks
    )

    // Return the structured suggestions
    return createJsonResponse(promptResponse);
  } catch (error) {
    console.error("Error processing request:", error);
    return createErrorResponse(
      error.message || "An unexpected error occurred",
      error.status || 500,
      { suggestions: [] }
    );
  }
})

// Verify user has access to the project
async function verifyProjectAccess(
  supabaseClient: SupabaseClient,
  projectId: string
) {
  const { data: userData, error: userError } = await supabaseClient.auth.getUser()
  if (userError) return { error: userError }

  const userId = userData.user?.id

  const { data, error } = await supabaseClient
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return { error }
  if (!data) return { error: { message: 'Project not found or access denied' } }

  return { data }
}

// Get relevant document chunks using similarity search
async function getRelevantChunks(
  supabaseClient: SupabaseClient,
  projectId: string,
  embedding: number[]
): Promise<ChunkWithMetadata[]> {
  // Vector similarity search query
  const { data, error } = await supabaseClient.rpc('match_chunks', {
    query_embedding: embedding,
    match_threshold: 0.5, // Threshold can be adjusted
    match_count: 10, // Number of chunks to retrieve
    p_project_id: projectId,
  })

  if (error) {
    console.error('Error fetching relevant chunks:', error)
    throw new Error(`Failed to retrieve relevant chunks: ${error.message}`)
  }

  // Gather file information for the returned chunks
  const fileIds = [...new Set(data.map((chunk: any) => chunk.file_id))]
  let fileInfoMap: Record<string, { name: string; type: string }> = {}

  if (fileIds.length > 0) {
    const { data: fileData, error: fileError } = await supabaseClient
      .from('files')
      .select('id, name, type')
      .in('id', fileIds)

    if (fileError) {
      console.error('Error fetching file info:', fileError)
    } else {
      fileInfoMap = fileData.reduce((acc: any, file: any) => {
        acc[file.id] = { name: file.name, type: file.type }
        return acc
      }, {})
    }
  }

  // Enhance the chunks with file names and format metadata
  return data.map((chunk: any) => {
    const fileInfo = fileInfoMap[chunk.file_id] || { name: 'Unknown file', type: 'unknown' }
    return {
      content: chunk.content,
      file_id: chunk.file_id,
      file_name: fileInfo.name,
      metadata: {
        ...(chunk.metadata || {}),
        page: chunk.metadata?.page,
        timestamp: chunk.metadata?.timestamp,
      },
    }
  })
}

/**
 * Get Google auth token for API access
 */
async function getGoogleAuthToken(): Promise<string> {
  try {
    const credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON!);
    
    // Create JWT for Google's OAuth2 service
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
      new TextEncoder().encode(signContent)
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

// Analyze the text with Gemini 2.5 Pro
async function analyzeWithGemini(
  projectGoal: string,
  currentText: string,
  relevantChunks: ChunkWithMetadata[]
): Promise<SuggestionsResponse> {
  try {
    // Format evidence snippets with metadata for the prompt
    const evidenceSnippets = relevantChunks
      .map(
        (chunk, index) => `
SNIPPET ${index + 1}
Source: ${chunk.file_name || 'Unknown'} (ID: ${chunk.file_id})
Location: ${
          chunk.metadata?.page
            ? `Page ${chunk.metadata.page}`
            : chunk.metadata?.timestamp
            ? `Timestamp ${formatTimestamp(chunk.metadata.timestamp)}`
            : 'Unknown location'
        }
Content: ${chunk.content.trim()}
`
      )
      .join('\n\n')

    // Build the prompt
    const prompt = codeBlock`
      You are a meticulous legal/research analyst acting as a critical thinking partner.
      
      PROJECT GOAL:
      ${projectGoal}
      
      USER'S CURRENT TEXT:
      ${currentText}
      
      RETRIEVED EVIDENCE SNIPPETS:
      ${evidenceSnippets}
      
      INSTRUCTIONS:
      Analyze the user's currentText based only on the provided retrievedEvidenceSnippets and the projectGoal.
      
      1. Identify the main claim(s) or statement(s) made in the currentText.
      2. List snippets from retrievedEvidenceSnippets that strongly support these claim(s). For each, provide the source file ID, location, and a brief quote.
      3. Critically, identify any snippets from retrievedEvidenceSnippets that potentially contradict, weaken, or nuance the claim(s). Highlight these clearly, providing source file ID, location, and quote.
      4. Based on potential weaknesses, unstated assumptions, or contradictions found, formulate 1-2 specific, challenging questions for the user to consider regarding their currentText.
      5. Identify any specific parts of the currentText that appear to lack direct support within the provided snippets and suggest the user may need to elaborate or find further evidence.
      
      Format your response as a JSON object with a single key 'suggestions', where the value is an array of objects. Each suggestion object should have:
      - 'type': one of 'support', 'contradiction', 'question', or 'elaborate'
      - 'text': the advice, question, or observation
      - 'fileId' (optional): the source file ID for references
      - 'location' (optional): page number or timestamp location within the file
      - 'quote' (optional): brief quote from the evidence
      
      ONLY respond with valid JSON following this exact structure.
    `

    const credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON!);
    const projectId = credentials.project_id;
    
    // Prepare request body for Gemini
    const requestBody = {
      contents: [
        {
          role: "system",
          parts: [{ text: "You are a meticulous legal/research analyst that returns only JSON responses." }]
        },
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 4096,
        responseMimeType: "application/json"
      }
    };

    // Get auth token
    const accessToken = await getGoogleAuthToken();
    
    // Call Gemini 2.5 Pro
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
    
    // Parse response from Gemini
    let responseText = "";
    if (result.candidates && result.candidates.length > 0 && 
        result.candidates[0].content && result.candidates[0].content.parts && 
        result.candidates[0].content.parts.length > 0) {
      responseText = result.candidates[0].content.parts[0].text;
    } else {
      throw new Error("No content returned from Gemini");
    }
    
    try {
      const parsedResponse = JSON.parse(responseText);
      return parsedResponse as SuggestionsResponse;
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      return { suggestions: [] };
    }
  } catch (error) {
    console.error('Error calling Gemini:', error);
    throw new Error(`Failed to analyze text with Gemini: ${error.message}`);
  }
}

// Helper to format timestamps as MM:SS
function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
} 
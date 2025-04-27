// Google Cloud and Vertex AI integrations for Supabase Edge Functions
// This file provides authentication and API access to Google's AI models

// Parse and initialize credentials
const GOOGLE_APPLICATION_CREDENTIALS_JSON = Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS_JSON");
const PROJECT_ID = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID");
const LOCATION = Deno.env.get("GOOGLE_CLOUD_LOCATION") || "us-central1";
const EMBEDDING_MODEL = Deno.env.get("GOOGLE_EMBEDDING_MODEL") || "textembedding-004";
const GEMINI_MODEL = Deno.env.get("GOOGLE_GEMINI_MODEL") || "gemini-2.5-pro-preview-03-25";

let credentials: any = null;
let accessToken: string | null = null;
let tokenExpiration: number = 0;

// Initialize Google credentials from environment variable
if (GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  try {
    credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON);
  } catch (error) {
    console.error("Error parsing Google credentials JSON:", error);
    throw new Error("Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON format");
  }
}

/**
 * Get an access token for Google Cloud APIs using service account credentials
 * This implementation uses the JWT auth method for Deno compatibility
 */
async function getAccessToken(): Promise<string> {
  // Check if we have a valid token already
  const now = Math.floor(Date.now() / 1000);
  if (accessToken && tokenExpiration > now + 60) {
    return accessToken;
  }

  if (!credentials || !credentials.private_key) {
    throw new Error("Valid Google Cloud credentials are required");
  }

  // Create a JWT for Google's OAuth2 service
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
  accessToken = tokenData.access_token;
  tokenExpiration = now + parseInt(tokenData.expires_in, 10);

  return accessToken;
}

// Export getAccessToken as getGoogleAuthToken for backward compatibility
export const getGoogleAuthToken = getAccessToken;

/**
 * Generate text embeddings using Vertex AI
 * @param text The text to generate embeddings for
 * @returns A vector of floating point numbers
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Text is required for embedding generation");
  }

  try {
    const token = await getAccessToken();
    
    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${EMBEDDING_MODEL}:predict`;
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        instances: [{ content: text }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Embedding API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    
    // The response structure depends on the embedding model
    // For textembedding-gecko, we access the embeddings like this:
    return result.predictions[0].embeddings.values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

/**
 * Generate text using Gemini model
 * @param prompt The prompt to send to the model
 * @param systemInstruction Optional system instruction
 * @param temperature Temperature parameter (0-1)
 * @returns Generated text
 */
export async function generateWithGemini(
  prompt: string, 
  systemInstruction?: string, 
  temperature = 0.2
): Promise<string> {
  try {
    const token = await getAccessToken();
    
    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${GEMINI_MODEL}:generateContent`;
    
    const requestBody: any = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: temperature,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192
      }
    };

    // Add system instruction if provided
    if (systemInstruction) {
      requestBody.contents.unshift({
        role: "system",
        parts: [{ text: systemInstruction }]
      });
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    
    // Parse response from Gemini and extract text
    if (result.candidates && result.candidates.length > 0 && 
        result.candidates[0].content && 
        result.candidates[0].content.parts && 
        result.candidates[0].content.parts.length > 0) {
      return result.candidates[0].content.parts[0].text;
    }
    
    return "";
  } catch (error) {
    console.error("Error generating with Gemini:", error);
    throw error;
  }
}

/**
 * Process multimodal content (images, PDFs) using Gemini
 * @param prompt Text prompt to send with the image
 * @param systemInstruction Optional system instruction
 * @param base64Content Base64-encoded content of the image or PDF
 * @param mimeType MIME type of the content
 * @param temperature Temperature parameter (0-1)
 * @returns Generated text response
 */
export async function processMultimodalContent(
  prompt: string,
  systemInstruction: string,
  base64Content: string,
  mimeType: string,
  temperature = 0.2
): Promise<string> {
  try {
    const token = await getAccessToken();
    
    // Use the same Gemini model for multimodal content
    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${GEMINI_MODEL}:generateContent`;
    
    const requestBody: any = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Content
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: temperature,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192
      }
    };

    // Add system instruction if provided
    if (systemInstruction) {
      requestBody.contents.unshift({
        role: "system",
        parts: [{ text: systemInstruction }]
      });
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini multimodal API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    
    // Parse response from Gemini and extract text
    if (result.candidates && result.candidates.length > 0 && 
        result.candidates[0].content && 
        result.candidates[0].content.parts && 
        result.candidates[0].content.parts.length > 0) {
      return result.candidates[0].content.parts[0].text;
    }
    
    return "";
  } catch (error) {
    console.error("Error processing multimodal content:", error);
    throw error;
  }
} 
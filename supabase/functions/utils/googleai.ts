import { VertexAI } from 'https://esm.sh/@google-cloud/vertexai';

// Get environment variables from Supabase secrets
const GOOGLE_APPLICATION_CREDENTIALS_JSON = Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS_JSON");
const GOOGLE_CLOUD_PROJECT_ID = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID") || "legal-case-tracker";
const GOOGLE_CLOUD_LOCATION = Deno.env.get("GOOGLE_CLOUD_LOCATION") || "us-central1";
const GOOGLE_EMBEDDING_MODEL = Deno.env.get("GOOGLE_EMBEDDING_MODEL") || "textembedding-004";
const GOOGLE_GEMINI_MODEL = Deno.env.get("GOOGLE_GEMINI_MODEL") || "gemini-2.5-pro-preview-03-25";

console.log("[GoogleAI] Initializing with project:", GOOGLE_CLOUD_PROJECT_ID);
console.log("[GoogleAI] Using models - Gemini:", GOOGLE_GEMINI_MODEL, "Embedding:", GOOGLE_EMBEDDING_MODEL);
console.log("[GoogleAI] Credentials available:", !!GOOGLE_APPLICATION_CREDENTIALS_JSON);

// Parse credentials
let credentials;
try {
  if (!GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set");
  }
  
  credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON);
  
  // Validate credential object has required fields
  if (!credentials.type || !credentials.project_id || !credentials.private_key || !credentials.client_email) {
    throw new Error("Google credentials are missing required fields");
  }
  
  console.log("[GoogleAI] Successfully parsed credentials for:", credentials.client_email);
} catch (e) {
  console.error("[GoogleAI] Failed to parse Google credentials:", e);
  throw new Error("Invalid Google credentials format: " + e.message);
}

// Initialize Vertex AI with credentials
let vertexAI;
let generativeModel;

try {
  vertexAI = new VertexAI({
    project: GOOGLE_CLOUD_PROJECT_ID,
    location: GOOGLE_CLOUD_LOCATION,
    googleAuthOptions: {
      credentials,
    },
  });

  // Initialize the Gemini model
  generativeModel = vertexAI.getGenerativeModel({
    model: GOOGLE_GEMINI_MODEL,
  });
  
  console.log("[GoogleAI] Successfully initialized Vertex AI and Gemini model");
} catch (e) {
  console.error("[GoogleAI] Failed to initialize Vertex AI:", e);
  throw new Error("Failed to initialize Vertex AI: " + e.message);
}

/**
 * Generate text using Google Gemini model
 * @param prompt The prompt to generate text from
 * @param systemPrompt Optional system prompt to guide the model
 * @returns Generated text
 */
export async function generateText(prompt: string, systemPrompt?: string): Promise<string> {
  try {
    console.log("[GoogleAI] Generating text with prompt length:", prompt.length);
    
    const req: any = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
      },
    };

    if (systemPrompt) {
      console.log("[GoogleAI] Using system prompt with length:", systemPrompt.length);
      req.contents.unshift({
        role: "system",
        parts: [{ text: systemPrompt }],
      });
    }

    const result = await generativeModel.generateContent(req);
    const response = await result.response;
    
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates returned from Gemini");
    }
    
    const text = response.candidates[0].content.parts[0].text;
    console.log("[GoogleAI] Successfully generated text of length:", text.length);
    return text;
  } catch (error) {
    console.error("[GoogleAI] Error generating text:", error);
    throw new Error(`Failed to generate text: ${error.message}`);
  }
}

/**
 * Generate embeddings for text using Google's embedding model
 * @param text The text to generate embeddings for
 * @returns A vector of embeddings
 */
export async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    console.log("[GoogleAI] Generating embeddings for text of length:", text.length);
    
    const embeddingModel = vertexAI.getEmbeddingModel({
      model: GOOGLE_EMBEDDING_MODEL,
    });

    const embedRequest = {
      model: GOOGLE_EMBEDDING_MODEL,
      content: {
        parts: [{ text }],
      },
    };

    const response = await embeddingModel.generateEmbedding(embedRequest);
    
    if (!response.embedding || !response.embedding.values) {
      throw new Error("No embedding values returned");
    }
    
    console.log("[GoogleAI] Successfully generated embeddings of dimension:", response.embedding.values.length);
    return response.embedding.values;
  } catch (error) {
    console.error("[GoogleAI] Error generating embeddings:", error);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
}

/**
 * Process an image for analysis with Gemini Vision
 * @param imageData Base64 encoded image data
 * @param prompt The prompt for image analysis
 * @returns Generated text analysis
 */
export async function analyzeImage(imageData: string, prompt: string): Promise<string> {
  try {
    console.log("[GoogleAI] Analyzing image with prompt length:", prompt.length);
    
    const visionModel = vertexAI.getGenerativeModel({
      model: GOOGLE_GEMINI_MODEL,
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
      },
    });

    const req = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { data: imageData, mimeType: "image/jpeg" } },
          ],
        },
      ],
    };

    const result = await visionModel.generateContent(req);
    const response = await result.response;
    
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates returned from Gemini Vision");
    }
    
    const text = response.candidates[0].content.parts[0].text;
    console.log("[GoogleAI] Successfully analyzed image, result length:", text.length);
    return text;
  } catch (error) {
    console.error("[GoogleAI] Error analyzing image:", error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
} 
// Follow Deno Edge Function conventions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { processFile } from "../_shared/fileProcessor.ts";
import { generateEmbedding, getGoogleAuthToken, processMultimodalContent } from "../_shared/google_auth.ts";
import { handleCors, createJsonResponse, createErrorResponse } from "../_shared/cors.ts";

// IMPORTANT: The text-embedding-004 model generates 768-dimensional vectors.
// If migrating from a different embedding model, you will need to update your vector tables:
// ALTER TABLE document_chunks ALTER COLUMN embedding SET DATA TYPE vector(768);
// After updating the schema, you must regenerate all existing embeddings.

interface RequestBody {
  docId: string;
  projectId: string;
  text: string;
  metadata?: Record<string, any>;
  namespace?: string;
}

interface Entity {
  text: string;
  type: string;
}

// No longer need OPENAI_API_KEY, now using Google Cloud credentials
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const GOOGLE_APPLICATION_CREDENTIALS_JSON = Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS_JSON");

// Verify Google credentials are available
if (!GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable");
}

/**
 * Splits text into chunks of approximately the specified token size
 * @param text Text to split
 * @param maxChunkSize Maximum chunk size in characters (approximate tokens)
 * @param overlap Overlap between chunks in characters
 */
function chunkText(text: string, maxChunkSize = 800, overlap = 200): string[] {
  if (!text || text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    // Find a good place to break the chunk (at a paragraph or sentence)
    let chunkEndIndex = Math.min(currentIndex + maxChunkSize, text.length);
    
    // Try to break at paragraph
    const paragraphBreak = text.lastIndexOf('\n\n', chunkEndIndex);
    if (paragraphBreak > currentIndex && paragraphBreak > currentIndex + maxChunkSize / 2) {
      chunkEndIndex = paragraphBreak;
    } else {
      // Try to break at a sentence
      const sentenceBreak = text.lastIndexOf('. ', chunkEndIndex);
      if (sentenceBreak > currentIndex && sentenceBreak > currentIndex + maxChunkSize / 2) {
        chunkEndIndex = sentenceBreak + 1; // Include the period
      }
    }

    // Extract the chunk
    chunks.push(text.substring(currentIndex, chunkEndIndex).trim());
    
    // Move the current index, accounting for overlap
    currentIndex = chunkEndIndex - overlap;
    if (currentIndex < 0) currentIndex = 0;
  }

  return chunks;
}

/**
 * Extract named entities from text using Gemini
 * @param text Text to extract entities from
 * @returns Array of entities with text and type
 */
async function extractNamedEntities(text: string): Promise<Entity[]> {
  try {
    // For larger documents, we need to split the text into manageable chunks
    // to fit within Gemini's context window
    const NER_CHUNK_SIZE = 12000; // Characters per chunk for NER (approximately 3000 tokens)
    const OVERLAP = 1000; // Characters of overlap between chunks
    
    const chunks = chunkText(text, NER_CHUNK_SIZE, OVERLAP);
    const allEntities: Entity[] = [];
    
    // Process each chunk for entities
    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      
      try {
        // System instruction for NER
        const systemInstruction = `You are a Named Entity Recognition system for legal documents. 
              Extract all entities from the provided text and categorize them by type.
              Focus on these entity types:
              - PERSON: Individual names (e.g., John Smith, Jane Doe)
              - ORG: Organizations, companies, institutions (e.g., Acme Corp, Supreme Court)
              - DATE: Calendar dates, time periods (e.g., January 1, 2023, Q2 2022)
              - LOCATION: Physical locations, addresses, geographical areas
        - LEGAL_TERM: Important legal terms, statutes, case names, document types`;
        
        // User prompt for NER
        const prompt = `Extract all named entities from the following text and return them in a JSON format like {"entities": [{"text": "entity text", "type": "ENTITY_TYPE"}, ...]}. Only include clearly identifiable entities:

${chunk}`;
        
        // Call Gemini model for entity extraction
        const content = await generateWithGemini(prompt, systemInstruction, 0.0);
        
        // Parse the JSON response
        try {
          const entityData = JSON.parse(content);
          if (Array.isArray(entityData.entities)) {
            allEntities.push(...entityData.entities);
          }
        } catch (parseError) {
          console.error("Error parsing entity JSON:", parseError);
        }
      } catch (chunkError) {
        console.error("Error processing chunk for NER:", chunkError);
        continue; // Skip this chunk on error but continue with others
      }
    }
    
    // Deduplicate entities (same text and type)
    const uniqueEntities = Array.from(
      new Map(
        allEntities.map(entity => [`${entity.text.toLowerCase()}_${entity.type}`, entity])
      ).values()
    );
    
    return uniqueEntities;
  } catch (error) {
    console.error("Error extracting entities:", error);
    return []; // Return empty array instead of throwing to allow process to continue
  }
}

/**
 * Generate text with Gemini 2.5 Pro
 * Helper function for NER and other text generation tasks
 */
async function generateWithGemini(
  prompt: string,
  systemInstruction: string,
  temperature: number = 0.0
): Promise<string> {
  try {
    // Format the request for Gemini
    const requestBody = {
      contents: [
        { role: "system", parts: [{ text: systemInstruction }] },
        { role: "user", parts: [{ text: prompt }] }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: 4096,
        topP: 0.95,
        topK: 64,
        responseMimeType: "application/json"
      }
    };
    
    // Get Google auth token
    const credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON!);
    const projectId = credentials.project_id;
    
    // Call Vertex AI API
    const apiUrl = `https://global-aiplatform.googleapis.com/v1/projects/${projectId}/locations/global/publishers/google/models/gemini-2.5-pro-preview-03-25:generateContent`;
    
    // Get auth token using imported function
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${await getGoogleAuthToken()}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    if (result.candidates && result.candidates.length > 0) {
      const content = result.candidates[0].content;
      if (content && content.parts && content.parts.length > 0) {
        return content.parts[0].text;
      }
    }
    
    throw new Error("No content generated");
  } catch (error) {
    console.error("Error in generateWithGemini:", error);
    throw error;
  }
}

/**
 * Store extracted entities in the database
 */
async function storeEntities(
  supabase: any, 
  entities: Entity[], 
  fileId: string, 
  projectId: string, 
  ownerId: string
): Promise<{ success: number, failed: number }> {
  let successCount = 0;
  let failedCount = 0;
  
  for (const entity of entities) {
    try {
      // Use upsert to handle the unique constraint
      const { error } = await supabase
        .from("entities")
        .insert({
          project_id: projectId,
          source_file_id: fileId,
          owner_id: ownerId,
          entity_text: entity.text,
          entity_type: entity.type
        })
        .onConflict(['project_id', 'source_file_id', 'lower(entity_text)', 'entity_type'])
        .ignore(); // Skip if already exists
      
      if (error) {
        console.error("Error storing entity:", error);
        failedCount++;
      } else {
        successCount++;
      }
    } catch (err) {
      console.error("Exception storing entity:", err);
      failedCount++;
    }
  }
  
  return { success: successCount, failed: failedCount };
}

/**
 * Extract text from a file
 * Reusing the logic from analyze-file function
 */
async function extractFileContent(supabase, filePath: string, contentType: string): Promise<string> {
  // Get file from storage
  const { data: fileData, error: fileError } = await supabase
    .storage
    .from('files')
    .download(filePath);
    
  if (fileError) {
    throw new Error(`Error downloading file: ${fileError.message}`);
  }
  
  // Extract text based on content type
  if (contentType.includes('pdf')) {
    // For PDFs, call Gemini API for text extraction
    return await extractTextFromPdf(fileData);
  } else if (contentType.includes('image')) {
    // For images, use OCR via Gemini
    return await extractTextFromImage(fileData);
  } else if (contentType.includes('text/plain')) {
    // For text files, read directly
    const text = await fileData.text();
    return text;
  } else if (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
            contentType.includes('application/msword')) {
    // For DOCX files
    const binaryStr = await fileData.text();
    const text = extractTextFromBinaryString(binaryStr);
    return text || "Unable to extract text from this document format";
  } else {
    // For other files, try to extract as text
    try {
      const text = await fileData.text();
      return text;
    } catch (error) {
      return "This file type is not supported for text extraction.";
    }
  }
}

function extractTextFromBinaryString(binaryStr: string): string {
  // Very simplified text extraction from binary document
  // In a production app, use a proper document parsing service
  let textContent = "";
  
  // Extract readable text by filtering out non-printable characters
  for (let i = 0; i < binaryStr.length; i++) {
    const charCode = binaryStr.charCodeAt(i);
    if (charCode >= 32 && charCode <= 126) {
      textContent += binaryStr.charAt(i);
    } else if (charCode === 10 || charCode === 13) {
      textContent += "\n";
    }
  }
  
  // Remove sequences of whitespace and other artifacts
  textContent = textContent.replace(/\s+/g, ' ');
  return textContent;
}

async function extractTextFromPdf(fileData: Blob): Promise<string> {
  // Use Gemini API for PDF processing with multimodal capabilities
  
  // Convert PDF to base64
  const arrayBuffer = await fileData.arrayBuffer();
  const base64String = btoa(
    new Uint8Array(arrayBuffer)
      .reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
  
  const systemInstruction = "You are an assistant that extracts all text content from PDFs accurately. Return ONLY the extracted text, maintaining important paragraph breaks.";
  const prompt = "Extract all the text from this PDF document. Return ONLY the extracted text, no commentary.";
  
  // Use the multimodal processing function
  return await processMultimodalContent(
    prompt,
    systemInstruction,
    base64String,
    "application/pdf",
    0.0
  );
}

async function extractTextFromImage(fileData: Blob): Promise<string> {
  // Convert image to base64
  const arrayBuffer = await fileData.arrayBuffer();
  const base64String = btoa(
    new Uint8Array(arrayBuffer)
      .reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
  
  // Determine MIME type from first few bytes (simplified)
  let mimeType = "image/jpeg"; // Default
  const bytes = new Uint8Array(arrayBuffer.slice(0, 4));
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    mimeType = "image/png";
  } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    mimeType = "image/gif";
  }
  
  const systemInstruction = "You are an OCR assistant that extracts text from images accurately. Return ONLY the extracted text, maintaining proper formatting and structure.";
  const prompt = "Extract all text content from this image. Return ONLY the text, no commentary.";
  
  // Use the multimodal processing function
  return await processMultimodalContent(
    prompt,
    systemInstruction,
    base64String,
    mimeType,
    0.0
  );
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get request body
    const { fileId, bucketName } = await req.json();

    // Validate inputs
    if (!fileId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: fileId" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get file info from the database
    const { data: fileData, error: fileError } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (fileError || !fileData) {
      return new Response(
        JSON.stringify({ error: `File not found: ${fileError?.message || "Unknown error"}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    const bucket = bucketName || "case-files";
    const filePath = fileData.storage_path;
    
    console.log(`Processing file ${fileId} from ${bucket}/${filePath}`);

    // 1. Process the file (extract text and generate thumbnail)
    const result = await processFile(fileId, supabase, bucket, filePath);

    // 2. Generate embeddings from the extracted text
    if (result.text) {
      await generateEmbeddings(result.text, fileId, supabase);
    } else {
      console.warn(`No text extracted from file ${fileId}. Skipping embedding generation.`);
    }

    // 3. Update file metadata in the database
    const { error: updateError } = await supabase
      .from("files")
      .update({
        processed: true,
        processing_status: "completed",
        processed_at: new Date().toISOString(),
        thumbnail_url: result.thumbnailUrl || null,
        extracted_text_length: result.text?.length || 0,
        metadata: {
          ...fileData.metadata,
          processing: {
            status: "success",
            timestamp: new Date().toISOString()
          }
        }
      })
      .eq("id", fileId);

    if (updateError) {
      throw new Error(`Failed to update file metadata: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        fileId,
        textLength: result.text?.length || 0,
        thumbnailUrl: result.thumbnailUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing file:", error);

    // Try to update the file status to show processing failed
    try {
      const { fileId } = await req.json();
      if (fileId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        await supabase
          .from("files")
          .update({
            processing_status: "failed",
            metadata: {
              processing: {
                status: "error",
                error: error.message,
                timestamp: new Date().toISOString()
              }
            }
          })
          .eq("id", fileId);
      }
    } catch (updateError) {
      console.error("Failed to update error status:", updateError);
    }

    return new Response(
      JSON.stringify({ error: `Processing failed: ${error.message}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
}); 

// Re-implement generateEmbeddings to use Google's API while maintaining the same interface
async function generateEmbeddings(
  text: string,
  fileId: string,
  supabase: SupabaseClient
): Promise<void> {
  try {
    // Delete any existing embeddings for this file
    await supabase
      .from("document_sections")
      .delete()
      .eq("file_id", fileId);
    
    // Split text into chunks
    const chunks = chunkText(text);
    
    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunk = chunks[i];
        
        // Generate embedding using Google's Vertex AI API
        const embedding = await generateEmbedding(chunk.text);
        
        if (!embedding) {
          throw new Error("Failed to generate embedding");
        }
        
        // Store the chunk and its embedding in the database
        const { error: insertError } = await supabase
          .from("document_sections")
          .insert({
            file_id: fileId,
            content: chunk.text,
            embedding,
            tokens: chunk.text.split(/\s+/).length, // Approximate token count
            section_index: i,
            metadata: {
              source: "file",
              section_type: "text_chunk"
            }
          });
        
        if (insertError) {
          throw new Error(`Failed to insert embedding: ${insertError.message}`);
        }
        
      } catch (chunkError) {
        console.error(`Error processing chunk ${i} for file ${fileId}:`, chunkError);
        // Continue with other chunks even if one fails
      }
    }
    
    console.log(`Successfully generated embeddings for file ${fileId}: ${chunks.length} chunks processed`);
  } catch (error) {
    console.error(`Error generating embeddings for file ${fileId}:`, error);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

// Text chunking for embedding generation
interface TextChunk {
  text: string;
}

function chunkText(text: string, maxChunkSize = 800): TextChunk[] {
  if (!text || text.length <= maxChunkSize) {
    return [{ text }];
  }

  const chunks: TextChunk[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    // Find a good place to break the chunk (at a paragraph or sentence)
    let chunkEndIndex = Math.min(currentIndex + maxChunkSize, text.length);
    
    // Try to break at paragraph
    const paragraphBreak = text.lastIndexOf('\n\n', chunkEndIndex);
    if (paragraphBreak > currentIndex && paragraphBreak > currentIndex + maxChunkSize / 2) {
      chunkEndIndex = paragraphBreak;
    } else {
      // Try to break at a sentence
      const sentenceBreak = text.lastIndexOf('. ', chunkEndIndex);
      if (sentenceBreak > currentIndex && sentenceBreak > currentIndex + maxChunkSize / 2) {
        chunkEndIndex = sentenceBreak + 1; // Include the period
      }
    }

    // Extract the chunk
    chunks.push({ text: text.substring(currentIndex, chunkEndIndex).trim() });
    
    // Move the current index, accounting for overlap
    currentIndex = chunkEndIndex;
  }

  return chunks;
} 
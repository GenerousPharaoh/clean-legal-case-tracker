// Follow Deno Edge Function conventions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";
import { processMultimodalContent, generateEmbedding, getGoogleAuthToken } from "../_shared/google_auth.ts";
import { handleCors, createJsonResponse, createErrorResponse } from "../_shared/cors.ts";

interface RequestBody {
  fileId: string;
  projectId: string;
}

interface ProcessingResult {
  extractedText?: string;
  thumbnailUrl?: string;
  chunkCount?: number;
  embeddingStatus?: string;
  error?: string;
}

// Initialize environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const GOOGLE_APPLICATION_CREDENTIALS_JSON = Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS_JSON");

// Check for required environment variables
if (!GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS_JSON");
}

// Maximum size per chunk in characters
const MAX_CHUNK_SIZE = 1000;
// Overlap between chunks in characters
const CHUNK_OVERLAP = 150;

serve(async (req: Request) => {
  try {
    // Handle CORS preflight requests
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    // Parse request body
    const { fileId, projectId } = (await req.json()) as RequestBody;
    
    // Validate required parameters
    if (!fileId || !projectId) {
      return createErrorResponse("fileId and projectId are required", 400);
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Fetch file information from the database
    const { data: fileData, error: fileError } = await supabase
      .from("files")
      .select("*, projects!inner(*)")
      .eq("id", fileId)
      .eq("projects.id", projectId)
      .single();
        
    // Handle file not found or access denied
    if (fileError || !fileData) {
      return createErrorResponse("File not found or access denied", 404);
    }
    
    // Start processing the file
    console.log(`Processing file: ${fileData.name} (${fileData.mime_type})`);
    
    // Update the file status to "processing"
    await supabase
      .from("files")
      .update({
        metadata: {
          ...fileData.metadata,
          text_extraction_status: "processing"
        }
      })
      .eq("id", fileId);
    
    // Download file from Supabase Storage
    const { data: fileContent, error: downloadError } = await supabase.storage
      .from("files")
      .download(`${fileData.project_id}/${fileData.name}`);
      
    // Handle download errors
    if (downloadError || !fileContent) {
      await updateFileStatus(supabase, fileId, fileData.metadata, "failed", "Failed to download file");
      return createErrorResponse("Failed to download file", 500);
    }

    // Process the file based on its mime type
    const result: ProcessingResult = {};
    const mimeType = fileData.mime_type || "application/octet-stream";
    
    try {
      // Step 1: Extract text from the file
      result.extractedText = await extractTextFromFile(fileContent, mimeType, fileData.name);
      
      // If no text could be extracted, update status and return error
      if (!result.extractedText || result.extractedText.trim() === "") {
        await updateFileStatus(supabase, fileId, fileData.metadata, "failed", "No text could be extracted");
        return createErrorResponse("No text could be extracted from the file", 422);
      }
      
      // Step 2: Generate thumbnail
      result.thumbnailUrl = await generateThumbnail(supabase, fileContent, mimeType, fileId, projectId);
      
      // Step 3: Chunk the extracted text
      const chunks = chunkText(result.extractedText, MAX_CHUNK_SIZE, CHUNK_OVERLAP);
      result.chunkCount = chunks.length;
      
      // Step 4: Generate embeddings for each chunk and store them
      await Promise.all(chunks.map(async (chunk, index) => {
        try {
          // Generate embedding
          const embedding = await generateEmbedding(chunk.text);
          
          // Store the chunk and its embedding
          await supabase
            .from("document_chunks")
            .insert({
              project_id: projectId,
              file_id: fileId,
              content: chunk.text,
              embedding: embedding,
              metadata: {
                ...chunk.metadata,
                sequence: index
              }
            });
        } catch (error) {
          console.error(`Error processing chunk ${index}:`, error);
          throw error; // Propagate error to be caught by the outer try-catch
        }
      }));
      
      // Step 5: Update file metadata
      await updateFileStatus(
        supabase, 
        fileId, 
        fileData.metadata, 
        "completed", 
        undefined, 
        result.thumbnailUrl, 
        result.chunkCount
      );
      
      result.embeddingStatus = "completed";
      
      return createJsonResponse({
        success: true,
        message: "File processed successfully",
        ...result
      });
    } catch (error) {
      console.error("Error processing file:", error);
      await updateFileStatus(supabase, fileId, fileData.metadata, "failed", error.message);
      return createErrorResponse(`Failed to process file: ${error.message}`, 500);
    }
  } catch (error) {
    console.error("Error handling request:", error);
    return createErrorResponse(error.message || "An unexpected error occurred", 500);
  }
});

/**
 * Extract text from a file using appropriate method based on mime type
 */
async function extractTextFromFile(fileContent: Blob, mimeType: string, fileName: string): Promise<string> {
  // Images (JPEG, PNG, WebP, etc.)
  if (mimeType.startsWith("image/")) {
    return await extractTextFromImage(fileContent);
  }
  
  // PDFs
  else if (mimeType === "application/pdf") {
    try {
      // First try direct text extraction
      const directText = await extractTextFromPdf(fileContent);
      
      // If direct extraction yields minimal text (likely image-based PDF),
      // fall back to OCR via Gemini Vision
      if (!directText || directText.trim().length < 100) {
        console.log("PDF appears to be image-based or has minimal text. Using OCR via Gemini Vision.");
        return await extractTextFromPdf(fileContent, true); // Force OCR
      }
      
      return directText;
    } catch (error) {
      console.error("Error in PDF extraction, falling back to OCR:", error);
      // Fall back to OCR on extraction failure
      return await extractTextFromPdf(fileContent, true);
    }
  }
  
  // Microsoft Word documents
  else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
           mimeType === "application/msword") {
    return await extractTextFromDocx(fileContent);
  }
  
  // Plain text files
  else if (mimeType.startsWith("text/") || mimeType === "application/json") {
    return await fileContent.text();
  }
  
  // Audio/Video files
  else if (mimeType.startsWith("audio/") || mimeType.startsWith("video/")) {
    return await transcribeAudioVideo(fileContent, mimeType);
  }
  
  // Other file types - attempt binary extraction
  else {
    return await extractTextFromBinaryFile(fileContent, `Extract text content from this ${mimeType} file.`);
  }
}

/**
 * Extract text from images using Gemini Vision
 */
async function extractTextFromImage(fileContent: Blob): Promise<string> {
  try {
    // Convert image to base64
    const buffer = await fileContent.arrayBuffer();
    const base64Data = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    
    // Use Gemini Vision to extract text
    const systemInstruction = "You are an OCR assistant. Extract all text content from this image faithfully. Format the extracted text as plain text with proper spacing and paragraph breaks. Only return the extracted text without commentary.";
    const prompt = "This is an image that may contain text. Extract all visible text from this image, maintaining the original structure and layout as much as possible. Only return the extracted text.";
    
    return await processMultimodalContent(prompt, systemInstruction, base64Data, fileContent.type, 0.1);
  } catch (error) {
    console.error("Image OCR error:", error);
    throw new Error("Failed to extract text from image");
  }
}

/**
 * Extract text from PDF documents
 * @param forceOcr If true, use Gemini Vision for OCR regardless of PDF type
 */
async function extractTextFromPdf(fileContent: Blob, forceOcr: boolean = false): Promise<string> {
  try {
    // Convert PDF to base64
    const buffer = await fileContent.arrayBuffer();
    const base64Data = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    
    // Use Gemini Vision for OCR on PDFs
    const systemInstruction = "You are a PDF text extraction assistant. Extract all text content from this PDF document faithfully. Format the extracted text as plain text with proper spacing and paragraph breaks. Only return the extracted text without commentary.";
    const prompt = "This is a PDF document. Extract all text content from it. Preserve the document structure and formatting as much as possible. Only return the extracted text.";
    
    return await processMultimodalContent(prompt, systemInstruction, base64Data, "application/pdf", 0.1);
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

/**
 * Extract text from DOCX files
 */
async function extractTextFromDocx(fileContent: Blob): Promise<string> {
  try {
    // Since Deno/Edge Functions have limited libraries for DOCX parsing,
    // we'll use Gemini's multimodal capabilities as a document parser
    
    // Convert DOCX to base64
    const buffer = await fileContent.arrayBuffer();
    const base64Data = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    
    const systemInstruction = "You are a document parser assistant. Extract all text content from this DOCX file faithfully, including headers, paragraphs, lists, and tables. Format as plain text with proper spacing.";
    const prompt = "This is a Microsoft Word (DOCX) file. Extract all text content from it. Preserve the document structure, formatting, and layout as much as possible. Only return the extracted text.";
    
    return await processMultimodalContent(
      prompt,
      systemInstruction,
      base64Data,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      0.0
    );
  } catch (error) {
    console.error("DOCX extraction error:", error);
    
    // Fallback to simple binary extraction
    return await extractTextFromBinaryFile(fileContent, "Extract all text from this Microsoft Word document.");
  }
}

/**
 * Extract text from general binary files
 */
async function extractTextFromBinaryFile(fileContent: Blob, promptPrefix: string): Promise<string> {
  try {
    // Convert file to base64
    const buffer = await fileContent.arrayBuffer();
    const base64Data = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    
    const systemInstruction = "Extract all readable text content from this file. Format the output as plain text, preserving paragraph breaks.";
    const prompt = `${promptPrefix} Focus only on extracting text content that would be visible to a user opening this file. Ignore binary/non-text content.`;
    
    return await processMultimodalContent(prompt, systemInstruction, base64Data, fileContent.type, 0.0);
  } catch (error) {
    console.error("Binary file extraction error:", error);
    throw new Error("Failed to extract text from file");
  }
}

/**
 * Transcribe audio/video files
 * This is a placeholder for integration with Google's Speech-to-Text API
 */
async function transcribeAudioVideo(fileContent: Blob, mimeType: string): Promise<string> {
  // NOTE: This function would need to be implemented with a call to Google's Speech-to-Text API
  // For now, we return a placeholder message and would need to be enhanced in a future phase
  
  console.log("Audio/Video transcription is not fully implemented in this phase");
  return "This is a placeholder for audio/video transcription. The full implementation would call Google's Speech-to-Text API.";
}

/**
 * Generate a thumbnail for the file
 */
async function generateThumbnail(
  supabase: any,
  fileContent: Blob,
  mimeType: string,
  fileId: string,
  projectId: string
): Promise<string | undefined> {
  try {
    // For PDFs, extract the first page as a thumbnail
    if (mimeType === "application/pdf") {
      return await generatePdfThumbnail(supabase, fileContent, fileId, projectId);
    }
    
    // For images, resize the image
    else if (mimeType.startsWith("image/")) {
      return await generateImageThumbnail(supabase, fileContent, fileId, projectId, mimeType);
    }
    
    // For videos, this would be implemented in a future phase
    else if (mimeType.startsWith("video/")) {
      console.log("Video thumbnail generation is deferred to a future phase");
      return undefined;
    }
    
    // For other file types, no thumbnail
    return undefined;
  } catch (error) {
    console.error("Thumbnail generation error:", error);
    return undefined;
  }
}

/**
 * Generate a thumbnail for a PDF
 */
async function generatePdfThumbnail(
  supabase: any,
  pdfContent: Blob,
  fileId: string,
  projectId: string
): Promise<string | undefined> {
  try {
    // For PDF thumbnails we'll use Gemini to "describe" the first page,
    // then use that description to generate a simple image representation
    
    // Convert PDF to base64
    const buffer = await pdfContent.arrayBuffer();
    const base64Data = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    
    // Use Supabase Storage Transformation API if available (requires setting up)
    // For now, we'll use a placeholder image as the thumbnail
    
    // Upload a placeholder thumbnail
    const thumbnailPath = `thumbnails/${fileId}.jpg`;
    
    // Create a sample thumbnail (would be replaced with actual PDF rendering)
    const response = await fetch("https://via.placeholder.com/150");
    const thumbnailBlob = await response.blob();
    
    // Upload the thumbnail to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("files")
      .upload(thumbnailPath, thumbnailBlob, {
        contentType: "image/jpeg",
        upsert: true
      });
    
    if (uploadError) {
      console.error("Error uploading thumbnail:", uploadError);
      return undefined;
    }
    
    // Get the public URL for the thumbnail
    const { data: publicUrlData } = await supabase.storage
      .from("files")
      .getPublicUrl(thumbnailPath);
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("PDF thumbnail generation error:", error);
    return undefined;
  }
}

/**
 * Generate a thumbnail for an image
 */
async function generateImageThumbnail(
  supabase: any,
  imageContent: Blob,
  fileId: string,
  projectId: string,
  mimeType: string
): Promise<string | undefined> {
  try {
    // Ideally, we would resize the image here
    // Since Deno Edge Functions have limited image processing capabilities,
    // we'll rely on Supabase Storage Transformations if available
    
    // For now, we'll just upload the original image as the thumbnail
    const thumbnailPath = `thumbnails/${fileId}.jpg`;
    
    // Upload the image as the thumbnail
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("files")
      .upload(thumbnailPath, imageContent, {
        contentType: "image/jpeg",
        upsert: true
      });
    
    if (uploadError) {
      console.error("Error uploading thumbnail:", uploadError);
      return undefined;
    }
    
    // Get the public URL for the thumbnail
    const { data: publicUrlData } = await supabase.storage
      .from("files")
      .getPublicUrl(thumbnailPath);
    
    // In a production environment, you would append transformation parameters to the URL
    // For example: `${publicUrlData.publicUrl}?width=150&height=150&fit=cover`
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Image thumbnail generation error:", error);
    return undefined;
  }
}

/**
 * Split text into chunks with metadata
 */
interface TextChunk {
  text: string;
  metadata: {
    pageNumber?: number;
    startChar: number;
    endChar: number;
  };
}

function chunkText(text: string, maxChunkSize: number, overlap: number): TextChunk[] {
  if (!text || text.trim().length === 0) {
    return [];
  }
  
  const chunks: TextChunk[] = [];
  
  // Detect page breaks (if present)
  const pageBreakPattern = /\n\s*[-]{3,}|\n\s*[=]{3,}|\n\s*\[Page\s+\d+\]|\n\s*Page\s+\d+\s*\n/g;
  const pageMarkers = [...text.matchAll(pageBreakPattern)].map(match => ({
    position: match.index!,
    length: match[0].length,
  }));
  
  // Function to determine page number for a given position
  const getPageNumber = (position: number): number => {
    if (pageMarkers.length === 0) return 1;
    
    let pageNum = 1;
    for (const marker of pageMarkers) {
      if (position > marker.position) {
        pageNum++;
      } else {
        break;
      }
    }
    return pageNum;
  };
  
  // Use paragraph breaks as natural splitting points
  const paragraphs = text.split(/\n\s*\n/);
  
  let currentChunk = "";
  let startChar = 0;
  let currentStartChar = 0;
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed chunk size and we already have content,
    // save current chunk and start a new one
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk,
        metadata: {
          pageNumber: getPageNumber(startChar),
          startChar: startChar,
          endChar: startChar + currentChunk.length
        }
      });
      
      // Calculate new start position, accounting for overlap
      const overlapStart = Math.max(0, currentChunk.length - overlap);
      currentChunk = currentChunk.substring(overlapStart) + "\n\n" + paragraph;
      startChar = startChar + overlapStart;
    } else {
      // Otherwise add to current chunk
      currentChunk += (currentChunk.length > 0 ? "\n\n" : "") + paragraph;
    }
    
    currentStartChar += paragraph.length + 2; // +2 for the paragraph breaks
  }
  
  // Add the last chunk if it has content
  if (currentChunk.length > 0) {
    chunks.push({
      text: currentChunk,
      metadata: {
        pageNumber: getPageNumber(startChar),
        startChar: startChar,
        endChar: startChar + currentChunk.length
      }
    });
  }
  
  return chunks;
}

/**
 * Update file status in the database
 */
async function updateFileStatus(
  supabase: any,
  fileId: string,
  currentMetadata: any = {},
  status: string,
  errorMessage?: string,
  thumbnailUrl?: string,
  chunkCount?: number
): Promise<void> {
  const metadata = {
    ...currentMetadata,
    text_extraction_status: status
  };
  
  if (errorMessage) {
    metadata.text_extraction_error = errorMessage;
  }
  
  if (thumbnailUrl) {
    metadata.thumbnailUrl = thumbnailUrl;
  }
  
  if (chunkCount !== undefined) {
    metadata.chunkCount = chunkCount;
  }
  
  await supabase
    .from("files")
    .update({ metadata })
    .eq("id", fileId);
} 
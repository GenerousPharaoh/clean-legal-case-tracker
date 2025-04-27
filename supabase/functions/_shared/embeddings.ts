import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { generateEmbedding } from "./google_auth.ts";

// Constants for text chunking
const MAX_CHUNK_SIZE = 1000; // Maximum tokens per chunk
const CHUNK_OVERLAP = 200;  // Token overlap between chunks

/**
 * Generate embeddings for a text document and store them in the database
 * 
 * @param text The full text to generate embeddings for
 * @param fileId The ID of the file in the database
 * @param supabase Initialized Supabase client
 */
export async function generateEmbeddings(
  text: string,
  fileId: string,
  supabase: SupabaseClient
): Promise<void> {
  try {
    // Delete any existing embeddings for this file
    await deleteExistingEmbeddings(fileId, supabase);
    
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
            start_position: chunk.startPosition,
            end_position: chunk.endPosition,
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

/**
 * Delete existing embeddings for a file from the database
 */
async function deleteExistingEmbeddings(
  fileId: string,
  supabase: SupabaseClient
): Promise<void> {
  try {
    const { error } = await supabase
      .from("document_sections")
      .delete()
      .eq("file_id", fileId);
    
    if (error) {
      throw new Error(`Failed to delete existing embeddings: ${error.message}`);
    }
  } catch (error) {
    console.error(`Error deleting existing embeddings for file ${fileId}:`, error);
    throw error;
  }
}

interface TextChunk {
  text: string;
  startPosition: number;
  endPosition: number;
}

/**
 * Split text into chunks of manageable size for embedding generation
 */
function chunkText(text: string): TextChunk[] {
  // Split text into paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const chunks: TextChunk[] = [];
  
  let currentChunk = "";
  let startPosition = 0;
  let currentPosition = 0;
  
  for (const paragraph of paragraphs) {
    // Approximate token count (rough estimate)
    const paragraphTokens = paragraph.split(/\s+/).length;
    
    // If adding this paragraph would exceed max size, start a new chunk
    if (currentChunk.length > 0 && 
        currentChunk.split(/\s+/).length + paragraphTokens > MAX_CHUNK_SIZE) {
      // Add current chunk to the list
      chunks.push({ 
        text: currentChunk.trim(), 
        startPosition, 
        endPosition: currentPosition 
      });
      
      // Start a new chunk with overlap
      // Go back a few sentences to create context overlap
      const sentences = currentChunk.split(/(?<=[.!?])\s+/);
      const overlapSentences = sentences.slice(Math.max(0, sentences.length - Math.ceil(CHUNK_OVERLAP / 10)));
      currentChunk = overlapSentences.join(" ") + " " + paragraph;
      
      // Update positions
      startPosition = Math.max(0, currentPosition - overlapSentences.join(" ").length);
    } else {
      // Add paragraph to current chunk
      if (currentChunk.length > 0) {
        currentChunk += " " + paragraph;
      } else {
        currentChunk = paragraph;
      }
    }
    
    currentPosition += paragraph.length + 2; // +2 for the newlines
  }
  
  // Add the last chunk if it's not empty
  if (currentChunk.trim().length > 0) {
    chunks.push({ 
      text: currentChunk.trim(), 
      startPosition, 
      endPosition: currentPosition 
    });
  }
  
  return chunks;
}

/**
 * Query for similar documents using vector search
 */
export async function querySimilarDocuments(
  query: string,
  supabase: SupabaseClient,
  limit: number = 5,
  fileId?: string
): Promise<any[]> {
  try {
    // Generate embedding for the query using Google's Vertex AI
    const embedding = await generateEmbedding(query);
    
    if (!embedding) {
      throw new Error("Failed to generate query embedding");
    }
    
    // Construct the query
    let matchQuery = supabase
      .rpc("match_documents", { 
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: limit
      });
    
    // Add file filter if needed
    if (fileId) {
      matchQuery = matchQuery.eq("file_id", fileId);
    }
    
    // Execute the query
    const { data: matches, error } = await matchQuery;
    
    if (error) {
      throw new Error(`Failed to query similar documents: ${error.message}`);
    }
    
    return matches || [];
  } catch (error) {
    console.error("Error querying similar documents:", error);
    throw error;
  }
} 
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { encode as encodeBase64 } from "https://deno.land/std@0.217.0/encoding/base64.ts";
import { generateEmbedding as googleGenerateEmbedding } from "./google_auth.ts";

const MAX_TOKENS_PER_CHUNK = 1000;
const OVERLAP_TOKENS = 200;
const CHUNK_METADATA_FIELDS = ["fileId", "fileName", "chunkIndex", "totalChunks", "createdAt"];

interface EmbeddingChunk {
  fileId: string;
  fileName: string;
  content: string;
  chunkIndex: number;
  totalChunks: number;
  embedding?: number[];
  createdAt: string;
}

/**
 * Generate embeddings for the extracted text
 * @param fileId - The ID of the file
 * @param fileName - The name of the file
 * @param text - The text to generate embeddings for
 * @param supabase - Supabase client
 * @returns Number of chunks processed
 */
export async function generateEmbeddings(
  fileId: string,
  fileName: string,
  text: string | null,
  supabase: SupabaseClient
): Promise<number> {
  if (!text || text.trim() === '') {
    console.warn(`No text to generate embeddings for file: ${fileId}`);
    return 0;
  }

  try {
    // Split text into appropriate chunks
    const textChunks = chunkText(text);
    
    // Prepare chunks with metadata
    const chunks: EmbeddingChunk[] = textChunks.map((content, index) => ({
      fileId,
      fileName,
      content,
      chunkIndex: index + 1,
      totalChunks: textChunks.length,
      createdAt: new Date().toISOString()
    }));
    
    console.log(`Generated ${chunks.length} chunks for file: ${fileId}`);
    
    // Process chunks in batches to avoid overwhelming the embedding service
    const BATCH_SIZE = 5;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      await processChunkBatch(batch, supabase);
      console.log(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(chunks.length / BATCH_SIZE)}`);
    }
    
    return chunks.length;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
}

/**
 * Split text into chunks appropriate for embeddings
 */
function chunkText(text: string): string[] {
  // Simple chunking by approximate token count
  // A more sophisticated approach would consider sentence boundaries,
  // paragraphs, and semantic coherence
  
  // Roughly estimate tokens (words + punctuation)
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += MAX_TOKENS_PER_CHUNK - OVERLAP_TOKENS) {
    const chunk = words.slice(i, i + MAX_TOKENS_PER_CHUNK).join(' ');
    chunks.push(chunk);
  }
  
  return chunks;
}

/**
 * Process a batch of chunks to generate embeddings and store them
 */
async function processChunkBatch(
  chunks: EmbeddingChunk[],
  supabase: SupabaseClient
): Promise<void> {
  // Generate embeddings for each chunk
  const embeddedChunks = await Promise.all(
    chunks.map(async (chunk) => {
      const embedding = await generateEmbedding(chunk.content);
      return {
        ...chunk,
        embedding
      };
    })
  );
  
  // Store chunks with embeddings in the database
  for (const chunk of embeddedChunks) {
    const { error } = await supabase
      .from('document_chunks')
      .insert({
        file_id: chunk.fileId,
        file_name: chunk.fileName,
        content: chunk.content,
        embedding: chunk.embedding,
        chunk_index: chunk.chunkIndex,
        total_chunks: chunk.totalChunks,
        metadata: {
          fileId: chunk.fileId,
          fileName: chunk.fileName,
          chunkIndex: chunk.chunkIndex,
          totalChunks: chunk.totalChunks,
          createdAt: chunk.createdAt
        }
      });
      
    if (error) {
      console.error(`Error storing chunk ${chunk.chunkIndex} for file ${chunk.fileId}:`, error);
    }
  }
}

/**
 * Generate an embedding for a single text chunk
 * Uses Google Cloud's Vertex AI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Use Google Cloud's Vertex AI embeddings API
    return await googleGenerateEmbedding(text);
  } catch (error) {
    console.error("Error generating embedding:", error);
    // Return a placeholder embedding in case of failure
    // This is not ideal but prevents the entire process from failing
    return Array(768).fill(0); // Updated dimension for Google's embedding models
  }
} 
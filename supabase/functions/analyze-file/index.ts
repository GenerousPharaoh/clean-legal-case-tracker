// Follow Deno Edge Function conventions
import { serve } from "https://deno.land/std@0.217.0/http/server.ts";
import { getCorsHeaders, createJsonResponse, createErrorResponse, handleCors } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { processFile } from "../_shared/fileProcessor.ts";
import { generateEmbeddings } from "../_shared/embeddingsGenerator.ts";

interface AnalyzeFileRequest {
  fileId: string;
  bucket: string;
  filePath: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { fileId, bucket, filePath } = await req.json() as AnalyzeFileRequest;

    if (!fileId || !bucket || !filePath) {
      return createErrorResponse("Missing required parameters: fileId, bucket, or filePath", 400);
    }

    console.log(`Processing file: ${fileId} at ${bucket}/${filePath}`);

    // Create a Supabase client with the project URL and key from environment variables
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get file metadata to determine how to process it
    const { data: fileData, error: fileError } = await supabaseClient
      .from("files")
      .select("file_name, file_type, content_type")
      .eq("id", fileId)
      .single();

    if (fileError || !fileData) {
      const errorMsg = `Failed to fetch file metadata: ${fileError?.message || "File not found"}`;
      console.error(errorMsg);
      return createErrorResponse(errorMsg, 404);
    }

    // Process the file to extract text and generate thumbnail
    const result = await processFile(fileId, supabaseClient, bucket, filePath);

    console.log(`File processing result:`, {
      fileId,
      hasText: !!result.text,
      hasThumbnail: !!result.thumbnailUrl,
      error: result.error
    });

    // Update file metadata in the database
    const { error: updateError } = await supabaseClient
      .from("files")
      .update({
        text_extracted: !!result.text,
        thumbnail_url: result.thumbnailUrl,
        extraction_error: result.error,
        last_processed_at: new Date().toISOString(),
      })
      .eq("id", fileId);

    if (updateError) {
      console.error(`Failed to update file metadata: ${updateError.message}`);
    }

    // Generate embeddings if text was extracted
    let embeddingsCount = 0;
    if (result.text) {
      try {
        embeddingsCount = await generateEmbeddings(
          fileId,
          fileData.file_name,
          result.text, 
          supabaseClient
        );

        // Update file with embeddings status
        await supabaseClient
          .from("files")
          .update({
            embeddings_generated: true,
            embeddings_count: embeddingsCount,
          })
          .eq("id", fileId);
          
        console.log(`Generated ${embeddingsCount} embeddings for file: ${fileId}`);
      } catch (embeddingError) {
        console.error(`Error generating embeddings: ${embeddingError.message}`);
        
        // Update file with embedding error
        await supabaseClient
          .from("files")
          .update({
            embeddings_generated: false,
            extraction_error: `Embedding error: ${embeddingError.message}`,
          })
          .eq("id", fileId);
      }
    }

    return createJsonResponse({
      success: true,
      fileId,
      text_extracted: !!result.text,
      thumbnail_url: result.thumbnailUrl,
      embeddings_count: embeddingsCount,
      error: result.error,
    });
  } catch (error) {
    console.error("Error processing file:", error);
    return createErrorResponse(`Failed to process file: ${error.message}`, 500);
  }
}); 
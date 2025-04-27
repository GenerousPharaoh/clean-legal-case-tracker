// Follow Deno Edge Function conventions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";
import { generateEmbedding, generateWithGemini } from "../_shared/google_auth.ts";
import { handleCors, createJsonResponse, createErrorResponse } from "../_shared/cors.ts";

interface RequestBody {
  projectId: string;
  question: string;
  includeDocumentSections?: boolean;
  namespacesToSearch?: string[];
}

// Initialize environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const GOOGLE_APPLICATION_CREDENTIALS_JSON = Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS_JSON");

// Check for required environment variables
if (!GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS_JSON");
    }

// Maximum number of documents to use in context
const MAX_DOCS_TO_USE = 5;

serve(async (req: Request) => {
  try {
    // Handle CORS preflight requests
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    // Parse request body
    const { 
      projectId, 
      question, 
      includeDocumentSections = false,
      namespacesToSearch = ["default"] 
    } = (await req.json()) as RequestBody;
    
    // Validate required parameters
    if (!projectId || !question) {
      return createErrorResponse("projectId and question are required", 400);
    }
    
    if (question.trim().length < 3) {
      return createErrorResponse("Question is too short", 400);
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Check if the project exists and the user has access
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("id, name")
      .eq("id", projectId)
      .single();
      
    // Handle project not found or access denied
    if (projectError || !projectData) {
      return createErrorResponse("Project not found or access denied", 404);
    }
    
    // Generate embedding for the question using Google's text-embedding model
    const questionEmbedding = await generateEmbedding(question);
    
    // Search for relevant document sections using vector similarity
    const { data: relevantDocs, error: searchError } = await supabase.rpc(
      'match_embeddings',
        {
          query_embedding: questionEmbedding, 
        match_threshold: 0.5, // Similarity threshold
        match_count: MAX_DOCS_TO_USE, // Return top matches
        p_project_id: projectId,
        p_namespaces: namespacesToSearch
      }
    );
        
    if (searchError) {
      return createErrorResponse(`Vector search failed: ${searchError.message}`, 500);
      }
      
    if (!relevantDocs || relevantDocs.length === 0) {
      // If no relevant documents found, generate a generic response
      const genericResponse = await generateWithGemini(
        `Question about project "${projectData.name}": ${question}\n\nPlease respond that no relevant information was found in the project documents.`,
        "You are a helpful legal assistant. The user is asking about a legal project, but no relevant documents were found. Politely explain this and suggest they upload relevant documents to get better answers."
      );
      
      return createJsonResponse({
        answer: genericResponse,
        relevantDocuments: [],
      });
      }
      
    // Extract content from relevant documents
    const documentSections = relevantDocs.map(doc => ({
      content: doc.content,
      docId: doc.doc_id,
      similarity: doc.similarity,
      metadata: doc.metadata
    }));
    
    // Combine document sections for context
    const context = documentSections.map(doc => doc.content).join("\n\n---\n\n");
    
    // Generate the answer using Gemini
    const prompt = `
    Project: ${projectData.name}
    
    Question: ${question}
    
    Relevant document sections:
    ${context}
    
    Based on the above information from the project documents, please answer the question.
    If the answer cannot be determined from the provided context, state so clearly.
    `;
    
    const systemInstruction = "You are a helpful legal assistant working with a team of attorneys. Answer questions based ONLY on the provided document sections. If the answer isn't in the context, clearly state that you don't have enough information rather than making something up. Use a professional tone suited for legal professionals.";
    
    const answer = await generateWithGemini(prompt, systemInstruction);
    
    // Return the final response
    return createJsonResponse({
        answer,
      relevantDocuments: includeDocumentSections ? documentSections : undefined,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return createErrorResponse(error.message || "An unexpected error occurred", 500);
  }
}); 
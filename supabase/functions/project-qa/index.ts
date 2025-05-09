import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { generateText, generateEmbeddings } from "../utils/googleai.ts";
import { getMatchingDocumentChunks, getProject } from "../utils/database.ts";

interface RequestParams {
  projectId: string;
  question: string;
  limit?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { projectId, question, limit = 5 } = await req.json() as RequestParams;

    if (!projectId || !question) {
      return new Response(
        JSON.stringify({ error: "Project ID and question are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get project details to verify it exists
    const project = await getProject(projectId);
    if (!project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate embedding for question
    const questionEmbedding = await generateEmbeddings(question);

    // Get relevant document chunks using vector search
    const matchingChunks = await getMatchingDocumentChunks(projectId, questionEmbedding, limit);

    if (!matchingChunks || matchingChunks.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No relevant documents found to answer the question",
          answer: "I don't have enough information about this project to answer your question."
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Combine matching chunks as context
    const context = matchingChunks.map(chunk => chunk.chunk_text).join("\n\n");

    // Build prompt for Gemini
    const prompt = `
    You are an AI legal assistant helping with a legal case analysis. Answer the question based ONLY on the provided context from case documents.

    CONTEXT:
    """
    ${context}
    """

    QUESTION: ${question}

    Provide a clear, direct answer that is supported by the context. If the context doesn't contain relevant information to answer, indicate that you don't have enough information. Include citations from specific documents when appropriate.

    If the question is related to legal advice or strategy, emphasize that your answer should be reviewed by a qualified legal professional and is not a substitute for professional legal advice.

    Format your response as a JSON object with the following structure:
    {
      "answer": "Your comprehensive answer here.",
      "confidence": 0.85, // A value between 0-1 representing how confident you are in the answer
      "citations": [{"text": "quoted text", "source": "context identifier"}],
      "needsAttorneyReview": true/false // Whether this should be reviewed by an attorney
    }
    `;

    // Generate answer using Gemini
    const responseText = await generateText(prompt);
    
    // Parse the response
    let response;
    try {
      response = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", e);
      
      // Attempt a simple fallback response
      return new Response(
        JSON.stringify({ 
          answer: responseText,
          confidence: 0.5,
          citations: [],
          needsAttorneyReview: true,
          parseFailed: true
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Return the processed response
    return new Response(
      JSON.stringify({
        ...response,
        matchingChunks: matchingChunks.map(chunk => ({
          id: chunk.id,
          similarity: chunk.similarity,
          preview: chunk.chunk_text.substring(0, 200) + '...' // Just a preview of the text
        }))
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in project-qa function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process question",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}); 
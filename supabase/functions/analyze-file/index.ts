import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors } from '../_shared/cors.ts';
import { generateText, generateEmbeddings } from '../utils/googleai.ts';
import { getFile, saveDocumentChunks } from '../utils/database.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

interface RequestParams {
  fileId: string;
}

// Parse file text based on file type
async function extractTextContent(fileId: string, fileType: string, storagePath: string) {
  // Create a Supabase client with the service role key
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  // Download the file
  const { data: fileData, error: downloadError } = await supabaseAdmin
    .storage
    .from('files')
    .download(storagePath);

  if (downloadError) {
    throw new Error(`Error downloading file: ${downloadError.message}`);
  }

  // Get file text based on type
  let text = '';
  
  // Simple extraction for text-based files
  if (fileType === 'pdf' || fileType === 'txt' || fileType === 'docx') {
    // For PDF files, we'd typically use a PDF extractor
    // For simplicity, we're extracting the first part as text
    const textDecoder = new TextDecoder();
    const bytes = new Uint8Array(await fileData.arrayBuffer());
    text = textDecoder.decode(bytes.slice(0, 10000)); // First 10KB for demo
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }
  
  return text;
}

// Split text into chunks for embedding
function chunkText(text: string, chunkSize = 1000, overlapSize = 200) {
  if (!text) return [];
  
  const chunks = [];
  let i = 0;
  
  while (i < text.length) {
    // Get chunk with overlap
    const chunk = text.slice(i, i + chunkSize);
    chunks.push(chunk);
    
    // Move forward accounting for overlap
    i += (chunkSize - overlapSize);
  }
  
  return chunks;
}

serve(async (req) => {
  // Handle CORS preflight and attach headers
  const preflightResponse = handleCors(req);
  if (preflightResponse) return preflightResponse;

  // Call main logic and then attach CORS headers
  const response = await (async () => {
    try {
      // Parse request body
      const { fileId } = await req.json() as RequestParams;
      if (!fileId) {
        return new Response(JSON.stringify({ error: 'File ID is required' }), { status: 400 });
      }

      // Get file details
      const file = await getFile(fileId);
      if (!file) {
        return new Response(
          JSON.stringify({ error: 'File not found' }),
          {
            status: 404,
          }
        );
      }

      // Extract text from file
      const fileText = await extractTextContent(fileId, file.file_type, file.storage_path);
      
      // Truncate text if it's too long for analysis
      const truncatedText = fileText.length > 10000 ? fileText.substring(0, 10000) + '...' : fileText;

      // Build prompt for Gemini 2.5 Pro
      const prompt = `
      I need you to analyze the following text extracted from a legal document and provide key insights.
      
      Document text:
      """
      ${truncatedText}
      """
      
      Please analyze this document and extract the following:
      
      1. Summary: A concise summary of the document content (3-5 sentences)
      2. Document Type: What type of legal document this appears to be
      3. Key People/Entities: Any persons, organizations, or entities mentioned
      4. Critical Dates: Important dates mentioned and their significance
      5. Legal Issues: Key legal issues, claims, or arguments identified
      6. Key Facts: Important factual assertions made in the document
      7. Relevant Law: Any statutes, regulations, or case law referenced
      
      Format your response as a JSON object with the following structure:
      {
        "summary": "Brief document summary",
        "documentType": "Type of legal document",
        "keyEntities": [{"name": "Entity name", "role": "Role in document"}],
        "keyDates": [{"date": "YYYY-MM-DD", "significance": "Why this date matters"}],
        "legalIssues": ["Issue 1", "Issue 2"],
        "keyFacts": ["Fact 1", "Fact 2"],
        "relevantLaw": ["Law reference 1", "Law reference 2"],
        "suggestedKeywords": ["keyword1", "keyword2", "keyword3"]
      }
      `;

      // Generate analysis using Gemini
      const analysisText = await generateText(prompt);
      
      // Parse the response
      let analysis;
      try {
        analysis = JSON.parse(analysisText);
      } catch (e) {
        console.error("Failed to parse Gemini response as JSON:", e);
        return new Response(
          JSON.stringify({ 
            error: "Failed to parse analysis result", 
            rawResponse: analysisText 
          }),
          {
            status: 500,
          }
        );
      }

      // Process text for embeddings
      const chunks = chunkText(fileText);
      const chunkRecords = [];
      
      // Generate embeddings for each chunk
      for (const chunkText of chunks) {
        try {
          const embedding = await generateEmbeddings(chunkText);
          
          chunkRecords.push({
            file_id: fileId,
            project_id: file.project_id,
            owner_id: file.owner_id,
            chunk_text: chunkText,
            embedding: embedding
          });
        } catch (error) {
          console.error("Error generating embeddings:", error);
        }
      }
      
      // Save chunks and embeddings to database
      if (chunkRecords.length > 0) {
        await saveDocumentChunks(chunkRecords);
      }

      // Return the analysis result
      return new Response(
        JSON.stringify({
          analysis,
          chunksProcessed: chunkRecords.length
        }),
        {
          status: 200,
        }
      );
    } catch (error) {
      console.error("Error in analyze-file function:", error);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to analyze file",
          details: error.message 
        }),
        {
          status: 500,
        }
      );
    }
  })();
  return handleCors(req, new Response(response.body, response));
}); 
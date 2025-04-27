import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getNextExhibitId } from '../_shared/utils.ts';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.1.1';

interface RequestBody {
  fileId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Parse request body
    const { fileId } = await req.json() as RequestBody;
    
    if (!fileId) {
      return new Response(
        JSON.stringify({ error: 'fileId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create Supabase client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get Supabase URL and service role key from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    // Get the API key for Google Gemini
    const googleApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ error: 'Google API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get user ID from JWT for authorization check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch the file data
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .select('name, project_id, owner_id, metadata')
      .eq('id', fileId)
      .single();
    
    if (fileError || !fileData) {
      return new Response(
        JSON.stringify({ error: 'File not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Verify user owns this file
    if (fileData.owner_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized access to file' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the next exhibit ID for this project
    const suggestedExhibitId = await getNextExhibitId(fileData.project_id);
    
    // Get file content for AI processing
    let contentSnippet = '';
    let entities = [];
    
    // Try to get content from document_chunks
    const { data: chunkData, error: chunkError } = await supabase
      .from('document_chunks')
      .select('content')
      .eq('file_id', fileId)
      .order('chunk_index', { ascending: true })
      .limit(1);
    
    if (!chunkError && chunkData && chunkData.length > 0) {
      contentSnippet = chunkData[0].content.slice(0, 500);
    }
    
    // Try to get entities from entities table
    const { data: entityData, error: entityError } = await supabase
      .from('entities')
      .select('name, type')
      .eq('file_id', fileId)
      .limit(5);
    
    if (!entityError && entityData && entityData.length > 0) {
      entities = entityData.map(e => `${e.name} (${e.type})`);
    }
    
    // Get file extension
    const originalName = fileData.name;
    const fileExtMatch = originalName.match(/\.([^.]+)$/);
    const fileExt = fileExtMatch ? fileExtMatch[0] : '';
    
    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(googleApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    // Construct prompt
    const prompt = `
      Act as a legal paralegal. Given:
      
      - Original filename: "${originalName}"
      - Content snippet: "${contentSnippet}"
      - Key entities: "${entities.join(', ')}"
      
      Suggest 3 concise, descriptive filenames (50-70 chars) suitable for a legal case file.
      Incorporate document type, key parties, date, or subject. Preserve the file extension.
      Return ONLY the 3 suggestions as a JSON array of strings, no additional text.
    `;
    
    // Call Vertex AI
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse suggestions from AI response
    let suggestedNames: string[] = [];
    try {
      // Try to parse as JSON directly
      suggestedNames = JSON.parse(text);
    } catch (e) {
      // If direct parsing fails, try to extract JSON array from text
      const match = text.match(/\[([\s\S]*)\]/);
      if (match) {
        try {
          suggestedNames = JSON.parse(`[${match[1]}]`);
        } catch (e2) {
          // If still fails, extract individual items
          suggestedNames = text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('"') || line.startsWith("'"))
            .map(line => {
              // Clean up the line to make it valid JSON
              line = line.replace(/,$/, '');
              try {
                return JSON.parse(line);
              } catch (e) {
                return line.replace(/^["']|["'],?$/g, '');
              }
            });
        }
      }
      
      if (suggestedNames.length === 0) {
        // Last resort: just split by newlines and clean up
        suggestedNames = text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.startsWith('[') && !line.startsWith(']'));
      }
    }
    
    // Ensure we have at least one suggestion
    if (suggestedNames.length === 0) {
      // Fallback to basic suggestion
      const fileNameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
      suggestedNames = [
        `${fileNameWithoutExt} - Legal Document${fileExt}`,
        `Case Document - ${fileNameWithoutExt}${fileExt}`,
        `Legal Filing - ${fileNameWithoutExt}${fileExt}`
      ];
    }
    
    // Format suggestions with exhibit ID
    const suggestedFullNames = suggestedNames.map(name => {
      // Preserve file extension if present in AI-generated name
      if (name.match(/\.[^/.]+$/)) {
        return `${suggestedExhibitId} - ${name}`;
      }
      
      // Add extension if missing
      return `${suggestedExhibitId} - ${name}${fileExt}`;
    });
    
    // Return the results
    return new Response(
      JSON.stringify({
        suggestedExhibitId,
        suggestedFullNames,
        originalName: fileData.name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 
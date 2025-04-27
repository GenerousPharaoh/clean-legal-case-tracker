import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { handleCors, getCorsHeaders, createJsonResponse, createErrorResponse } from '../_shared/cors.ts';

console.log('Accept invite function loaded');

interface AcceptInviteRequest {
  token: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Create a Supabase client with the Auth context of the function
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      return createErrorResponse('Missing authorization header', 401);
    }

    // Get request payload
    const { token } = await req.json() as AcceptInviteRequest;

    // Validate input
    if (!token) {
      return createErrorResponse('Missing invitation token', 400);
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the authenticated user
    const jwtToken = authorization.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwtToken);
    
    if (userError || !user) {
      return createErrorResponse('Invalid user token', 401);
    }

    // Find the invitation
    const { data: invite, error: inviteError } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('invite_token', token)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invite) {
      return createErrorResponse('Invalid or expired invitation token', 400);
    }

    // Check if this invitation was for a specific email that matches the current user
    if (invite.email && invite.email.toLowerCase() !== user.email?.toLowerCase()) {
      return createErrorResponse('This invitation was sent to a different email address', 403);
    }

    // Accept the invitation
    const { data: updatedInvite, error: updateError } = await supabase
      .from('project_collaborators')
      .update({
        user_id: user.id,
        email: null, // Clear email as we now have a user ID
        status: 'accepted',
        invite_token: null, // Clear the token as it's no longer needed
        accepted_at: new Date().toISOString()
      })
      .eq('id', invite.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error accepting invitation:', updateError);
      return createErrorResponse('Failed to accept invitation', 500);
    }

    // Get project details to return
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, created_at')
      .eq('id', invite.project_id)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError);
    }

    return createJsonResponse({ 
      success: true, 
      message: 'Invitation accepted successfully',
      collaboration: updatedInvite,
      project
    });

  } catch (error) {
    console.error('Error in accept-invite function:', error);
    return createErrorResponse('Internal server error', 500);
  }
}) 
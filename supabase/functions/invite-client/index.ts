import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';
import { generateToken } from '../_shared/utils.ts';

console.log('Invite client function loaded');

interface InviteClientRequest {
  projectId: string;
  clientEmail: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get request payload
    const { projectId, clientEmail } = await req.json() as InviteClientRequest;

    // Validate input
    if (!projectId || !clientEmail) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!clientEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the authenticated user
    const token = authorization.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify the user is the project owner
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, owner_id')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: 'You do not have permission to invite to this project' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user with this email already exists
    const { data: existingUsers } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', clientEmail.toLowerCase())
      .limit(1);

    const existingUserId = existingUsers?.length > 0 ? existingUsers[0].id : null;

    // Check if this user is already invited or is a collaborator
    const { data: existingInvite, error: inviteError } = await supabase
      .from('project_collaborators')
      .select('id, status')
      .eq('project_id', projectId)
      .or(`user_id.eq.${existingUserId || null},email.eq.${clientEmail.toLowerCase()}`);

    if (existingInvite && existingInvite.length > 0) {
      // Already invited
      return new Response(JSON.stringify({
        error: 'This user is already invited to this project',
        invite: existingInvite[0]
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate a unique token for the invite
    const inviteToken = generateToken(32);

    // Create the invite
    const { data: invite, error: createError } = await supabase
      .from('project_collaborators')
      .insert([{
        project_id: projectId,
        user_id: existingUserId,
        email: existingUserId ? null : clientEmail.toLowerCase(),
        role: 'client_uploader',
        invited_by: user.id,
        invite_token: inviteToken,
        status: 'pending'
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating invite:', createError);
      return new Response(JSON.stringify({ error: 'Failed to create invitation' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Construct invite URL
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/accept-invite?token=${inviteToken}`;

    // In a real app, we would send an email here using an email service
    // For now, we'll just return the invite URL
    // TODO: Implement actual email sending using a service like SendGrid or Resend

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Invitation created successfully',
      invite,
      inviteUrl
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in invite-client function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}) 
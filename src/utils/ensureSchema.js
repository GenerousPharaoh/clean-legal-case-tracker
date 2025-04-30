/**
 * Schema Assurance Utility
 * This utility ensures the database schema is accessible regardless of cache state
 */

// Function to ensure a profile exists for a user
export async function ensureProfileExists(supabase, userId) {
  if (!userId) return null;
  
  try {
    // Check if profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profile) return profile;
    
    // Get user data
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    // Create profile
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        first_name: user.email?.split('@')[0] || 'User',
        email: user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    return newProfile;
  } catch (error) {
    console.error('Error ensuring profile exists:', error);
    return null;
  }
}

// Function to create a case with full schema compatibility
export async function createCaseCompatible(supabase, caseData, userId) {
  if (!userId) return { error: 'User ID is required' };
  
  try {
    // Ensure both user ID fields are set
    const completeData = {
      ...caseData,
      created_by: userId,
      owner_id: userId
    };
    
    // Create the case
    const { data, error } = await supabase
      .from('cases')
      .insert([completeData])
      .select();
    
    if (error) {
      // Try alternative approach if the first one fails
      console.log('First case creation approach failed, trying alternative...');
      
      // Run a raw SQL query to create the case
      const { data: sqlData, error: sqlError } = await supabase.rpc('create_case', {
        p_name: caseData.name || 'Untitled Case',
        p_description: caseData.description || '',
        p_status: caseData.status || 'active',
        p_user_id: userId,
        p_is_archived: false
      });
      
      if (sqlError) {
        return { error: sqlError };
      }
      
      return { data: sqlData };
    }
    
    return { data };
  } catch (error) {
    return { error };
  }
}

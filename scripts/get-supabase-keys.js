import fetch from 'node-fetch';

// Management API key for Supabase
const managementToken = 'sbp_v0_713a54d15f7e116ebb7f0f74c538884dd04cb5c7';
const projectRef = 'swtkpfpyjjkkemmvkhmz';

async function getProjectKeys() {
  try {
    console.log('Fetching project keys from Supabase Management API...');
    
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }
    
    const keys = await response.json();
    console.log('Project API keys:', keys);
    
    // Get project settings
    const settingsResponse = await fetch(`https://api.supabase.com/v1/projects/${projectRef}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!settingsResponse.ok) {
      const errorText = await settingsResponse.text();
      throw new Error(`Settings API request failed: ${settingsResponse.status} ${errorText}`);
    }
    
    const settings = await settingsResponse.json();
    console.log('Project settings:', settings);
    
    // Get RLS policies
    const policiesResponse = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/policies`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (policiesResponse.ok) {
      const policies = await policiesResponse.json();
      console.log('RLS policies:', policies);
    } else {
      console.error('Failed to fetch RLS policies:', await policiesResponse.text());
    }
    
  } catch (error) {
    console.error('Error fetching project keys:', error);
  }
}

getProjectKeys(); 
-- Enable Row Level Security on all tables
ALTER TABLE IF EXISTS cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_members ENABLE ROW LEVEL SECURITY;

-- Create or replace organization access policy
CREATE OR REPLACE FUNCTION check_user_organization_access(organization_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if the user is a member of the organization
  RETURN EXISTS (
    SELECT 1
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    WHERE t.organization_id = $1
    AND tm.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy for cases table
DROP POLICY IF EXISTS cases_policy ON cases;
CREATE POLICY cases_policy ON cases
  USING (check_user_organization_access(organization_id))
  WITH CHECK (check_user_organization_access(organization_id));

-- Policy for matters table
DROP POLICY IF EXISTS matters_policy ON matters;
CREATE POLICY matters_policy ON matters
  USING (check_user_organization_access(organization_id))
  WITH CHECK (check_user_organization_access(organization_id));

-- Policy for clients table
DROP POLICY IF EXISTS clients_policy ON clients;
CREATE POLICY clients_policy ON clients
  USING (check_user_organization_access(organization_id))
  WITH CHECK (check_user_organization_access(organization_id));

-- Policy for documents table
DROP POLICY IF EXISTS documents_policy ON documents;
CREATE POLICY documents_policy ON documents
  USING (check_user_organization_access(organization_id))
  WITH CHECK (check_user_organization_access(organization_id));

-- Policy for notes table
DROP POLICY IF EXISTS notes_policy ON notes;
CREATE POLICY notes_policy ON notes
  USING (check_user_organization_access(organization_id))
  WITH CHECK (check_user_organization_access(organization_id));

-- Policy for tasks table
DROP POLICY IF EXISTS tasks_policy ON tasks;
CREATE POLICY tasks_policy ON tasks
  USING (check_user_organization_access(organization_id))
  WITH CHECK (check_user_organization_access(organization_id));

-- Policy for events table
DROP POLICY IF EXISTS events_policy ON events;
CREATE POLICY events_policy ON events
  USING (check_user_organization_access(organization_id))
  WITH CHECK (check_user_organization_access(organization_id));

-- Policy for billing table
DROP POLICY IF EXISTS billing_policy ON billing;
CREATE POLICY billing_policy ON billing
  USING (check_user_organization_access(organization_id))
  WITH CHECK (check_user_organization_access(organization_id));

-- Policy for contacts table
DROP POLICY IF EXISTS contacts_policy ON contacts;
CREATE POLICY contacts_policy ON contacts
  USING (check_user_organization_access(organization_id))
  WITH CHECK (check_user_organization_access(organization_id));

-- Policy for teams table (user can see teams they are a member of)
DROP POLICY IF EXISTS teams_policy ON teams;
CREATE POLICY teams_policy ON teams
  USING (
    EXISTS (
      SELECT 1 
      FROM team_members 
      WHERE team_id = teams.id 
      AND user_id = auth.uid()
    )
  );

-- Policy for team_members table
DROP POLICY IF EXISTS team_members_policy ON team_members;
CREATE POLICY team_members_policy ON team_members
  USING (
    EXISTS (
      SELECT 1 
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid()
    )
  );

-- Special policy for users table (can only see self)
DROP POLICY IF EXISTS users_view_self_policy ON users;
CREATE POLICY users_view_self_policy ON users
  USING (id = auth.uid());

-- Allow users to see other users in their organizations
DROP POLICY IF EXISTS users_view_organization_members ON users;
CREATE POLICY users_view_organization_members ON users
  USING (
    EXISTS (
      SELECT 1
      FROM team_members tm1
      JOIN teams t1 ON tm1.team_id = t1.id
      JOIN team_members tm2 ON t1.id = tm2.team_id
      WHERE tm1.user_id = auth.uid()
      AND tm2.user_id = users.id
    )
  );

-- Allow users to update their own information
DROP POLICY IF EXISTS users_update_self_policy ON users;
CREATE POLICY users_update_self_policy ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Grant select permissions to authenticated users on all tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated; 
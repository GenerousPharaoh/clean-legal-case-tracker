# Profile Fix Instructions

## 1. SQL Commands to Run in Supabase Dashboard

To fix the profile and RLS issues, follow these steps:

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select your project
3. Go to the SQL Editor tab
4. Create a new query and paste the following SQL:

```sql
-- 1. Insert or update the profile row for the current user
INSERT INTO public.profiles (id, first_name, last_name, avatar_url, role)
VALUES ('1a0ca6f0-c571-4b1a-8476-01583a26900b', 'Kareem', 'Hassanein', null, 'admin')
ON CONFLICT (id) DO UPDATE 
SET updated_at = now();

-- 2. Ensure RLS is enabled and proper policies exist
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop the policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can read their profile" ON public.profiles;

-- Create the policy to allow users to read their own profile
CREATE POLICY "Users can read their profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- 3. Additional policy to allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their profile" ON public.profiles;

CREATE POLICY "Users can update their profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);
```

5. Click the "Run" button to execute the SQL

## 2. Verification Steps

After running the SQL, verify that:

1. The profile record has been created by running:
   ```sql
   SELECT * FROM profiles WHERE id = '1a0ca6f0-c571-4b1a-8476-01583a26900b';
   ```

2. The RLS policies have been correctly configured by running:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

3. In your application, verify that `/profiles?...` API requests return 200 with JSON instead of 404

## Other Fixes Already Implemented

1. **TinyMCE Plugin Load Issues**: Fixed by using the `TinyMCEScriptLoader` component to properly load assets.

2. **Framer-motion Version Mismatch**: Fixed by locking to version 11.5.2 and using overrides to ensure all packages use the same version.

## Deployment Verification Checklist

After pushing these fixes to production, verify:

1. Profile requests return 200 instead of 404
2. TinyMCE loads correctly (Network tab shows tinymce.min.js with 200 status)
3. No "u.mount" errors in the console 
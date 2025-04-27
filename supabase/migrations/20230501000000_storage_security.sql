-- Create documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create profiles bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for documents bucket
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload" 
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Allow users to select their own files
CREATE POLICY "Allow users to select their own files" 
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND auth.uid() = owner);

-- Allow users to update their own files
CREATE POLICY "Allow users to update their own files" 
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid() = owner);

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete their own files" 
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid() = owner);

-- Special rule for profile pictures - allow public access
CREATE POLICY "Profile pictures are publicly accessible" 
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profiles');

-- Only authenticated users can manage their own profile pictures
CREATE POLICY "Users can manage their own profile pictures" 
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profiles' AND (name = 'profile_' || auth.uid() || '.jpg' OR name = 'profile_' || auth.uid() || '.png')); 
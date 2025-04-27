-- Add exhibit_id column to files table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'files') THEN
        -- Check if the column already exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'files' AND column_name = 'exhibit_id'
        ) THEN
ALTER TABLE files ADD COLUMN exhibit_id TEXT;
        END IF;

        -- Add unique constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.constraint_column_usage 
            WHERE table_name = 'files' AND constraint_name = 'files_project_id_exhibit_id_key'
        ) THEN
ALTER TABLE files ADD CONSTRAINT files_project_id_exhibit_id_key UNIQUE (project_id, exhibit_id);
        END IF;

        -- Update RLS policies if table exists
DROP POLICY IF EXISTS "Users can update their own files" ON files;
CREATE POLICY "Users can update their own files" 
ON files FOR UPDATE 
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id); 
    END IF;
END $$; 
-- Fix client_project_access table constraints
-- Remove UNIQUE constraints to allow one client to access multiple projects

-- Drop existing unique constraints
ALTER TABLE public.client_project_access DROP CONSTRAINT IF EXISTS client_project_access_project_id_key;
ALTER TABLE public.client_project_access DROP CONSTRAINT IF EXISTS client_project_access_user_id_key;

-- Add a composite unique constraint to prevent duplicate user-project combinations
ALTER TABLE public.client_project_access ADD CONSTRAINT client_project_access_user_project_unique 
UNIQUE (user_id, project_id);

-- Update the table comment
COMMENT ON TABLE public.client_project_access IS 'Allows many-to-many relationship between clients and projects';
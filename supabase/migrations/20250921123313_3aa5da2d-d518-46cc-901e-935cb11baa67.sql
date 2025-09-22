-- Create function to get all user projects
CREATE OR REPLACE FUNCTION public.get_user_projects()
RETURNS TABLE(project_id uuid, project_name text, project_slug text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.slug 
  FROM public.projects p
  INNER JOIN public.client_project_access cpa ON p.id = cpa.project_id
  WHERE cpa.user_id = auth.uid() AND cpa.is_active = true;
$$;

-- Update RLS policies to work with multiple projects
DROP POLICY IF EXISTS "Clients can view project sprints" ON public.sprints;
CREATE POLICY "Clients can view accessible project sprints" 
ON public.sprints 
FOR SELECT 
USING (
  get_current_user_role() = 'CLIENT'::app_role 
  AND project_id IN (SELECT project_id FROM get_user_projects())
);

DROP POLICY IF EXISTS "Clients can view and create project comments" ON public.comments;
CREATE POLICY "Clients can view accessible project comments" 
ON public.comments 
FOR SELECT 
USING (
  project_id IN (SELECT project_id FROM get_user_projects())
  AND is_visible = true
);

DROP POLICY IF EXISTS "Clients can create comments" ON public.comments;
CREATE POLICY "Clients can create comments on accessible projects" 
ON public.comments 
FOR INSERT 
WITH CHECK (
  get_current_user_role() = 'CLIENT'::app_role 
  AND author_user_id = auth.uid() 
  AND project_id IN (SELECT project_id FROM get_user_projects())
);

DROP POLICY IF EXISTS "Clients can view assigned project" ON public.projects;
CREATE POLICY "Clients can view accessible projects" 
ON public.projects 
FOR SELECT 
USING (
  get_current_user_role() = 'CLIENT'::app_role 
  AND id IN (SELECT project_id FROM get_user_projects())
);

DROP POLICY IF EXISTS "Clients can view project roadmap" ON public.roadmap_items;
CREATE POLICY "Clients can view accessible project roadmaps" 
ON public.roadmap_items 
FOR SELECT 
USING (
  get_current_user_role() = 'CLIENT'::app_role 
  AND project_id IN (SELECT project_id FROM get_user_projects())
);

DROP POLICY IF EXISTS "Clients can view published project reports" ON public.reports;
CREATE POLICY "Clients can view published accessible project reports" 
ON public.reports 
FOR SELECT 
USING (
  get_current_user_role() = 'CLIENT'::app_role 
  AND project_id IN (SELECT project_id FROM get_user_projects())
  AND is_published = true
);

DROP POLICY IF EXISTS "Clients can view published report evidences" ON public.evidences;
CREATE POLICY "Clients can view published report evidences from accessible projects" 
ON public.evidences 
FOR SELECT 
USING (
  get_current_user_role() = 'CLIENT'::app_role 
  AND EXISTS (
    SELECT 1 FROM reports r 
    WHERE r.id = evidences.report_id 
    AND r.project_id IN (SELECT project_id FROM get_user_projects())
    AND r.is_published = true
  )
);
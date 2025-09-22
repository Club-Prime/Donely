-- Create task_status enum
DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM ('NOT_STARTED','IN_PROGRESS','DONE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create sprint_tasks table
CREATE TABLE IF NOT EXISTS public.sprint_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  roadmap_item_id UUID REFERENCES public.roadmap_items(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'NOT_STARTED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_sprint_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_sprint_tasks_updated_at ON public.sprint_tasks;
CREATE TRIGGER trg_update_sprint_tasks_updated_at
BEFORE UPDATE ON public.sprint_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_sprint_tasks_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_sprint_id ON public.sprint_tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_roadmap_item_id ON public.sprint_tasks(roadmap_item_id);

-- Link evidences to sprint tasks (optional)
ALTER TABLE public.evidences
ADD COLUMN IF NOT EXISTS sprint_task_id UUID REFERENCES public.sprint_tasks(id) ON DELETE SET NULL;

-- RLS for sprint_tasks
ALTER TABLE public.sprint_tasks ENABLE ROW LEVEL SECURITY;

-- Admins can manage all sprint tasks
DROP POLICY IF EXISTS "Admins can manage all sprint tasks" ON public.sprint_tasks;
CREATE POLICY "Admins can manage all sprint tasks" ON public.sprint_tasks
  FOR ALL USING (public.get_current_user_role() = 'ADMIN');

-- Clients can view sprint tasks of accessible projects
DROP POLICY IF EXISTS "Clients can view accessible sprint tasks" ON public.sprint_tasks;
CREATE POLICY "Clients can view accessible sprint tasks" ON public.sprint_tasks
  FOR SELECT USING (
    public.get_current_user_role() = 'CLIENT' AND
    EXISTS (
      SELECT 1 FROM public.sprints s
      WHERE s.id = sprint_tasks.sprint_id
      AND s.project_id IN (SELECT project_id FROM public.get_user_projects())
    )
  );

-- Optionally, allow admins to insert/update via WITH CHECK
DROP POLICY IF EXISTS "Admins can insert/update sprint tasks" ON public.sprint_tasks;
CREATE POLICY "Admins can insert/update sprint tasks" ON public.sprint_tasks
  FOR INSERT TO PUBLIC WITH CHECK (public.get_current_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Admins can update sprint tasks" ON public.sprint_tasks;
CREATE POLICY "Admins can update sprint tasks" ON public.sprint_tasks
  FOR UPDATE USING (public.get_current_user_role() = 'ADMIN');

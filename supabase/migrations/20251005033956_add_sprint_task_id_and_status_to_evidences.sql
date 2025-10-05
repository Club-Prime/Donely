-- Add sprint_task_id and status columns to evidences table
ALTER TABLE public.evidences
ADD COLUMN IF NOT EXISTS sprint_task_id UUID,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'DONE' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'DONE'));
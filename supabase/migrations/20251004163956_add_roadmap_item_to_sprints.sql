-- Add roadmap_item_id to sprints table
ALTER TABLE public.sprints 
ADD COLUMN IF NOT EXISTS roadmap_item_id UUID REFERENCES public.roadmap_items(id) ON DELETE SET NULL;

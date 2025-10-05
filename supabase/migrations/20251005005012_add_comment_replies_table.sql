-- Create comment_replies table
CREATE TABLE public.comment_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES auth.users(id),
  content_md TEXT NOT NULL,
  is_from_admin BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_comment_replies_comment_id ON public.comment_replies(comment_id);
CREATE INDEX idx_comment_replies_author_user_id ON public.comment_replies(author_user_id);
CREATE INDEX idx_comment_replies_created_at ON public.comment_replies(created_at);

-- Enable Row Level Security
ALTER TABLE public.comment_replies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for comment_replies
-- Admins can manage all replies
CREATE POLICY "Admins can manage all comment replies" ON public.comment_replies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Clients can view replies on their accessible projects
CREATE POLICY "Clients can view replies on accessible projects" ON public.comment_replies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.comments c
      JOIN public.client_project_access cpa ON c.project_id = cpa.project_id
      WHERE c.id = comment_replies.comment_id
      AND cpa.user_id = auth.uid()
      AND comment_replies.is_visible = true
    )
  );

-- Clients can create replies on their accessible projects
CREATE POLICY "Clients can create replies on accessible projects" ON public.comment_replies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.comments c
      JOIN public.client_project_access cpa ON c.project_id = cpa.project_id
      WHERE c.id = comment_replies.comment_id
      AND cpa.user_id = auth.uid()
    )
    AND author_user_id = auth.uid()
  );

-- Add trigger for updated_at
CREATE TRIGGER update_comment_replies_updated_at
  BEFORE UPDATE ON public.comment_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
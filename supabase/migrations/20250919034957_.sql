-- Create user roles enum
CREATE TYPE app_role AS ENUM ('ADMIN', 'CLIENT');

-- Create project status enum
CREATE TYPE project_status AS ENUM ('PLANNED', 'ACTIVE', 'ON_HOLD', 'DONE');

-- Create sprint status enum
CREATE TYPE sprint_status AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE');

-- Create roadmap item status enum
CREATE TYPE roadmap_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'DONE');

-- Create evidence type enum
CREATE TYPE evidence_type AS ENUM ('IMAGE', 'VIDEO');

-- Create users table (profiles)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  role app_role NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  client_display_name TEXT,
  description TEXT,
  status project_status DEFAULT 'PLANNED',
  start_date DATE,
  end_date_target DATE,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create client_project_access table (1:1 client to project)
CREATE TABLE public.client_project_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sprints table
CREATE TABLE public.sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sprint_number INTEGER NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  status sprint_status DEFAULT 'PLANNED',
  planned_scope JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, sprint_number)
);

-- Create roadmap_items table
CREATE TABLE public.roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  effort INTEGER DEFAULT 1 CHECK (effort > 0),
  status roadmap_status DEFAULT 'NOT_STARTED',
  start_date DATE,
  end_date DATE,
  dependency_ids UUID[] DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content_md TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create evidences table
CREATE TABLE public.evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  type evidence_type NOT NULL,
  storage_key TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES auth.users(id),
  content_md TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_project_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create function to get user project access
CREATE OR REPLACE FUNCTION public.get_user_project_id()
RETURNS UUID AS $$
  SELECT project_id FROM public.client_project_access WHERE user_id = auth.uid() AND is_active = true;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for projects
CREATE POLICY "Admins can manage all projects" ON public.projects
  FOR ALL USING (public.get_current_user_role() = 'ADMIN');

CREATE POLICY "Clients can view assigned project" ON public.projects
  FOR SELECT USING (
    public.get_current_user_role() = 'CLIENT' AND 
    id = public.get_user_project_id()
  );

-- Create RLS policies for client_project_access
CREATE POLICY "Admins can manage project access" ON public.client_project_access
  FOR ALL USING (public.get_current_user_role() = 'ADMIN');

CREATE POLICY "Clients can view own access" ON public.client_project_access
  FOR SELECT USING (user_id = auth.uid());

-- Create RLS policies for sprints
CREATE POLICY "Admins can manage all sprints" ON public.sprints
  FOR ALL USING (public.get_current_user_role() = 'ADMIN');

CREATE POLICY "Clients can view project sprints" ON public.sprints
  FOR SELECT USING (
    public.get_current_user_role() = 'CLIENT' AND 
    project_id = public.get_user_project_id()
  );

-- Create RLS policies for roadmap_items
CREATE POLICY "Admins can manage all roadmap items" ON public.roadmap_items
  FOR ALL USING (public.get_current_user_role() = 'ADMIN');

CREATE POLICY "Clients can view project roadmap" ON public.roadmap_items
  FOR SELECT USING (
    public.get_current_user_role() = 'CLIENT' AND 
    project_id = public.get_user_project_id()
  );

-- Create RLS policies for reports
CREATE POLICY "Admins can manage all reports" ON public.reports
  FOR ALL USING (public.get_current_user_role() = 'ADMIN');

CREATE POLICY "Clients can view published project reports" ON public.reports
  FOR SELECT USING (
    public.get_current_user_role() = 'CLIENT' AND 
    project_id = public.get_user_project_id() AND
    is_published = true
  );

-- Create RLS policies for evidences
CREATE POLICY "Admins can manage all evidences" ON public.evidences
  FOR ALL USING (public.get_current_user_role() = 'ADMIN');

CREATE POLICY "Clients can view published report evidences" ON public.evidences
  FOR SELECT USING (
    public.get_current_user_role() = 'CLIENT' AND 
    EXISTS (
      SELECT 1 FROM public.reports r 
      WHERE r.id = report_id 
      AND r.project_id = public.get_user_project_id()
      AND r.is_published = true
    )
  );

-- Create RLS policies for comments
CREATE POLICY "Admins can manage all comments" ON public.comments
  FOR ALL USING (public.get_current_user_role() = 'ADMIN');

CREATE POLICY "Clients can view and create project comments" ON public.comments
  FOR SELECT USING (
    project_id = public.get_user_project_id() AND is_visible = true
  );

CREATE POLICY "Clients can create comments" ON public.comments
  FOR INSERT WITH CHECK (
    public.get_current_user_role() = 'CLIENT' AND
    author_user_id = auth.uid() AND
    project_id = public.get_user_project_id()
  );

-- Create RLS policies for audit_logs
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.get_current_user_role() = 'ADMIN');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sprints_updated_at BEFORE UPDATE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roadmap_items_updated_at BEFORE UPDATE ON public.roadmap_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user creation in profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, username, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'CLIENT')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_client_project_access_user_id ON public.client_project_access(user_id);
CREATE INDEX idx_client_project_access_project_id ON public.client_project_access(project_id);
CREATE INDEX idx_sprints_project_id ON public.sprints(project_id);
CREATE INDEX idx_sprints_week_dates ON public.sprints(week_start_date, week_end_date);
CREATE INDEX idx_roadmap_items_project_id ON public.roadmap_items(project_id);
CREATE INDEX idx_reports_project_id ON public.reports(project_id);
CREATE INDEX idx_reports_published ON public.reports(is_published);
CREATE INDEX idx_evidences_report_id ON public.evidences(report_id);
CREATE INDEX idx_comments_sprint_id ON public.comments(sprint_id);
CREATE INDEX idx_comments_project_id ON public.comments(project_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity, entity_id);;

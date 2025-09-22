import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface ProjectData {
  project_id: string;
  project_name: string;
  project_slug: string;
}

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.role === 'CLIENT') {
      fetchUserProjects();
    }
  }, [profile]);

  const fetchUserProjects = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_projects');
      
      if (error) throw error;
      
      const projectList = data.map((item: ProjectData) => ({
        id: item.project_id,
        name: item.project_name,
        slug: item.project_slug
      }));
      
      setProjects(projectList);
      
      // Auto-select first project if only one exists
      if (projectList.length === 1) {
        setSelectedProject(projectList[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar projetos do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      selectedProject,
      setSelectedProject,
      loading
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
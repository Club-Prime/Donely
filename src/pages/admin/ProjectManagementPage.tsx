import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, Route, FileText, MessageSquare, Plus, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useProject } from '@/contexts/ProjectContext';

// Import admin components (we'll create these)
import { AdminSprintsView } from '../../components/admin/AdminSprintsView';
import { AdminRoadmapView } from '../../components/admin/AdminRoadmapView';
import { AdminEvidenciasView } from '../../components/admin/AdminEvidenciasView';
import { AdminComentariosView } from '../../components/admin/AdminComentariosView';

interface Project {
  id: string;
  name: string;
  status: string;
  progress_percent: number;
  description?: string;
}

export default function ProjectManagementPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { selectedProject, setSelectedProject } = useProject();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sprints');

  console.log('🏢 ProjectManagementPage: Projeto selecionado:', selectedProject ? {
    id: selectedProject.id,
    name: selectedProject.name
  } : null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projectId && projects.length > 0) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        // Converter para o tipo do contexto
        setSelectedProject({
          id: project.id,
          name: project.name,
          slug: project.name.toLowerCase().replace(/\s+/g, '-')
        });
      }
    }
  }, [projectId, projects, setSelectedProject]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status, progress_percent, description')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os projetos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      // Converter para o tipo do contexto
      setSelectedProject({
        id: project.id,
        name: project.name,
        slug: project.name.toLowerCase().replace(/\s+/g, '-')
      });
    }
  };

  const selectedProjectData = selectedProject ? projects.find(p => p.id === selectedProject.id) : null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">Ativo</Badge>;
      case 'PAUSED':
        return <Badge className="bg-yellow-500">Pausado</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-blue-500">Concluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold">Carregando projetos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-bold">Gerenciamento de Projetos</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Project Selector */}
            <Select
              value={selectedProject?.id || ''}
              onValueChange={handleProjectSelect}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione um projeto para gerenciar" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{project.name}</span>
                      <div className="ml-2">{getStatusBadge(project.status)}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!selectedProject ? (
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <Settings className="w-16 h-16 text-muted-foreground" />
                <div className="space-y-2">
                  <h4 className="text-lg font-medium">Selecione um projeto</h4>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Escolha um projeto acima para gerenciar suas sprints, roadmap, evidências e comentários.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Project Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">{selectedProject.name}</h2>
                  <p className="text-muted-foreground">
                    {selectedProjectData?.description || 'Gerencie todos os aspectos deste projeto.'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {selectedProjectData ? getStatusBadge(selectedProjectData.status) : null}
                  <div className="text-right">
                    <div className="text-2xl font-bold">{selectedProjectData?.progress_percent || 0}%</div>
                    <div className="text-sm text-muted-foreground">Progresso</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Management Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm">
                <TabsTrigger value="sprints" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Sprints
                </TabsTrigger>
                <TabsTrigger value="roadmap" className="gap-2">
                  <Route className="w-4 h-4" />
                  Roadmap
                </TabsTrigger>
                <TabsTrigger value="evidencias" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Evidências
                </TabsTrigger>
                <TabsTrigger value="comentarios" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Comentários
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sprints" className="space-y-6">
                <AdminSprintsView />
              </TabsContent>

              <TabsContent value="roadmap" className="space-y-6">
                <AdminRoadmapView />
              </TabsContent>

              <TabsContent value="evidencias" className="space-y-6">
                <AdminEvidenciasView projectId={selectedProject.id} />
              </TabsContent>

              <TabsContent value="comentarios" className="space-y-6">
                <AdminComentariosView projectId={selectedProject.id} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
};
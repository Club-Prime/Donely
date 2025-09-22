import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProject } from '@/contexts/ProjectContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { LogOut, Calendar, MessageSquare, FileText, Route, Building2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SprintsView } from '@/components/client/SprintsView';
import { RoadmapView } from '@/components/client/RoadmapView';
import { EvidenciasView } from '@/components/client/EvidenciasView';
import { ComentariosView } from '@/components/client/ComentariosView';

type ActiveView = 'dashboard' | 'sprints' | 'roadmap' | 'evidencias' | 'comentarios';

export const ClientDashboard = () => {
  const { profile, signOut } = useAuth();
  const { projects, selectedProject, setSelectedProject, loading: projectsLoading } = useProject();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [projectStats, setProjectStats] = useState({
    progress: 0,
    notStarted: 0,
    inProgress: 0,
    done: 0,
    totalReports: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchProjectStats = useCallback(async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      
      // Fetch roadmap statistics
      const { data: roadmapData, error: roadmapError } = await supabase
        .from('roadmap_items')
        .select('status')
        .eq('project_id', selectedProject.id);

      if (roadmapError) throw roadmapError;

      // Calculate statistics
      const stats = roadmapData?.reduce((acc, item) => {
        switch (item.status) {
          case 'NOT_STARTED':
            acc.notStarted++;
            break;
          case 'IN_PROGRESS':
            acc.inProgress++;
            break;
          case 'DONE':
            acc.done++;
            break;
        }
        return acc;
      }, { notStarted: 0, inProgress: 0, done: 0 }) || { notStarted: 0, inProgress: 0, done: 0 };

      const total = stats.notStarted + stats.inProgress + stats.done;
      const progress = total > 0 ? Math.round((stats.done / total) * 100) : 0;

      // Fetch reports count
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('id')
        .eq('project_id', selectedProject.id)
        .eq('is_published', true);

      if (reportsError) throw reportsError;

      setProjectStats({
        progress,
        notStarted: stats.notStarted,
        inProgress: stats.inProgress,
        done: stats.done,
        totalReports: reportsData?.length || 0
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas do projeto:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectStats();
    }
  }, [selectedProject, fetchProjectStats]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (projectsLoading) {
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
            <h1 className="text-xl font-bold">Donely</h1>
            <div className="text-sm text-muted-foreground">
              Acompanhe seus projetos
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Project Selector */}
            {projects.length > 1 && (
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <Select
                  value={selectedProject?.id || ''}
                  onValueChange={(value) => {
                    const project = projects.find(p => p.id === value);
                    setSelectedProject(project || null);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <span className="text-sm">
              <span className="font-medium">{profile?.username}</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {projects.length === 0 ? (
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <Building2 className="w-16 h-16 text-muted-foreground" />
                <div className="space-y-2">
                  <h4 className="text-lg font-medium">Nenhum projeto atribuído</h4>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Você ainda não tem acesso a nenhum projeto. Entre em contato com o administrador para receber acesso.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : !selectedProject ? (
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <Building2 className="w-16 h-16 text-muted-foreground" />
                <div className="space-y-2">
                  <h4 className="text-lg font-medium">Selecione um projeto</h4>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Escolha um projeto acima para visualizar seu progresso e relatórios.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Navigation Header */}
            {activeView !== 'dashboard' && (
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveView('dashboard')}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao Dashboard
                </Button>
              </div>
            )}

            {/* Content based on active view */}
            {activeView === 'dashboard' && (
              <>
                {/* Welcome Section */}
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">{selectedProject.name}</h2>
                  <p className="text-muted-foreground">
                    Acompanhe o progresso semanal e veja os relatórios de desenvolvimento.
                  </p>
                </div>

                {/* Project Status */}
                <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">Status do Projeto</CardTitle>
                        <CardDescription>Progresso geral baseado no roadmap</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{loading ? '...' : `${projectStats.progress}%`}</div>
                        <div className="text-sm text-muted-foreground">Concluído</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={projectStats.progress} className="h-2" />
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold">{loading ? '...' : projectStats.notStarted}</div>
                        <div className="text-sm text-muted-foreground">Não iniciado</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">{loading ? '...' : projectStats.inProgress}</div>
                        <div className="text-sm text-muted-foreground">Em progresso</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">{loading ? '...' : projectStats.done}</div>
                        <div className="text-sm text-muted-foreground">Concluído</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Navigation */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card 
                    className="bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90 transition-colors cursor-pointer"
                    onClick={() => setActiveView('sprints')}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">Sprints</CardTitle>
                          <CardDescription className="text-xs">Ver relatórios semanais</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  <Card 
                    className="bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90 transition-colors cursor-pointer"
                    onClick={() => setActiveView('roadmap')}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary/20">
                          <Route className="w-5 h-5 text-secondary-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-base">Roadmap</CardTitle>
                          <CardDescription className="text-xs">Planejamento futuro</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  <Card 
                    className="bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90 transition-colors cursor-pointer"
                    onClick={() => setActiveView('evidencias')}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/30">
                          <FileText className="w-5 h-5 text-accent-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-base">Evidências</CardTitle>
                          <CardDescription className="text-xs">Imagens e vídeos</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  <Card 
                    className="bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90 transition-colors cursor-pointer"
                    onClick={() => setActiveView('comentarios')}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/30">
                          <MessageSquare className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-base">Comentários</CardTitle>
                          <CardDescription className="text-xs">Suas observações</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </div>

                {/* Latest Updates */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">Últimas Atualizações</h3>

                  <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                    <CardContent className="p-8 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-lg font-medium">
                            {projectStats.totalReports === 0 ? 'Nenhum relatório ainda' : `${projectStats.totalReports} relatórios disponíveis`}
                          </h4>
                          <p className="text-muted-foreground text-sm max-w-md">
                            {projectStats.totalReports === 0 
                              ? 'Os relatórios semanais aparecerão aqui assim que o desenvolvimento começar.'
                              : 'Clique em "Sprints" acima para visualizar todos os relatórios do projeto.'
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Different views */}
            {activeView === 'sprints' && <SprintsView projectId={selectedProject.id} />}
            {activeView === 'roadmap' && <RoadmapView projectId={selectedProject.id} />}
            {activeView === 'evidencias' && <EvidenciasView projectId={selectedProject.id} />}
            {activeView === 'comentarios' && <ComentariosView projectId={selectedProject.id} />}
          </div>
        )}
      </main>
    </div>
  );
};
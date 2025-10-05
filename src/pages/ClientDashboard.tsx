import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProject } from '@/contexts/ProjectContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LogOut, Calendar, MessageSquare, FileText, Route, Building2, ArrowLeft, RefreshCw, Bell, TrendingUp, Users, Clock, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SprintsView } from '@/components/client/SprintsView';
import { RoadmapView } from '@/components/client/RoadmapView';
import { EvidenciasView } from '@/components/client/EvidenciasView';
import { ComentariosView } from '@/components/client/ComentariosView';

type ActiveView = 'dashboard' | 'sprints' | 'roadmap' | 'evidencias' | 'comentarios';

interface ProjectStats {
  progress: number;
  notStarted: number;
  inProgress: number;
  done: number;
  totalReports: number;
  lastActivity?: string;
  newContent: boolean;
}

interface ProjectCardData {
  id: string;
  name: string;
  slug: string;
  stats: ProjectStats;
  lastAccess?: string;
}

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
    totalReports: 0,
    dedicatedHours: 0
  });
  const [projectCards, setProjectCards] = useState<ProjectCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingStatus, setSyncingStatus] = useState(false);

  const fetchProjectCardsData = useCallback(async () => {
    if (!projects.length) return;

    try {
      const cardsData: ProjectCardData[] = [];

      for (const project of projects) {
        // Fetch project access info (last login)
        const { data: accessData, error: accessError } = await supabase
          .from('client_project_access')
          .select('last_login_at')
          .eq('project_id', project.id)
          .eq('user_id', profile?.user_id)
          .single();

        // Fetch roadmap statistics
        const { data: roadmapData, error: roadmapError } = await supabase
          .from('roadmap_items')
          .select('status, updated_at')
          .eq('project_id', project.id);

        // Fetch reports count and latest activity
        const { data: reportsData, error: reportsError } = await supabase
          .from('reports')
          .select('id, created_at, updated_at')
          .eq('project_id', project.id)
          .eq('is_published', true)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (roadmapError || reportsError) continue;

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

        // Check for new content (reports created/updated after last access)
        const lastAccess = accessData?.last_login_at;
        const hasNewContent = lastAccess && reportsData && reportsData.length > 0
          ? new Date(reportsData[0].updated_at) > new Date(lastAccess)
          : false;

        // Get latest activity
        const latestReport = reportsData?.[0];
        const latestRoadmapUpdate = roadmapData?.sort((a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )[0];

        const latestActivity = latestReport && latestRoadmapUpdate
          ? (new Date(latestReport.updated_at) > new Date(latestRoadmapUpdate.updated_at)
             ? latestReport.updated_at : latestRoadmapUpdate.updated_at)
          : latestReport?.updated_at || latestRoadmapUpdate?.updated_at;

        cardsData.push({
          id: project.id,
          name: project.name,
          slug: project.slug,
          stats: {
            progress,
            notStarted: stats.notStarted,
            inProgress: stats.inProgress,
            done: stats.done,
            totalReports: reportsData?.length || 0,
            lastActivity: latestActivity,
            newContent: hasNewContent
          },
          lastAccess: accessData?.last_login_at
        });
      }

      setProjectCards(cardsData);
    } catch (error) {
      console.error('Erro ao buscar dados dos cards de projeto:', error);
    }
  }, [projects, profile?.user_id]);

  useEffect(() => {
    if (projects.length > 0) {
      fetchProjectCardsData();
    }
  }, [projects, fetchProjectCardsData]);

  const handleSyncProjectStatus = async () => {
    if (!selectedProject) return;

    try {
      setSyncingStatus(true);

      // Update last login timestamp
      const { error } = await supabase
        .from('client_project_access')
        .update({ last_login_at: new Date().toISOString() })
        .eq('project_id', selectedProject.id)
        .eq('user_id', profile?.user_id);

      if (error) throw error;

      // Refresh project stats
      await fetchProjectStats();
      await fetchProjectCardsData();

      // Show success message
      // You might want to add toast notification here
      console.log('Status do projeto sincronizado com sucesso!');
    } catch (error) {
      console.error('Erro ao sincronizar status do projeto:', error);
    } finally {
      setSyncingStatus(false);
    }
  };

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

      // Fetch sprints to calculate dedicated hours
      const { data: sprintsData, error: sprintsError } = await supabase
        .from('sprints')
        .select('week_start_date, week_end_date, status')
        .eq('project_id', selectedProject.id);

      if (sprintsError) {
        console.error('Erro ao buscar sprints:', sprintsError);
      }

      // Calculate dedicated hours (assuming 8 hours per working day, 5 days per week)
      let dedicatedHours = 0;
      if (sprintsData) {
        sprintsData.forEach(sprint => {
          if (sprint.status === 'DONE') {
            const startDate = new Date(sprint.week_start_date);
            const endDate = new Date(sprint.week_end_date);
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            // Assume 5 working days per week, 8 hours per day
            const workingDays = Math.ceil(diffDays * 5 / 7);
            dedicatedHours += workingDays * 8;
          }
        });
      }

      setProjectStats({
        progress,
        notStarted: stats.notStarted,
        inProgress: stats.inProgress,
        done: stats.done,
        totalReports: reportsData?.length || 0,
        dedicatedHours
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="hover:bg-primary/10 hover:text-primary"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-800 bg-clip-text text-transparent">Donely</h1>
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
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Seus Projetos</h2>
              <p className="text-muted-foreground">
                Escolha um projeto para acompanhar seu progresso e desenvolvimento.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projectCards.map((project) => (
                <Card
                  key={project.id}
                  className={`bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90 transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] relative ${
                    project.stats.progress === 100 
                      ? 'border-yellow-500 bg-gradient-to-br from-gray-900 to-black shadow-lg shadow-yellow-500/20' 
                      : ''
                  }`}
                  onClick={() => setSelectedProject(project)}
                >
                  {project.stats.newContent && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-xs">
                        <Bell className="w-3 h-3 mr-1" />
                        Novo
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg line-clamp-2">{project.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {project.stats.totalReports} relatório{project.stats.totalReports !== 1 ? 's' : ''} disponível{project.stats.totalReports !== 1 ? 'is' : ''}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <TrendingUp className="w-4 h-4" />
                        <span className={`font-medium ${project.stats.progress === 100 ? 'text-yellow-500' : ''}`}>
                          {project.stats.progress}%
                        </span>
                        {project.stats.progress === 100 && (
                          <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs ml-2">
                            ✅ Concluído
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">{project.stats.progress}%</span>
                      </div>
                      <Progress 
                        value={project.stats.progress} 
                        className={`h-2 ${project.stats.progress === 100 ? '[&>div]:bg-gradient-to-r [&>div]:from-yellow-500 [&>div]:to-yellow-600' : ''}`} 
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="space-y-1">
                        <div className="text-lg font-semibold text-green-600">{project.stats.done}</div>
                        <div className="text-xs text-muted-foreground">Concluído</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-lg font-semibold text-blue-600">{project.stats.inProgress}</div>
                        <div className="text-xs text-muted-foreground">Em andamento</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-lg font-semibold text-gray-500">{project.stats.notStarted}</div>
                        <div className="text-xs text-muted-foreground">Pendente</div>
                      </div>
                    </div>

                    {project.stats.lastActivity && (
                      <div className="flex items-center text-xs text-muted-foreground pt-2 border-t">
                        <Clock className="w-3 h-3 mr-1" />
                        Última atividade: {new Date(project.stats.lastActivity).toLocaleDateString('pt-BR')}
                      </div>
                    )}

                    <Button className="w-full mt-4" size="sm">
                      <Building2 className="w-4 h-4 mr-2" />
                      Acessar Projeto
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
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
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold">{selectedProject.name}</h2>
                    <div className="w-1 h-12 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full"></div>
                  </div>
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
                    <div className="grid grid-cols-4 gap-4 text-center">
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
                      <div>
                        <div className="text-lg font-semibold text-yellow-500">{loading ? '...' : `${projectStats.dedicatedHours}h`}</div>
                        <div className="text-sm text-gray-600">Horas dedicadas</div>
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
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-200 border border-yellow-300">
                          <Calendar className="w-5 h-5 text-yellow-700" />
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
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-200 border border-yellow-300">
                          <Route className="w-5 h-5 text-yellow-700" />
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
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-200 border border-yellow-300">
                          <FileText className="w-5 h-5 text-yellow-700" />
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
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-200 border border-yellow-300">
                          <MessageSquare className="w-5 h-5 text-yellow-700" />
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Últimas Atualizações</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSyncProjectStatus}
                      disabled={syncingStatus}
                      className="gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncingStatus ? 'animate-spin' : ''}`} />
                      {syncingStatus ? 'Sincronizando...' : 'Sincronizar Status'}
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Recent Reports */}
                    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Relatórios Recentes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {projectStats.totalReports === 0 ? (
                          <div className="text-center py-6">
                            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Nenhum relatório ainda
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Total de relatórios</span>
                              <Badge variant="secondary">{projectStats.totalReports}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Clique em "Sprints" para ver todos os relatórios detalhados
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Project Progress Summary */}
                    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Resumo do Progresso
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Itens do roadmap</span>
                            <span className="text-sm font-medium">
                              {projectStats.done + projectStats.inProgress + projectStats.notStarted} total
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-green-600">Concluídos</span>
                              <span>{projectStats.done}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-blue-600">Em andamento</span>
                              <span>{projectStats.inProgress}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Pendentes</span>
                              <span>{projectStats.notStarted}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Activity Timeline */}
                  <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Atividades Recentes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {projectStats.totalReports > 0 && (
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Novos relatórios disponíveis</p>
                              <p className="text-xs text-muted-foreground">
                                {projectStats.totalReports} relatório{projectStats.totalReports !== 1 ? 's' : ''} de sprint publicad{projectStats.totalReports !== 1 ? 'os' : 'o'}
                              </p>
                            </div>
                          </div>
                        )}

                        {projectStats.done > 0 && (
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Itens do roadmap concluídos</p>
                              <p className="text-xs text-muted-foreground">
                                {projectStats.done} item{projectStats.done !== 1 ? 's' : ''} marcad{projectStats.done !== 1 ? 'os' : 'o'} como concluíd{projectStats.done !== 1 ? 'os' : 'o'}
                              </p>
                            </div>
                          </div>
                        )}

                        {projectStats.inProgress > 0 && (
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900">
                              <Route className="w-4 h-4 text-yellow-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Trabalho em andamento</p>
                              <p className="text-xs text-muted-foreground">
                                {projectStats.inProgress} item{projectStats.inProgress !== 1 ? 's' : ''} do roadmap em desenvolvimento
                              </p>
                            </div>
                          </div>
                        )}

                        {projectStats.totalReports === 0 && projectStats.done === 0 && projectStats.inProgress === 0 && (
                          <div className="text-center py-6">
                            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Aguardando início do desenvolvimento
                            </p>
                          </div>
                        )}
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
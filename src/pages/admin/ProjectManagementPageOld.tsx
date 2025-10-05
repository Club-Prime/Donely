import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import HierarchicalNavigator from '../../components/admin/HierarchicalNavigator';

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
  const [progressInfo, setProgressInfo] = useState<ProgressData | null>(null);
  const [statusInfo, setStatusInfo] = useState<StatusSuggestion | null>(null);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

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
        
        // Calcular informações de progresso
        updateProgressInfo(project.id);
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

  // Calcular informações de progresso do projeto selecionado
  const updateProgressInfo = async (projectId: string) => {
    try {
      const [progressData, statusData] = await Promise.all([
        ProjectProgressService.calculateProgress(projectId),
        ProjectProgressService.suggestProjectStatus(projectId)
      ]);
      
      setProgressInfo(progressData);
      setStatusInfo(statusData);
    } catch (error) {
      console.error('Erro ao calcular progresso:', error);
      setProgressInfo(null);
      setStatusInfo(null);
    }
  };

  // Sincronizar progresso automaticamente
  const handleSyncProgress = async () => {
    if (!selectedProject) return;

    setIsUpdatingProgress(true);
    try {
      await ProjectProgressService.syncProjectData(selectedProject.id);
      await fetchProjects();
      await updateProgressInfo(selectedProject.id);
      
      toast({
        title: "Progresso sincronizado!",
        description: "O progresso do projeto foi atualizado automaticamente.",
      });
    } catch (error) {
      console.error('Erro ao sincronizar progresso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível sincronizar o progresso",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingProgress(false);
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

            {/* Progress Information */}
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Progresso Automático
                  </CardTitle>
                  <Button
                    variant={isUpdatingProgress ? "outline" : "default"}
                    size="sm"
                    onClick={handleSyncProgress}
                    disabled={isUpdatingProgress}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-md transition-all duration-200"
                  >
                    {isUpdatingProgress ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <TrendingUp className="w-4 h-4" />
                    )}
                    {isUpdatingProgress ? 'Sincronizando...' : 'Sincronizar Progresso'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Progress Stats */}
                  <Card className="bg-card/60 border-border/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-foreground">Progresso Atual</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-3xl font-bold text-foreground">{selectedProjectData?.progress_percent || 0}%</div>
                      <div className="text-xs text-muted-foreground">Salvo no banco</div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${selectedProjectData?.progress_percent || 0}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-blue-300">Progresso Calculado</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-3xl font-bold text-blue-100">
                        {progressInfo?.progressPercent || 0}%
                      </div>
                      <div className="text-xs text-blue-300">
                        {progressInfo?.completedItems || 0}/{progressInfo?.totalItems || 0} itens
                      </div>
                      <div className="w-full bg-blue-800/30 rounded-full h-2">
                        <div 
                          className="bg-blue-400 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${progressInfo?.progressPercent || 0}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`bg-gradient-to-br ${statusInfo?.shouldUpdate ? 'from-orange-900/20 to-orange-800/20 border-orange-700/30' : 'from-green-900/20 to-green-800/20 border-green-700/30'}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className={`text-sm font-medium ${statusInfo?.shouldUpdate ? 'text-orange-300' : 'text-green-300'}`}>Status Sugerido</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {statusInfo?.shouldUpdate ? (
                        <div>
                          <div className="text-2xl font-bold text-orange-100 mb-1">
                            {statusInfo.suggested}
                          </div>
                          <Badge variant="outline" className="text-xs mb-2 border-orange-400/50 text-orange-300">
                            {statusInfo.current} → {statusInfo.suggested}
                          </Badge>
                          <div className="text-xs text-orange-300">
                            {statusInfo.reason}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-2xl font-bold text-green-100 mb-1">
                            {statusInfo?.current || 'PLANNED'}
                          </div>
                          <Badge variant="secondary" className="text-xs mb-2 bg-green-800/30 text-green-300">
                            Status adequado
                          </Badge>
                          <div className="text-xs text-green-300">
                            Não necessita mudanças
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-purple-300">Itens Roadmap</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-100">
                          {progressInfo?.totalItems || 0}
                        </div>
                        <div className="text-xs text-purple-300">Total de itens</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-xs text-purple-300">Concluídos</span>
                          </div>
                          <span className="text-sm font-bold text-green-400">
                            {progressInfo?.completedItems || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            <span className="text-xs text-purple-300">Em andamento</span>
                          </div>
                          <span className="text-sm font-bold text-yellow-400">
                            {progressInfo?.inProgressItems || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span className="text-xs text-purple-300">Não iniciados</span>
                          </div>
                          <span className="text-sm font-bold text-gray-300">
                            {progressInfo?.notStartedItems || 0}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

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
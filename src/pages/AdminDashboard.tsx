import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FolderOpen, 
  MapPin, 
  PlayCircle, 
  FileText, 
  Camera,
  ChevronRight,
  Activity,
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useProject } from '@/contexts/ProjectContext';
import { supabase } from '@/integrations/supabase/client';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { projects, setSelectedProject } = useProject();
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    clients: 0,
    projects: 0,
    evidences: 0,
    roadmapItems: 0,
    sprintsActive: 0,
    reportsPublished: 0,
  });

  const handleSignOut = async () => {
    await signOut();
  };

  const handleManagementPanel = () => {
    if (projects.length > 0) {
      // Seleciona o primeiro projeto disponível
      setSelectedProject(projects[0]);
      navigate('/admin/projects/manage');
    } else {
      // Se não há projetos, vai para a página de projetos
      navigate('/admin/projects');
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        // Counting using head=true for efficiency
        const [clientsRes, projectsRes, evidencesRes, roadmapRes, sprintsActiveRes, reportsPublishedRes] = await Promise.all([
          // Clients with role CLIENT
          (await import('@/integrations/supabase/client')).supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'CLIENT'),
          (await import('@/integrations/supabase/client')).supabase
            .from('projects')
            .select('*', { count: 'exact', head: true }),
          (await import('@/integrations/supabase/client')).supabase
            .from('evidences')
            .select('*', { count: 'exact', head: true }),
          (await import('@/integrations/supabase/client')).supabase
            .from('roadmap_items')
            .select('*', { count: 'exact', head: true }),
          (await import('@/integrations/supabase/client')).supabase
            .from('sprints')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'IN_PROGRESS'),
          (await import('@/integrations/supabase/client')).supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('is_published', true),
        ]);

        setStats({
          clients: clientsRes.count || 0,
          projects: projectsRes.count || 0,
          evidences: evidencesRes.count || 0,
          roadmapItems: roadmapRes.count || 0,
          sprintsActive: sprintsActiveRes.count || 0,
          reportsPublished: reportsPublishedRes.count || 0,
        });
      } catch (e) {
        console.error('Erro ao buscar estatísticas do admin:', e);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Itens de navegação hierárquica para edição
  const [editNavOptions, setEditNavOptions] = useState({
    projeto: {} as any,
    roadmap: {} as any,
    sprint: {} as any,
    relatorio: {} as any,
    evidencia: {} as any,
  });

  const editNavItems = [
    {
      id: 'projeto',
      title: 'Projeto',
      icon: FolderOpen,
      color: 'bg-purple-500',
      selectLabel: 'Selecione o projeto',
      editPath: (id: string) => `/admin/projects/${id}/edit`,
      stats: statsLoading ? '...' : `${stats.projects} projetos`,
      options: editNavOptions.projeto
    },
    {
      id: 'roadmap',
      title: 'Roadmap',
      icon: MapPin,
      color: 'bg-pink-500',
      selectLabel: 'Selecione o roadmap',
      editPath: (id: string) => `/admin/roadmaps/${id}/edit`,
      stats: statsLoading ? '...' : `${stats.roadmapItems} itens`,
      options: editNavOptions.roadmap
    },
    {
      id: 'sprint',
      title: 'Sprint',
      icon: PlayCircle,
      color: 'bg-green-500',
      selectLabel: 'Selecione a sprint',
      editPath: (id: string) => `/admin/sprints/${id}/edit`,
      stats: statsLoading ? '...' : `${stats.sprintsActive} ativas`,
      options: editNavOptions.sprint
    },
    {
      id: 'relatorio',
      title: 'Relatório',
      icon: FileText,
      color: 'bg-red-500',
      selectLabel: 'Selecione o relatório',
      editPath: (id: string) => `/admin/reports/${id}/edit`,
      stats: statsLoading ? '...' : `${stats.reportsPublished} publicados`,
      options: editNavOptions.relatorio
    },
    {
      id: 'evidencia',
      title: 'Evidência',
      icon: Camera,
      color: 'bg-indigo-500',
      selectLabel: 'Selecione a evidência',
      editPath: (id: string) => `/admin/evidences/${id}/edit`,
      stats: statsLoading ? '...' : `${stats.evidences} arquivos`,
      options: editNavOptions.evidencia
    }
  ];


  // Estado para seleção dinâmica
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null as null | typeof editNavItems[0]);
  const [selectedId, setSelectedId] = useState('');

  // Busca real dos itens para seleção dinâmica
  useEffect(() => {
    const fetchOptions = async () => {
      const [projects, roadmaps, sprints, reports, evidences] = await Promise.all([
        supabase.from('projects').select('id, name, client_display_name').order('created_at', { ascending: false }),
        supabase.from('roadmap_items').select('id, title, project_id, projects(name, client_display_name)').order('created_at', { ascending: false }),
        supabase.from('sprints').select('id, sprint_number, project_id, projects(name, client_display_name)').order('created_at', { ascending: false }),
        supabase.from('reports').select('id, title, project_id, projects(name, client_display_name)').order('created_at', { ascending: false }),
        supabase.from('evidences').select('id, name, report_id, reports(title, project_id, projects(name, client_display_name))').order('created_at', { ascending: false }),
      ]);

      // Função helper para agrupar por cliente e projeto
      const groupByClientAndProject = (items: any[], getClientName: (item: any) => string, getProjectName: (item: any) => string, getLabel: (item: any) => string, isProjectLevel: boolean = false) => {
        if (isProjectLevel) {
          // Para projetos: apenas cliente > projetos
          const grouped: { [client: string]: { id: string, label: string }[] } = {};
          items.forEach(item => {
            const client = getClientName(item);
            if (!grouped[client]) grouped[client] = [];
            grouped[client].push({ id: item.id, label: getLabel(item) });
          });
          return grouped;
        } else {
          // Para outros itens: cliente > projeto > itens
          const grouped: { [client: string]: { [project: string]: { id: string, label: string }[] } } = {};
          items.forEach(item => {
            const client = getClientName(item);
            const project = getProjectName(item);
            if (!grouped[client]) grouped[client] = {};
            if (!grouped[client][project]) grouped[client][project] = [];
            grouped[client][project].push({ id: item.id, label: getLabel(item) });
          });
          return grouped;
        }
      };

      setEditNavOptions({
        projeto: groupByClientAndProject(
          projects.data || [],
          (p: any) => p.client_display_name,
          (p: any) => p.name,
          (p: any) => p.name,
          true // isProjectLevel
        ),
        roadmap: groupByClientAndProject(
          roadmaps.data || [],
          (r: any) => r.projects?.client_display_name || 'Cliente não encontrado',
          (r: any) => r.projects?.name || 'Projeto não encontrado',
          (r: any) => r.title
        ),
        sprint: groupByClientAndProject(
          sprints.data || [],
          (s: any) => s.projects?.client_display_name || 'Cliente não encontrado',
          (s: any) => s.projects?.name || 'Projeto não encontrado',
          (s: any) => `Sprint ${s.sprint_number}`
        ),
        relatorio: groupByClientAndProject(
          reports.data || [],
          (r: any) => r.projects?.client_display_name || 'Cliente não encontrado',
          (r: any) => r.projects?.name || 'Projeto não encontrado',
          (r: any) => r.title
        ),
        evidencia: groupByClientAndProject(
          evidences.data || [],
          (e: any) => e.reports?.projects?.client_display_name || 'Cliente não encontrado',
          (e: any) => e.reports?.projects?.name || 'Projeto não encontrado',
          (e: any) => e.name || 'Sem nome'
        ),
      });
    };
    fetchOptions();
  }, []);

  const handleEditClick = (item: typeof editNavItems[0]) => {
    setModalItem(item);
    setSelectedId('');
    setModalOpen(true);
  };

  const handleConfirmEdit = () => {
    if (modalItem && selectedId) {
      navigate(modalItem.editPath(selectedId));
      setModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Dashboard Admin</h1>
              <p className="text-sm text-gray-400">
                Gerencie todos os aspectos do sistema através do fluxo hierárquico
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={handleManagementPanel} 
                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <LayoutDashboard className="w-4 h-4" />
                Painel de Gerenciamento
              </Button>
              <Button variant="outline" onClick={handleSignOut} className="gap-2 border-gray-700 hover:bg-gray-800">
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="space-y-2 mb-8">
          <h2 className="text-3xl font-bold">Bem-vindo ao Painel Administrativo</h2>
          <p className="text-gray-400">
            Monitore estatísticas e acesse ferramentas de gerenciamento do sistema.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-100 to-green-300 border-0">
            <CardContent className="p-4 flex flex-col items-center">
              <Activity className="h-6 w-6 text-green-600 mb-2" />
              <span className="text-lg font-semibold text-green-700">Status</span>
              <p className="text-2xl font-bold text-green-800 mt-1">Ativo</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-blue-100 to-blue-300 border-0">
            <CardContent className="p-4 flex flex-col items-center">
              <Users className="h-6 w-6 text-blue-600 mb-2" />
              <span className="text-lg font-semibold text-blue-700">Clientes</span>
              <p className="text-2xl font-bold text-blue-800 mt-1">{statsLoading ? '...' : stats.clients}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-100 to-purple-300 border-0">
            <CardContent className="p-4 flex flex-col items-center">
              <FolderOpen className="h-6 w-6 text-purple-600 mb-2" />
              <span className="text-lg font-semibold text-purple-700">Projetos</span>
              <p className="text-2xl font-bold text-purple-800 mt-1">{statsLoading ? '...' : stats.projects}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-indigo-100 to-indigo-300 border-0">
            <CardContent className="p-4 flex flex-col items-center">
              <Camera className="h-6 w-6 text-indigo-600 mb-2" />
              <span className="text-lg font-semibold text-indigo-700">Evidências</span>
              <p className="text-2xl font-bold text-indigo-800 mt-1">{statsLoading ? '...' : stats.evidences}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Navigation */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Navegação Rápida</h3>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card 
              className="bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90 transition-colors cursor-pointer"
              onClick={() => navigate('/admin/projects')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/20">
                    <FolderOpen className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Projetos</CardTitle>
                    <CardDescription className="text-xs">Gerenciar projetos</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card 
              className="bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90 transition-colors cursor-pointer"
              onClick={() => navigate('/admin/roadmaps')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-pink-500/20">
                    <MapPin className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Roadmaps</CardTitle>
                    <CardDescription className="text-xs">Planejamento futuro</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card 
              className="bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90 transition-colors cursor-pointer"
              onClick={() => navigate('/admin/sprints')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/20">
                    <PlayCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Sprints</CardTitle>
                    <CardDescription className="text-xs">Gerenciar sprints</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card 
              className="bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90 transition-colors cursor-pointer"
              onClick={() => navigate('/admin/reports')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/20">
                    <FileText className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Relatórios</CardTitle>
                    <CardDescription className="text-xs">Ver relatórios</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Additional Navigation Row */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card 
              className="bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90 transition-colors cursor-pointer"
              onClick={() => navigate('/admin/evidences')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-500/20">
                    <Camera className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Evidências</CardTitle>
                    <CardDescription className="text-xs">Gerenciar arquivos</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card 
              className="bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90 transition-colors cursor-pointer"
              onClick={() => navigate('/admin/clients')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/20">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Clientes</CardTitle>
                    <CardDescription className="text-xs">Gerenciar usuários</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Placeholder cards for future features */}
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 opacity-50">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-500/20">
                    <Activity className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Analytics</CardTitle>
                    <CardDescription className="text-xs">Em breve</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border/50 opacity-50">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-500/20">
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Configurações</CardTitle>
                    <CardDescription className="text-xs">Em breve</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Hierarchical Edit Section */}
        <div className="space-y-6 mt-12">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Edição Hierárquica</h3>
            <p className="text-sm text-gray-400">Selecione itens específicos para editar</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {editNavItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Card
                  key={item.id}
                  className={`cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary/20 ${item.color} bg-opacity-10`}
                  onClick={() => handleEditClick(item)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${item.color} bg-opacity-20`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {String(index + 1).padStart(2, '0')}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {item.stats}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Modal de seleção dinâmica */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{modalItem?.title}</DialogTitle>
              <p className="text-sm text-muted-foreground">Selecione o item que deseja editar</p>
            </DialogHeader>
            <div className="space-y-6">
              {modalItem?.options && Object.keys(modalItem.options).length > 0 ? (
                Object.entries(modalItem.options).map(([clientName, clientData]) => (
                  <div key={clientName} className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <h3 className="font-bold text-base text-blue-600">{clientName}</h3>
                    </div>
                    
                    {/* Verifica se é estrutura aninhada (cliente > projeto > itens) ou plana (cliente > itens) */}
                    {Array.isArray(clientData) ? (
                      // Estrutura plana: projetos
                      <div className="grid gap-2 pl-6">
                        {clientData.map((item: { id: string, label: string }) => (
                          <button
                            key={item.id}
                            onClick={() => setSelectedId(item.id)}
                            className={`w-full text-left p-3 rounded-lg border transition-all hover:bg-accent hover:border-primary/50 ${
                              selectedId === item.id
                                ? 'bg-primary/10 border-primary ring-1 ring-primary/20'
                                : 'bg-card border-border'
                            }`}
                          >
                            <div className="font-medium text-sm">{item.label}</div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      // Estrutura aninhada: cliente > projeto > itens
                      Object.entries(clientData as { [project: string]: { id: string, label: string }[] }).map(([projectName, projectItems]) => (
                        <div key={projectName} className="pl-6 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="font-semibold text-green-600">{projectName}</span>
                          </div>
                          <div className="grid gap-1 pl-4">
                            {projectItems.map((item: { id: string, label: string }) => (
                              <button
                                key={item.id}
                                onClick={() => setSelectedId(item.id)}
                                className={`w-full text-left p-2 rounded border transition-all hover:bg-accent hover:border-primary/50 ${
                                  selectedId === item.id
                                    ? 'bg-primary/10 border-primary ring-1 ring-primary/20'
                                    : 'bg-card border-border'
                                }`}
                              >
                                <div className="font-medium text-xs">{item.label}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum item encontrado para edição.</p>
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleConfirmEdit} disabled={!selectedId} className="flex-1">
                  Editar Selecionado
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

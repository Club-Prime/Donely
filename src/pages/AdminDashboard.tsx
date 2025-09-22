import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FolderOpen, 
  MapPin, 
  PlayCircle, 
  FileText, 
  Camera,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
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

  const navigationItems = [
    {
      id: 'clientes',
      title: 'Clientes',
      description: 'Gerenciar clientes e configurações',
      icon: Users,
      color: 'bg-blue-500',
      route: '/admin/clients',
      stats: statsLoading ? '...' : `${stats.clients} ativos`
    },
    {
      id: 'projetos', 
      title: 'Projetos',
      description: 'Criar e gerenciar projetos',
      icon: FolderOpen,
      color: 'bg-green-500',
      route: '/admin/projects',
      stats: statsLoading ? '...' : `${stats.projects} cadastrados`
    },
    {
      id: 'roadmap',
      title: 'Roadmap',
      description: 'Planejamento e cronograma',
      icon: MapPin,
      color: 'bg-purple-500',
      route: '/admin/projects/manage',
      stats: statsLoading ? '...' : `${stats.roadmapItems} marcos`
    },
    {
      id: 'sprints',
      title: 'Sprints',
      description: 'Gestão de sprints e tarefas',
      icon: PlayCircle,
      color: 'bg-orange-500',
      route: '/admin/projects/manage',
      stats: statsLoading ? '...' : `${stats.sprintsActive} ativas`
    },
    {
      id: 'relatorios',
      title: 'Relatórios',
      description: 'Análises e relatórios detalhados',
      icon: FileText,
      color: 'bg-red-500',
      route: '/admin/reports',
      stats: statsLoading ? '...' : `${stats.reportsPublished} publicados`
    },
    {
      id: 'evidencias',
      title: 'Evidências',
      description: 'Gerenciar evidências e documentos',
      icon: Camera,
      color: 'bg-indigo-500',
      route: '/admin/projects/manage',
      stats: statsLoading ? '...' : `${stats.evidences} arquivos`
    }
  ];

  const handleNavigate = (route: string) => {
    navigate(route);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
          <p className="text-muted-foreground">
            Gerencie todos os aspectos do sistema através do fluxo hierárquico
          </p>
        </div>
        <Button variant="outline" onClick={handleSignOut} className="gap-2">
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>

      {/* Métricas resumidas removidas para simplificar a tela */}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Fluxo de Navegação Hierárquico</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Card 
                key={item.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary/20"
                onClick={() => handleNavigate(item.route)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${item.color} bg-opacity-10`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {item.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.stats}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Removido: Painel de Ações Rápidas e Fluxo de Trabalho Recomendado conforme solicitação */}
    </div>
  );
};

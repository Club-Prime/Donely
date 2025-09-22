import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Route, CheckCircle2, Clock, Circle, Calendar } from 'lucide-react';

interface RoadmapItem {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
  effort: number;
  start_date?: string;
  end_date?: string;
  dependency_ids: string[];
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface RoadmapViewProps {
  projectId: string;
}

export const RoadmapView = ({ projectId }: RoadmapViewProps) => {
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    progress: 0
  });

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const { data, error } = await supabase
          .from('roadmap_items')
          .select('*')
          .eq('project_id', projectId)
          .order('order_index', { ascending: true });

        if (error) throw error;
        
        const items = data || [];
        setRoadmapItems(items);

        // Calculate statistics
        const completed = items.filter(item => item.status === 'DONE').length;
        const inProgress = items.filter(item => item.status === 'IN_PROGRESS').length;
        const notStarted = items.filter(item => item.status === 'NOT_STARTED').length;
        const total = items.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        setStats({
          total,
          completed,
          inProgress,
          notStarted,
          progress
        });
      } catch (error) {
        console.error('Erro ao buscar roadmap:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [projectId]);

  const getStatusBadge = (status: RoadmapItem['status']) => {
    switch (status) {
      case 'DONE':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Concluído</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-500 hover:bg-blue-600"><Clock className="w-3 h-3 mr-1" />Em Progresso</Badge>;
      case 'NOT_STARTED':
        return <Badge variant="outline"><Circle className="w-3 h-3 mr-1" />Não Iniciado</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getEffortBadge = (effort: number) => {
    if (effort <= 3) return <Badge variant="outline">Baixo ({effort})</Badge>;
    if (effort <= 7) return <Badge variant="secondary">Médio ({effort})</Badge>;
    return <Badge variant="destructive">Alto ({effort})</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Roadmap do Projeto</h3>
        <p className="text-muted-foreground">
          Planejamento detalhado das funcionalidades e marcos do projeto.
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="w-5 h-5" />
            Progresso Geral
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Conclusão</span>
            <span className="text-2xl font-bold">{stats.progress}%</span>
          </div>
          <Progress value={stats.progress} className="h-2" />
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-lg">{stats.completed}</div>
              <div className="text-muted-foreground">Concluído</div>
            </div>
            <div>
              <div className="font-semibold text-lg">{stats.inProgress}</div>
              <div className="text-muted-foreground">Em Progresso</div>
            </div>
            <div>
              <div className="font-semibold text-lg">{stats.notStarted}</div>
              <div className="text-muted-foreground">Não Iniciado</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roadmap Items */}
      {roadmapItems.length === 0 ? (
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-8 text-center">
            <Route className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">Roadmap não definido ainda</h4>
            <p className="text-muted-foreground text-sm">
              O planejamento detalhado aparecerá aqui conforme o projeto evoluir.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {roadmapItems.map((item, index) => (
            <Card key={item.id} className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-mono text-muted-foreground">#{index + 1}</span>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {getStatusBadge(item.status)}
                    {getEffortBadge(item.effort)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Esforço:</span>
                    <div className="font-medium">{item.effort} ponto{item.effort > 1 ? 's' : ''}</div>
                  </div>
                  {item.start_date && (
                    <div>
                      <span className="text-muted-foreground">Início:</span>
                      <div className="font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.start_date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  )}
                  {item.end_date && (
                    <div>
                      <span className="text-muted-foreground">Fim:</span>
                      <div className="font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.end_date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
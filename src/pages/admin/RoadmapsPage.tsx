import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MapPin, Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface RoadmapItem {
  id: string;
  title: string;
  description?: string;
  effort: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
  start_date?: string;
  end_date?: string;
  dependency_ids: string[];
  order_index: number;
  created_at: string;
  updated_at: string;
  project_id: string;
  projects?: {
    name: string;
    client_display_name: string;
  };
}

export const RoadmapsPage = () => {
  const navigate = useNavigate();
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = async () => {
    try {
      const { data, error } = await supabase
        .from('roadmap_items')
        .select(`
          *,
          projects(name, client_display_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoadmaps(data || []);
    } catch (error) {
      console.error('Erro ao buscar roadmaps:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os roadmaps",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoadmap = async (roadmapId: string, roadmapTitle: string) => {
    if (!confirm(`Tem certeza que deseja excluir o roadmap "${roadmapTitle}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('roadmap_items')
        .delete()
        .eq('id', roadmapId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Roadmap excluído com sucesso!"
      });

      // Atualizar a lista removendo o roadmap excluído
      setRoadmaps(prev => prev.filter(roadmap => roadmap.id !== roadmapId));
    } catch (error) {
      console.error('Erro ao excluir roadmap:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o roadmap",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_STARTED': return 'bg-gray-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'DONE': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NOT_STARTED': return 'Não Iniciado';
      case 'IN_PROGRESS': return 'Em Progresso';
      case 'DONE': return 'Concluído';
      default: return 'Desconhecido';
    }
  };

  const getPriorityColor = (effort: number) => {
    if (effort >= 8) return 'text-red-500';
    if (effort >= 5) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getPriorityText = (effort: number) => {
    if (effort >= 8) return 'Alta';
    if (effort >= 5) return 'Média';
    return 'Baixa';
  };

  const filteredRoadmaps = roadmaps.filter(roadmap => {
    const matchesSearch = roadmap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         roadmap.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         roadmap.projects?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || roadmap.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Group roadmaps by client and project
  const groupedRoadmaps = filteredRoadmaps.reduce((acc, roadmap) => {
    const clientName = roadmap.projects?.client_display_name || 'Cliente não encontrado';
    const projectName = roadmap.projects?.name || 'Projeto não encontrado';
    
    if (!acc[clientName]) {
      acc[clientName] = {};
    }
    if (!acc[clientName][projectName]) {
      acc[clientName][projectName] = [];
    }
    acc[clientName][projectName].push(roadmap);
    
    return acc;
  }, {} as Record<string, Record<string, RoadmapItem[]>>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 py-10">
        <div className="max-w-[1800px] mx-auto px-2">
          <div className="text-center">
            <div className="text-xl font-semibold">Carregando roadmaps...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 py-10">
      <div className="max-w-[1800px] mx-auto px-2 mb-4">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-300 hover:text-primary transition mb-2"
        >
          <ArrowLeft className="w-5 h-5" /> Voltar para o Dashboard
        </button>
      </div>

      <div className="max-w-[1800px] mx-auto flex flex-col gap-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Roadmaps</h1>
            <p className="text-gray-400 mt-1">Visualize e gerencie todos os itens do roadmap</p>
          </div>
          <Button 
            className="gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
            onClick={() => navigate('/admin/roadmaps/new')}
          >
            <Plus className="w-4 h-4" />
            Novo Roadmap
          </Button>
        </header>

        {/* Filters */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar roadmaps..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 bg-background border border-border rounded-md text-sm"
                >
                  <option value="all">Todos os Status</option>
                  <option value="NOT_STARTED">Não Iniciado</option>
                  <option value="IN_PROGRESS">Em Progresso</option>
                  <option value="DONE">Concluído</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roadmaps Grid */}
        <div className="space-y-8">
          {Object.keys(groupedRoadmaps).length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">Nenhum roadmap encontrado</h3>
              <p className="text-gray-500">Tente ajustar os filtros ou crie um novo roadmap.</p>
            </div>
          ) : (
            Object.entries(groupedRoadmaps).map(([clientName, projects]) => (
              <div key={clientName} className="space-y-4">
                <h2 className="text-xl font-semibold text-primary">{clientName}</h2>
                {Object.entries(projects).map(([projectName, projectRoadmaps]) => (
                  <div key={projectName} className="space-y-2">
                    <h3 className="text-lg font-medium text-muted-foreground ml-4">{projectName}</h3>
                    <div className="grid gap-4 ml-8 md:grid-cols-2 lg:grid-cols-3">
                      {projectRoadmaps.map((roadmap) => (
                        <Card key={roadmap.id} className="bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90 transition-colors">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-lg line-clamp-2">{roadmap.title}</CardTitle>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>Esforço: {roadmap.effort}h</span>
                                  <span>•</span>
                                  <span className={getPriorityColor(roadmap.effort)}>{getPriorityText(roadmap.effort)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`${getStatusColor(roadmap.status)} text-white text-xs`}>
                                  {getStatusText(roadmap.status)}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {roadmap.description || 'Sem descrição'}
                            </p>
                            <div className="flex items-center justify-between mt-4">
                              <div className="text-xs text-muted-foreground">
                                Criado em {new Date(roadmap.created_at).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/admin/roadmaps/${roadmap.id}/edit`)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteRoadmap(roadmap.id, roadmap.title)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, PlayCircle, Plus, Edit2, Trash2, Search, Filter, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface Sprint {
  id: string;
  sprint_number: number;
  week_start_date: string;
  week_end_date: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'DONE';
  planned_scope: any;
  created_at: string;
  updated_at: string;
  project_id: string;
  projects?: {
    name: string;
    client_display_name: string;
  };
  reports?: {
    id: string;
    title: string;
    is_published: boolean;
  }[];
}

export const SprintsPage = () => {
  const navigate = useNavigate();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchSprints();
  }, []);

  const fetchSprints = async () => {
    try {
      const { data, error } = await supabase
        .from('sprints')
        .select(`
          *,
          projects(name, client_display_name),
          reports(id, title, is_published)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSprints(data || []);
    } catch (error) {
      console.error('Erro ao buscar sprints:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as sprints",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSprint = async (sprintId: string, sprintNumber: number) => {
    if (!confirm(`Tem certeza que deseja excluir a Sprint ${sprintNumber}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sprints')
        .delete()
        .eq('id', sprintId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Sprint excluída com sucesso!"
      });

      // Atualizar a lista removendo a sprint excluída
      setSprints(prev => prev.filter(sprint => sprint.id !== sprintId));
    } catch (error) {
      console.error('Erro ao excluir sprint:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a sprint",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'bg-gray-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'DONE': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'Planejada';
      case 'IN_PROGRESS': return 'Em Progresso';
      case 'DONE': return 'Concluída';
      default: return 'Desconhecido';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filteredSprints = sprints.filter(sprint => {
    const matchesSearch = `Sprint ${sprint.sprint_number}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sprint.projects?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sprint.projects?.client_display_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || sprint.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Group sprints by client, project, and roadmap
  const groupedSprints = filteredSprints.reduce((acc, sprint) => {
    const clientName = sprint.projects?.client_display_name || 'Cliente não encontrado';
    const projectName = sprint.projects?.name || 'Projeto não encontrado';
    
    if (!acc[clientName]) {
      acc[clientName] = {};
    }
    if (!acc[clientName][projectName]) {
      acc[clientName][projectName] = [];
    }
    acc[clientName][projectName].push(sprint);
    
    return acc;
  }, {} as Record<string, Record<string, Sprint[]>>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 py-10">
        <div className="max-w-[1800px] mx-auto px-2">
          <div className="text-center">
            <div className="text-xl font-semibold">Carregando sprints...</div>
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
            <h1 className="text-3xl font-bold">Gerenciamento de Sprints</h1>
            <p className="text-gray-400 mt-1">Visualize e gerencie todas as sprints dos projetos</p>
          </div>
          <Button 
            className="gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            onClick={() => navigate('/admin/sprints/new')}
          >
            <Plus className="w-4 h-4" />
            Nova Sprint
          </Button>
        </header>

        {/* Filters */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar sprints..."
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
                  <option value="PLANNED">Planejada</option>
                  <option value="IN_PROGRESS">Em Progresso</option>
                  <option value="DONE">Concluída</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sprints Grid */}
        <div className="space-y-8">
          {Object.keys(groupedSprints).length === 0 ? (
            <div className="text-center py-12">
              <PlayCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">Nenhuma sprint encontrada</h3>
              <p className="text-gray-500">Tente ajustar os filtros ou crie uma nova sprint.</p>
            </div>
          ) : (
            Object.entries(groupedSprints).map(([clientName, projects]) => (
              <div key={clientName} className="space-y-4">
                <h2 className="text-xl font-semibold text-primary">{clientName}</h2>
                {Object.entries(projects).map(([projectName, projectSprints]) => (
                  <div key={projectName} className="space-y-2">
                    <h3 className="text-lg font-medium text-muted-foreground ml-4">{projectName}</h3>
                    <div className="grid gap-4 ml-8 md:grid-cols-2 lg:grid-cols-3">
                      {projectSprints.map((sprint) => (
                        <Card key={sprint.id} className="bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90 transition-colors">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-lg">Sprint {sprint.sprint_number}</CardTitle>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="w-4 h-4" />
                                  <span>{formatDate(sprint.week_start_date)} - {formatDate(sprint.week_end_date)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`${getStatusColor(sprint.status)} text-white text-xs`}>
                                  {getStatusText(sprint.status)}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {sprint.reports && sprint.reports.length > 0 && (
                                <div className="text-sm text-muted-foreground">
                                  <span className="font-medium">Relatórios:</span> {sprint.reports.length}
                                </div>
                              )}
                              <div className="flex items-center justify-between mt-4">
                                <div className="text-xs text-muted-foreground">
                                  Criado em {new Date(sprint.created_at).toLocaleDateString('pt-BR')}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/admin/sprints/${sprint.id}/edit`)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteSprint(sprint.id, sprint.sprint_number)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
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
import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Users, 
  FolderOpen, 
  Map, 
  Calendar, 
  FileText, 
  Image, 
  Edit2, 
  Save, 
  X, 
  Plus,
  Settings,
  Trash2
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { supabase } from '../../integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Client {
  id: string;
  user_id: string;
  full_name: string;
  projects: Project[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  progress_percent: number;
  roadmapItems: RoadmapItem[];
}

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
  sprints: Sprint[];
  reports: Report[];
  evidences: Evidence[];
}

interface Sprint {
  id: string;
  sprint_number: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'DONE';
  week_start_date: string;
  week_end_date: string;
}

interface Report {
  id: string;
  title: string;
  created_at: string;
  sprint_id: string;
}

interface Evidence {
  id: string;
  storage_key: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  thumbnail_url?: string;
}

interface ExpandedState {
  clients: Set<string>;
  projects: Set<string>;
  roadmapItems: Set<string>;
  sprints: Set<string>;
  reports: Set<string>;
}

interface EditingState {
  type: 'client' | 'project' | 'roadmapItem' | 'sprint' | 'report' | null;
  id: string | null;
  data: any;
}

const HierarchicalNavigator: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [expanded, setExpanded] = useState<ExpandedState>({
    clients: new Set(),
    projects: new Set(),
    roadmapItems: new Set(),
    sprints: new Set(),
    reports: new Set()
  });

  const [editing, setEditing] = useState<EditingState>({
    type: null,
    id: null,
    data: null
  });

  const [showAddForm, setShowAddForm] = useState<{
    type: 'project' | 'roadmapItem' | 'sprint' | 'report' | null;
    parentId: string | null;
  }>({
    type: null,
    parentId: null
  });

  const fetchHierarchicalData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Buscar todos os clientes
      const { data: clientProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, name, email')
        .eq('role', 'CLIENT');

      if (profilesError) throw profilesError;

      // Buscar acessos de projetos
      const { data: projectAccess, error: accessError } = await supabase
        .from('client_project_access')
        .select(`
          user_id,
          project_id,
          projects (
            id,
            name,
            description,
            status,
            progress_percent
          )
        `)
        .eq('is_active', true);

      if (accessError) throw accessError;

      // Buscar todos os projetos disponíveis
      const projectIds = projectAccess?.map(access => access.project_id) || [];

      // Buscar roadmap items
      const { data: roadmapItems, error: roadmapError } = await supabase
        .from('roadmap_items')
        .select('*')
        .in('project_id', projectIds);

      if (roadmapError) throw roadmapError;

      // Buscar sprints
      const { data: sprints, error: sprintsError } = await supabase
        .from('sprints')
        .select('*')
        .in('project_id', projectIds);

      if (sprintsError) throw sprintsError;

      // Buscar relatórios
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .in('project_id', projectIds);

      if (reportsError) throw reportsError;

      // Buscar evidências
      const reportIds = reports?.map(r => r.id) || [];
      const { data: evidences, error: evidencesError } = await supabase
        .from('evidences')
        .select('*')
        .in('report_id', reportIds);

      if (evidencesError) throw evidencesError;

      // Organizar dados hierarquicamente
      const organizedClients: Client[] = clientProfiles?.map(client => {
        // Encontrar projetos do cliente
        const clientProjectAccess = projectAccess?.filter(
          access => access.user_id === client.user_id
        ) || [];

        const projects: Project[] = clientProjectAccess.map(access => {
          const project = access.projects;
          
          // Buscar roadmap items do projeto
          const projectRoadmapItems = roadmapItems?.filter(
            item => item.project_id === project.id
          ) || [];

          const roadmapItemsWithData: RoadmapItem[] = projectRoadmapItems.map(item => {
            // Buscar sprints do projeto
            const projectSprints = sprints?.filter(
              sprint => sprint.project_id === project.id
            ) || [];

            // Buscar relatórios do projeto
            const projectReports = reports?.filter(
              report => report.project_id === project.id
            ) || [];

            // Buscar evidências dos relatórios
            const itemEvidences = evidences?.filter(evidence => 
              projectReports.some(report => report.id === evidence.report_id)
            ) || [];

            return {
              id: item.id,
              title: item.title,
              description: item.description || '',
              priority: 'MEDIUM' as const,
              status: item.status as 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE',
              sprints: projectSprints.map(sprint => ({
                id: sprint.id,
                sprint_number: sprint.sprint_number,
                status: sprint.status as 'PLANNED' | 'IN_PROGRESS' | 'DONE',
                week_start_date: sprint.week_start_date,
                week_end_date: sprint.week_end_date
              })),
              reports: projectReports.map(report => ({
                id: report.id,
                title: report.title,
                created_at: report.created_at,
                sprint_id: report.sprint_id || ''
              })),
              evidences: itemEvidences.map(evidence => ({
                id: evidence.id,
                storage_key: evidence.storage_key,
                type: evidence.type as 'IMAGE' | 'VIDEO',
                url: evidence.url,
                thumbnail_url: evidence.thumbnail_url || undefined
              }))
            };
          });

          return {
            id: project.id,
            name: project.name,
            description: project.description || '',
            status: project.status,
            progress_percent: project.progress_percent || 0,
            roadmapItems: roadmapItemsWithData
          };
        });

        return {
          id: client.id,
          user_id: client.user_id,
          full_name: client.name,
          projects
        };
      }) || [];

      setClients(organizedClients);
    } catch (error) {
      console.error('Erro ao carregar dados hierárquicos:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchicalData();
  }, []);

  const toggleExpansion = (type: keyof ExpandedState, id: string) => {
    setExpanded(prev => {
      const newSet = new Set(prev[type]);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { ...prev, [type]: newSet };
    });
  };

  // Funções de edição
  const startEditing = (type: EditingState['type'], id: string, currentData: any) => {
    setEditing({ type, id, data: { ...currentData } });
  };

  const cancelEditing = () => {
    setEditing({ type: null, id: null, data: null });
  };

  const saveEdit = async () => {
    if (!editing.type || !editing.id) return;

    try {
      let tableName = '';
      let updateData: any = {};

      switch (editing.type) {
        case 'project':
          tableName = 'projects';
          updateData = {
            name: editing.data.name,
            description: editing.data.description,
            status: editing.data.status
          };
          break;
        case 'roadmapItem':
          tableName = 'roadmap_items';
          updateData = {
            title: editing.data.title,
            description: editing.data.description,
            status: editing.data.status
          };
          break;
        case 'sprint':
          tableName = 'sprints';
          updateData = {
            week_start_date: editing.data.week_start_date,
            week_end_date: editing.data.week_end_date,
            status: editing.data.status
          };
          break;
        case 'report':
          tableName = 'reports';
          updateData = {
            title: editing.data.title
          };
          break;
      }

      const { error } = await supabase
        .from(tableName as any)
        .update(updateData)
        .eq('id', editing.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item atualizado com sucesso!",
      });

      await fetchHierarchicalData();
      cancelEditing();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar item.",
        variant: "destructive",
      });
    }
  };

  const deleteItem = async (type: string, id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      let tableName = '';
      switch (type) {
        case 'project': tableName = 'projects'; break;
        case 'roadmapItem': tableName = 'roadmap_items'; break;
        case 'sprint': tableName = 'sprints'; break;
        case 'report': tableName = 'reports'; break;
      }

      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item excluído com sucesso!",
      });

      await fetchHierarchicalData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir item.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'NOT_STARTED': 'bg-gray-500',
      'IN_PROGRESS': 'bg-blue-500',
      'DONE': 'bg-green-500',
      'PLANNED': 'bg-yellow-500'
    };

    return (
      <Badge className={`${statusColors[status] || 'bg-gray-500'} text-white`}>
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors: Record<string, string> = {
      'HIGH': 'bg-red-500',
      'MEDIUM': 'bg-orange-500',
      'LOW': 'bg-green-500'
    };

    return (
      <Badge className={`${priorityColors[priority] || 'bg-gray-500'} text-white text-xs`}>
        {priority}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 mb-4">Erro: {error}</p>
        <button 
          onClick={fetchHierarchicalData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Navegação Hierárquica</h2>
        <p className="text-muted-foreground">
          Organize e acesse seus projetos de forma estruturada
        </p>
      </div>

      {clients.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <Card key={client.id} className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Cliente */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleExpansion('clients', client.id)}
                      className="flex items-center space-x-2 hover:bg-muted/50 p-2 rounded transition-colors"
                    >
                      {expanded.clients.has(client.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Users className="h-5 w-5 text-blue-500" />
                      <div className="text-left">
                        <div className="font-medium text-foreground">{client.full_name}</div>
                        <div className="text-xs text-muted-foreground">{client.projects.length} projetos</div>
                      </div>
                    </button>
                  </div>

                  {/* Projetos */}
                  {expanded.clients.has(client.id) && (
                    <div className="ml-6 space-y-2">
                      {client.projects.map((project) => (
                        <div key={project.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => toggleExpansion('projects', project.id)}
                              className="flex items-center space-x-2 hover:bg-muted/50 p-2 rounded transition-colors flex-1"
                            >
                              {expanded.projects.has(project.id) ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <FolderOpen className="h-4 w-4 text-green-500" />
                              <div className="text-left flex-1">
                                {editing.type === 'project' && editing.id === project.id ? (
                                  <div className="space-y-2">
                                    <Input
                                      value={editing.data.name || ''}
                                      onChange={(e) => setEditing(prev => ({
                                        ...prev,
                                        data: { ...prev.data, name: e.target.value }
                                      }))}
                                      className="h-6 text-sm"
                                      placeholder="Nome do projeto"
                                    />
                                    <div className="flex space-x-1">
                                      <Button
                                        size="sm"
                                        onClick={saveEdit}
                                        className="h-6 px-2"
                                      >
                                        <Save className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={cancelEditing}
                                        className="h-6 px-2"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="font-medium text-foreground">{project.name}</div>
                                    <div className="text-xs text-muted-foreground">Progresso: {project.progress_percent}%</div>
                                  </>
                                )}
                              </div>
                            </button>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(project.status)}
                              <span className="text-xs text-muted-foreground">
                                {project.roadmapItems.length} itens
                              </span>
                              {/* Controles de edição do projeto */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing('project', project.id, project);
                                }}
                                className="h-6 w-6 p-0 hover:bg-muted/50"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteItem('project', project.id);
                                }}
                                className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Roadmap Items */}
                          {expanded.projects.has(project.id) && (
                            <div className="ml-6 space-y-2">
                              {project.roadmapItems.map((roadmapItem) => (
                                <div key={roadmapItem.id} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <button
                                      onClick={() => toggleExpansion('roadmapItems', roadmapItem.id)}
                                      className="flex items-center space-x-2 hover:bg-muted/50 p-2 rounded transition-colors flex-1"
                                    >
                                      {expanded.roadmapItems.has(roadmapItem.id) ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      <Map className="h-4 w-4 text-purple-500" />
                                      <div className="text-left flex-1">
                                        {editing.type === 'roadmapItem' && editing.id === roadmapItem.id ? (
                                          <div className="space-y-2">
                                            <Input
                                              value={editing.data.title || ''}
                                              onChange={(e) => setEditing(prev => ({
                                                ...prev,
                                                data: { ...prev.data, title: e.target.value }
                                              }))}
                                              className="h-6 text-sm"
                                              placeholder="Título do roadmap"
                                            />
                                            <div className="flex space-x-1">
                                              <Button
                                                size="sm"
                                                onClick={saveEdit}
                                                className="h-6 px-2"
                                              >
                                                <Save className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={cancelEditing}
                                                className="h-6 px-2"
                                              >
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <div className="font-medium text-foreground">{roadmapItem.title}</div>
                                            <div className="text-xs text-muted-foreground">{roadmapItem.description}</div>
                                          </>
                                        )}
                                      </div>
                                    </button>
                                    <div className="flex items-center space-x-2">
                                      {getPriorityBadge(roadmapItem.priority)}
                                      {getStatusBadge(roadmapItem.status)}
                                      {/* Controles de edição do roadmap item */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startEditing('roadmapItem', roadmapItem.id, roadmapItem);
                                        }}
                                        className="h-6 w-6 p-0 hover:bg-muted/50"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteItem('roadmapItem', roadmapItem.id);
                                        }}
                                        className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Sprints, Reports, Evidences */}
                                  {expanded.roadmapItems.has(roadmapItem.id) && (
                                    <div className="ml-6 space-y-3 border-l border-border/30 pl-4">
                                      {/* Sprints */}
                                      {roadmapItem.sprints.length > 0 && (
                                        <div>
                                          <div className="flex items-center space-x-2 mb-2">
                                            <Calendar className="h-4 w-4 text-orange-500" />
                                            <span className="text-sm font-medium text-foreground">
                                              Sprints ({roadmapItem.sprints.length})
                                            </span>
                                          </div>
                                          <div className="ml-6 space-y-1">
                                            {roadmapItem.sprints.map((sprint) => (
                                              <div key={sprint.id} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                                                <div>
                                                  <span className="text-sm text-foreground">Sprint #{sprint.sprint_number}</span>
                                                  <div className="text-xs text-muted-foreground">
                                                    {sprint.week_start_date} - {sprint.week_end_date}
                                                  </div>
                                                </div>
                                                {getStatusBadge(sprint.status)}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Reports */}
                                      {roadmapItem.reports.length > 0 && (
                                        <div>
                                          <div className="flex items-center space-x-2 mb-2">
                                            <FileText className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm font-medium text-foreground">
                                              Relatórios ({roadmapItem.reports.length})
                                            </span>
                                          </div>
                                          <div className="ml-6 space-y-1">
                                            {roadmapItem.reports.map((report) => (
                                              <div key={report.id} className="p-2 bg-muted/20 rounded">
                                                <div className="text-sm text-foreground">{report.title}</div>
                                                <div className="text-xs text-muted-foreground">
                                                  {new Date(report.created_at).toLocaleDateString('pt-BR')}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Evidences */}
                                      {roadmapItem.evidences.length > 0 && (
                                        <div>
                                          <div className="flex items-center space-x-2 mb-2">
                                            <Image className="h-4 w-4 text-red-500" />
                                            <span className="text-sm font-medium text-foreground">
                                              Evidências ({roadmapItem.evidences.length})
                                            </span>
                                          </div>
                                          <div className="ml-6 grid grid-cols-2 gap-2">
                                            {roadmapItem.evidences.slice(0, 4).map((evidence) => (
                                              <div key={evidence.id} className="aspect-square bg-muted/20 rounded flex items-center justify-center">
                                                {evidence.thumbnail_url ? (
                                                  <img 
                                                    src={evidence.thumbnail_url} 
                                                    alt="Evidence" 
                                                    className="w-full h-full object-cover rounded"
                                                  />
                                                ) : (
                                                  <div className="text-center">
                                                    <Image className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground">{evidence.type}</span>
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                            {roadmapItem.evidences.length > 4 && (
                                              <div className="aspect-square bg-muted/20 rounded flex items-center justify-center">
                                                <span className="text-xs text-muted-foreground">
                                                  +{roadmapItem.evidences.length - 4} mais
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
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

export default HierarchicalNavigator;
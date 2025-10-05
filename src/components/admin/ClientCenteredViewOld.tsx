import React, { useState, useEffect } from 'react';
import { 
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
  Trash2,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  MoreHorizontal,
  Activity,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
impo                  {selectedClient.projects.map((project, index) => (
                    <Card 
                      key={project.id}
                      onClick={() => handleProjectSelect(project)}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] animate-in slide-in-from-bottom-4 ${
                        selectedProject?.id === project.id ? 'ring-2 ring-primary shadow-lg' : ''
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}put } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { supabase } from '../../integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Interfaces
interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
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
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
  sprints: Sprint[];
  reports: Report[];
}

interface Sprint {
  id: string;
  sprint_number: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'DONE';
  week_start_date: string;
  week_end_date: string;
  evidences: Evidence[];
}

interface Report {
  id: string;
  title: string;
  created_at: string;
  sprint_id: string;
  evidences: Evidence[];
}

interface Evidence {
  id: string;
  storage_key: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  thumbnail_url?: string;
}

const ClientCenteredView: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMode, setEditingMode] = useState<{
    type: 'sprint' | 'roadmap' | 'client' | 'project' | 'report' | null;
    id: string | null;
    data: any;
  }>({ type: null, id: null, data: null });

  // Estados para expansão
  const [expandedRoadmaps, setExpandedRoadmaps] = useState<Set<string>>(new Set());
  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchClientsData();
  }, []);

  const fetchClientsData = async () => {
    setLoading(true);
    try {
      // Buscar clientes
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

      // Organizar dados
      const organizedClients: Client[] = clientProfiles?.map(client => {
        const clientProjectAccess = projectAccess?.filter(
          access => access.user_id === client.user_id
        ) || [];

        const projects: Project[] = clientProjectAccess.map(access => {
          const project = access.projects;
          
          const projectRoadmapItems = roadmapItems?.filter(
            item => item.project_id === project.id
          ) || [];

          const roadmapItemsWithData: RoadmapItem[] = projectRoadmapItems.map(item => {
            const projectSprints = sprints?.filter(
              sprint => sprint.project_id === project.id
            ) || [];

            const projectReports = reports?.filter(
              report => report.project_id === project.id
            ) || [];

            return {
              id: item.id,
              title: item.title,
              description: item.description || '',
              status: item.status as 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE',
              sprints: projectSprints.map(sprint => ({
                id: sprint.id,
                sprint_number: sprint.sprint_number,
                status: sprint.status as 'PLANNED' | 'IN_PROGRESS' | 'DONE',
                week_start_date: sprint.week_start_date,
                week_end_date: sprint.week_end_date,
                evidences: evidences?.filter(evidence => 
                  projectReports.some(report => 
                    report.sprint_id === sprint.id && report.id === evidence.report_id
                  )
                ).map(evidence => ({
                  id: evidence.id,
                  storage_key: evidence.storage_key,
                  type: evidence.type as 'IMAGE' | 'VIDEO',
                  url: evidence.url,
                  thumbnail_url: evidence.thumbnail_url || undefined
                })) || []
              })),
              reports: projectReports.map(report => ({
                id: report.id,
                title: report.title,
                created_at: report.created_at,
                sprint_id: report.sprint_id || '',
                evidences: evidences?.filter(evidence => 
                  evidence.report_id === report.id
                ).map(evidence => ({
                  id: evidence.id,
                  storage_key: evidence.storage_key,
                  type: evidence.type as 'IMAGE' | 'VIDEO',
                  url: evidence.url,
                  thumbnail_url: evidence.thumbnail_url || undefined
                })) || []
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
          name: client.name,
          email: client.email,
          projects
        };
      }) || [];

      setClients(organizedClients);
      
      // Selecionar primeiro cliente automaticamente se existir
      if (organizedClients.length > 0) {
        setSelectedClient(organizedClients[0]);
        if (organizedClients[0].projects.length > 0) {
          setSelectedProject(organizedClients[0].projects[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos clientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setSelectedProject(client.projects[0] || null);
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
  };

  const toggleRoadmapExpansion = (roadmapId: string) => {
    setExpandedRoadmaps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roadmapId)) {
        newSet.delete(roadmapId);
      } else {
        newSet.add(roadmapId);
      }
      return newSet;
    });
  };

  const toggleSprintExpansion = (sprintId: string) => {
    setExpandedSprints(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sprintId)) {
        newSet.delete(sprintId);
      } else {
        newSet.add(sprintId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_STARTED': case 'PLANNED': return 'bg-gray-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'DONE': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NOT_STARTED': case 'PLANNED': return Clock;
      case 'IN_PROGRESS': return Activity;
      case 'DONE': return CheckCircle;
      default: return Clock;
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="text-center animate-in fade-in duration-500">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-12 w-12 border-4 border-transparent border-r-primary animate-ping mx-auto"></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">Carregando Workspace</p>
            <p className="text-sm text-muted-foreground">Organizando dados dos clientes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar com Clientes */}
      <div className="w-80 border-r border-border bg-card/30 backdrop-blur-sm">
        {/* Header da Sidebar */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-2 mb-3">
            <Users className="h-5 w-5 text-blue-500" />
            <h2 className="font-semibold text-foreground">Clientes</h2>
            <Badge variant="secondary" className="text-xs">
              {clients.length}
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8"
            />
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="overflow-y-auto flex-1">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              onClick={() => handleClientSelect(client)}
              className={`p-4 border-b border-border/50 cursor-pointer transition-all duration-200 hover:bg-muted/50 ${
                selectedClient?.id === client.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">{client.name}</div>
                  <div className="text-xs text-muted-foreground">{client.email}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {client.projects.length} projeto{client.projects.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-500">
        {/* Toolbar de Edição */}
        <div className="h-14 bg-card/50 backdrop-blur-sm border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.history.back()} 
              className="h-8"
            >
              ← Dashboard
            </Button>
            <div className="h-4 w-px bg-border" />
            <span className="text-sm text-muted-foreground">Ferramentas de Edição:</span>
            <Button variant="ghost" size="sm" className="h-8">
              <Edit2 className="h-3 w-3 mr-1" />
              Sprints
            </Button>
            <Button variant="ghost" size="sm" className="h-8">
              <Map className="h-3 w-3 mr-1" />
              Roadmap
            </Button>
            <Button variant="ghost" size="sm" className="h-8">
              <FileText className="h-3 w-3 mr-1" />
              Relatórios
            </Button>
            <Button variant="ghost" size="sm" className="h-8">
              <Users className="h-3 w-3 mr-1" />
              Clientes
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="h-8">
              <Filter className="h-3 w-3 mr-1" />
              Filtros
            </Button>
            <Button variant="ghost" size="sm" className="h-8">
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-y-auto p-6 animate-in fade-in duration-300">
          {selectedClient ? (
            <div className="space-y-6">
              {/* Header do Cliente */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{selectedClient.name}</h1>
                  <p className="text-muted-foreground">{selectedClient.email}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    {selectedClient.projects.length} projeto{selectedClient.projects.length !== 1 ? 's' : ''}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Edit2 className="h-3 w-3 mr-1" />
                    Editar Cliente
                  </Button>
                </div>
              </div>

              {/* Grid de Projetos */}
              {selectedClient.projects.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {selectedClient.projects.map((project, index) => (
                  <Card 
                    key={project.id}
                    onClick={() => handleProjectSelect(project)}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                      selectedProject?.id === project.id ? 'ring-2 ring-primary shadow-lg' : ''
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <FolderOpen className="h-5 w-5 text-green-500" />
                        <Badge className={`${getStatusColor(project.status)} text-white`}>
                          {project.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{project.progress_percent}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${project.progress_percent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{project.roadmapItems.length} roadmap items</span>
                          <span>{project.roadmapItems.reduce((acc, item) => acc + item.sprints.length, 0)} sprints</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Nenhum Projeto Encontrado
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Este cliente ainda não possui projetos associados.
                    </p>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Projeto
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Detalhes do Projeto Selecionado */}
              {selectedProject && (
                <Card className="mt-8 animate-in slide-in-from-bottom-4 duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FolderOpen className="h-6 w-6 text-green-500" />
                        <div>
                          <CardTitle className="text-xl">{selectedProject.name}</CardTitle>
                          <p className="text-muted-foreground">{selectedProject.description}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Edit2 className="h-3 w-3 mr-1" />
                        Editar Projeto
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Roadmap Items */}
                    {selectedProject.roadmapItems.map((roadmapItem) => (
                      <Card key={roadmapItem.id} className="bg-muted/20">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => toggleRoadmapExpansion(roadmapItem.id)}
                              className="flex items-center space-x-2 hover:bg-muted/50 p-2 rounded transition-colors flex-1 text-left"
                            >
                              {expandedRoadmaps.has(roadmapItem.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <Map className="h-4 w-4 text-purple-500" />
                              <div className="flex-1">
                                <div className="font-medium">{roadmapItem.title}</div>
                                <div className="text-sm text-muted-foreground">{roadmapItem.description}</div>
                              </div>
                            </button>
                            <div className="flex items-center space-x-2">
                              <Badge className={`${getStatusColor(roadmapItem.status)} text-white`}>
                                {roadmapItem.status}
                              </Badge>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>

                        {expandedRoadmaps.has(roadmapItem.id) && (
                          <CardContent className="space-y-4">
                            {/* Sprints */}
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-orange-500" />
                                <span className="font-medium">Sprints ({roadmapItem.sprints.length})</span>
                              </div>
                              
                              {roadmapItem.sprints.map((sprint) => {
                                const StatusIcon = getStatusIcon(sprint.status);
                                return (
                                  <Card key={sprint.id} className="bg-background/50">
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                          <StatusIcon className="h-4 w-4 text-orange-500" />
                                          <span className="font-medium">Sprint #{sprint.sprint_number}</span>
                                          <Badge className={`${getStatusColor(sprint.status)} text-white text-xs`}>
                                            {sprint.status}
                                          </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {sprint.week_start_date} - {sprint.week_end_date}
                                        </div>
                                      </div>
                                      
                                      {/* Evidências da Sprint */}
                                      {sprint.evidences.length > 0 && (
                                        <div className="mt-3">
                                          <div className="flex items-center space-x-2 mb-2">
                                            <Image className="h-3 w-3 text-red-500" />
                                            <span className="text-sm font-medium">Evidências ({sprint.evidences.length})</span>
                                          </div>
                                          <div className="grid grid-cols-4 gap-2">
                                            {sprint.evidences.slice(0, 4).map((evidence) => (
                                              <div key={evidence.id} className="aspect-square bg-muted/30 rounded flex items-center justify-center">
                                                {evidence.thumbnail_url ? (
                                                  <img 
                                                    src={evidence.thumbnail_url} 
                                                    alt="Evidence" 
                                                    className="w-full h-full object-cover rounded"
                                                  />
                                                ) : (
                                                  <Image className="h-4 w-4 text-muted-foreground" />
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>

                            {/* Relatórios */}
                            {roadmapItem.reports.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <FileText className="h-4 w-4 text-blue-500" />
                                  <span className="font-medium">Relatórios ({roadmapItem.reports.length})</span>
                                </div>
                                
                                {roadmapItem.reports.map((report) => (
                                  <Card key={report.id} className="bg-background/50">
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                          <FileText className="h-4 w-4 text-blue-500" />
                                          <span className="font-medium">{report.title}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {new Date(report.created_at).toLocaleDateString('pt-BR')}
                                        </div>
                                      </div>
                                      
                                      {/* Evidências do Relatório */}
                                      {report.evidences.length > 0 && (
                                        <div className="mt-3">
                                          <div className="flex items-center space-x-2 mb-2">
                                            <Image className="h-3 w-3 text-red-500" />
                                            <span className="text-sm font-medium">Evidências ({report.evidences.length})</span>
                                          </div>
                                          <div className="grid grid-cols-4 gap-2">
                                            {report.evidences.slice(0, 4).map((evidence) => (
                                              <div key={evidence.id} className="aspect-square bg-muted/30 rounded flex items-center justify-center">
                                                {evidence.thumbnail_url ? (
                                                  <img 
                                                    src={evidence.thumbnail_url} 
                                                    alt="Evidence" 
                                                    className="w-full h-full object-cover rounded"
                                                  />
                                                ) : (
                                                  <Image className="h-4 w-4 text-muted-foreground" />
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Selecione um Cliente
                </h3>
                <p className="text-muted-foreground">
                  Escolha um cliente na barra lateral para visualizar seus projetos
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientCenteredView;
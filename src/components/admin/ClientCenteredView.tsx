import { AdminEvidenciasView } from './AdminEvidenciasView';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
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
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Switch } from "../ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Import new hooks and components
import { useSprintCRUD } from '@/hooks/useSprintCRUD';
import { useReportCRUD } from '@/hooks/useReportCRUD';
import { SprintModal } from './SprintModal';
import { RoadmapModal } from './RoadmapModal';
import { ReportModal } from './ReportModal';
// import { SprintTaskList } from './SprintTaskList';

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
  project_id: string;
  title: string;
  description: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
  category?: string;
  priority?: string;
  sprints: Sprint[];
  reports: Report[];
}

interface Sprint {
  id: string;
  sprint_number: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'DONE';
  week_start_date: string;
  week_end_date: string;
  start_date?: string;
  end_date?: string;
  project_id?: string;
  custom_name?: string;
  name?: string;
  description?: string;
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
  name?: string;
  thumbnail_url?: string;
}

const ClientCenteredView: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompletedRoadmap, setShowCompletedRoadmap] = useState(true);
  const [expandedRoadmaps, setExpandedRoadmaps] = useState<Set<string>>(new Set());

  // Modal States
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [sprintModalOpen, setSprintModalOpen] = useState(false);
  const [roadmapModalOpen, setRoadmapModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportViewModalOpen, setReportViewModalOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<any>(null);
  const [sprintViewModalOpen, setSprintViewModalOpen] = useState(false);
  const [viewingSprint, setViewingSprint] = useState<any>(null);
  
  // Form States
  const [editingClient, setEditingClient] = useState<any>(null);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editingSprint, setEditingSprint] = useState<any>(null);
  const [editingRoadmap, setEditingRoadmap] = useState<any>(null);
  const [editingReport, setEditingReport] = useState<any>(null);
  
  // Form Data States
  const [clientFormData, setClientFormData] = useState({
    name: '',
    email: '',
    company: ''
  });
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    slug: '',
    description: '',
    status: 'ACTIVE' as 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'DONE'
  });
  const [sprintFormData, setSprintFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    description: '',
    status: 'PLANNED' as 'PLANNED' | 'IN_PROGRESS' | 'DONE',
    roadmap_item_id: '' // Vinculação opcional com roadmap item específico
  });
  const [roadmapFormData, setRoadmapFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    status: 'NOT_STARTED' as 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE'
  });
  const [reportFormData, setReportFormData] = useState({
    title: '',
    description: '',
    type: 'weekly'
  });
  
  // Estados para seleção de evidências
  const [availableEvidences, setAvailableEvidences] = useState<any[]>([]);
  const [selectedEvidences, setSelectedEvidences] = useState<string[]>([]);
  
  // Estados para upload de evidências
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [evidenceNames, setEvidenceNames] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchClientsData();
  }, []);

  // Initialize CRUD hooks
  const sprintCRUD = useSprintCRUD(selectedProject?.id || null);
  const reportCRUD = useReportCRUD(selectedProject?.id || null);

  const fetchClientsData = async () => {
    console.log('Iniciando fetchClientsData...');
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

      // Buscar evidências dos relatórios com informações completas
      const reportIds = reports?.map(r => r.id) || [];
      const { data: evidences, error: evidencesError } = await supabase
        .from('evidences')
        .select(`
          id,
          report_id,
          type,
          storage_key,
          url,
          thumbnail_url,
          mime_type,
          size_bytes,
          created_at
        `)
        .in('report_id', reportIds);

      if (evidencesError) {
        console.error('Erro ao buscar evidências:', evidencesError);
        throw evidencesError;
      }

      // Buscar URLs assinadas para as evidências (se necessário)
      const evidencesWithUrls = await Promise.all(
        (evidences || []).map(async (evidence) => {
          // Se a URL não estiver preenchida, tentar gerar uma URL assinada
          if (!evidence.url && evidence.storage_key) {
            try {
              const { data: urlData } = await supabase.storage
                .from('evidences')
                .createSignedUrl(evidence.storage_key, 3600); // 1 hora
              
              if (urlData?.signedUrl) {
                evidence.url = urlData.signedUrl;
                
                // Tentar gerar thumbnail se não existir
                if (!evidence.thumbnail_url && evidence.type === 'IMAGE') {
                  const { data: thumbData } = await supabase.storage
                    .from('evidences')
                    .createSignedUrl(evidence.storage_key, 3600, {
                      transform: {
                        width: 300,
                        height: 300,
                        resize: 'cover'
                      }
                    });
                  if (thumbData?.signedUrl) {
                    evidence.thumbnail_url = thumbData.signedUrl;
                  }
                }
              }
            } catch (urlError) {
              console.warn('Erro ao gerar URL para evidência:', evidence.id, urlError);
            }
          }
          return evidence;
        })
      );
      
      const allEvidences = evidencesWithUrls || [];

      // Organizar dados
      const organizedClients: Client[] = clientProfiles?.map(client => {
        const clientProjectAccess = projectAccess?.filter(
          access => access.user_id === client.user_id
        ) || [];

        const projects: Project[] = clientProjectAccess.map(access => {
          const project = access.projects;

          const projectRoadmapItems = (roadmapItems || []).filter(
            item => item.project_id === project.id
          ).map(item => ({
            ...item,
            description: item.description ?? '',
          }));

          // Sprints independentes (sem roadmap_item_id)
          const independentSprints = (sprints || []).filter(
            sprint => sprint.project_id === project.id && (!('roadmap_item_id' in sprint) || sprint.roadmap_item_id === undefined || sprint.roadmap_item_id === null || sprint.roadmap_item_id === '')
          ).map(sprint => ({
            ...sprint,
            // Provide fallback for UI display only
            display_name: sprint.sprint_number ? `Sprint ${sprint.sprint_number}` : 'Sprint',
          }));

          const projectReports = reports?.filter(
            report => report.project_id === project.id
          ) || [];

          const roadmapItemsWithData: RoadmapItem[] = projectRoadmapItems.map(item => {
            const projectSprints = (sprints || []).filter(
              sprint => sprint.project_id === project.id && ('roadmap_item_id' in sprint) && sprint.roadmap_item_id === item.id
            ).map(sprint => ({
              ...sprint,
              display_name: sprint.sprint_number ? `Sprint ${sprint.sprint_number}` : 'Sprint',
            }));

            return {
              id: item.id,
              project_id: item.project_id,
              title: item.title,
              description: item.description || '',
              status: item.status as 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE',
              category: '', // fallback for type
              priority: 'medium', // fallback for type
              sprints: projectSprints.map(sprint => {
                // Buscar evidências via relatórios deste sprint
                const sprintEvidences = allEvidences?.filter(evidence =>
                  projectReports.some(report =>
                    report.sprint_id === sprint.id && report.id === evidence.report_id
                  )
                ) || [];

                // Buscar nome personalizado do relatório
                const sprintReport = projectReports.find(report => report.sprint_id === sprint.id);
                const customName = sprintReport?.title ?
                  sprintReport.title.replace('Relatório Sprint ', '') :
                  sprint.display_name;

                return {
                  id: sprint.id,
                  sprint_number: sprint.sprint_number,
                  project_id: sprint.project_id,
                  week_start_date: sprint.week_start_date ?? '',
                  week_end_date: sprint.week_end_date ?? '',
                  start_date: sprint.week_start_date ?? '',
                  end_date: sprint.week_end_date ?? '',
                  status: sprint.status ?? 'PLANNED',
                  evidences: sprintEvidences.map(evidence => ({
                    id: evidence.id,
                    storage_key: evidence.storage_key,
                    type: evidence.type as 'IMAGE' | 'VIDEO',
                    url: evidence.url,
                    thumbnail_url: evidence.thumbnail_url || undefined
                  })),
                  custom_name: customName,
                  name: sprint.display_name ?? '',
                  description: '',
                };
              }),
              reports: projectReports.map(report => {
                // Buscar evidências deste relatório
                const reportEvidences = allEvidences?.filter(evidence => 
                  evidence.report_id === report.id
                ) || [];

                return {
                  id: report.id,
                  title: report.title,
                  content_md: report.content_md,
                  created_at: report.created_at,
                  sprint_id: report.sprint_id || '',
                  evidences: reportEvidences.map(evidence => ({
                    id: evidence.id,
                    storage_key: evidence.storage_key,
                    type: evidence.type as 'IMAGE' | 'VIDEO',
                    url: evidence.url,
                    thumbnail_url: evidence.thumbnail_url || undefined
                  }))
                };
              })
            };
          });

          return {
            id: project.id,
            name: project.name,
            description: project.description || '',
            status: project.status,
            progress_percent: project.progress_percent || 0,
            roadmapItems: roadmapItemsWithData,
            independentSprints
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
      console.log('Clientes organizados:', organizedClients);
      
      // Selecionar primeiro cliente automaticamente se existir
      if (organizedClients.length > 0) {
        setSelectedClient(organizedClients[0]);
        console.log('Cliente selecionado:', organizedClients[0]);
        if (organizedClients[0].projects.length > 0) {
          setSelectedProject(organizedClients[0].projects[0]);
          console.log('Projeto selecionado:', organizedClients[0].projects[0]);
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
      console.log('fetchClientsData concluído');
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

  // CRUD Functions
  const resetForms = () => {
    setClientFormData({ name: '', email: '', company: '' });
    setProjectFormData({ name: '', slug: '', description: '', status: 'ACTIVE' });
    setSprintFormData({ name: '', start_date: '', end_date: '', description: '', status: 'PLANNED', roadmap_item_id: '' });
    setRoadmapFormData({ title: '', description: '', category: '', priority: 'medium', status: 'NOT_STARTED' });
    setReportFormData({ title: '', description: '', type: 'weekly' });
    setEditingClient(null);
    setEditingProject(null);
    setEditingSprint(null);
    setEditingRoadmap(null);
    setEditingReport(null);
  };

  const openClientModal = (client?: any) => {
    if (client) {
      setEditingClient(client);
      setClientFormData({
        name: client.name,
        email: client.email,
        company: client.company || ''
      });
    } else {
      resetForms();
    }
    setClientModalOpen(true);
  };

  const openProjectModal = (project?: any) => {
    if (project) {
      setEditingProject(project);
      setProjectFormData({
        name: project.name,
        slug: project.slug || '',
        description: project.description,
        status: project.status
      });
    } else {
      resetForms();
    }
    setProjectModalOpen(true);
  };

  // Modal handlers using new CRUD hooks
  const handleSprintSave = async (data: any, selectedEvidences: string[]) => {
    try {
      if (editingSprint) {
        await sprintCRUD.updateSprint(editingSprint.id, data, selectedEvidences);
      } else {
        await sprintCRUD.createSprint(data, selectedEvidences);
      }
      setSprintModalOpen(false);
      setEditingSprint(null);
      await fetchClientsData(); // Refresh data
    } catch (error) {
      console.error('Erro ao salvar sprint:', error);
    }
  };

  const handleRoadmapSave = async (data: any) => {
    // TODO: Implement roadmap save functionality
    console.log('Roadmap save not implemented yet', data);
    setRoadmapModalOpen(false);
    setEditingRoadmap(null);
  };

  const handleReportSave = async (data: any, files?: FileList) => {
    try {
      if (editingReport) {
        await reportCRUD.updateReport(editingReport.id, data);
      } else {
        const report = await reportCRUD.createReport(data);
        if (files && report) {
          for (let i = 0; i < files.length; i++) {
            await reportCRUD.uploadEvidence(files[i], report.id);
          }
        }
      }
      setReportModalOpen(false);
      setEditingReport(null);
      await fetchClientsData(); // Refresh data
    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
    }
  };

  const openSprintModal = async (sprint?: any) => {
    // Sempre recarregar evidências antes de abrir o modal
    await loadAvailableEvidences();
    if (sprint) {
      setEditingSprint(sprint);
      // Buscar relatório associado ao sprint para carregar a descrição e nome personalizado
      let sprintDescription = '';
      let sprintCustomName = `Sprint ${sprint.sprint_number}`;
      try {
        const { data: report } = await supabase
          .from('reports')
          .select('content_md, title')
          .eq('sprint_id', sprint.id)
          .limit(1)
          .single();
        if (report) {
          sprintDescription = report.content_md || '';
          if (report.title && report.title !== `Relatório Sprint ${sprint.sprint_number}`) {
            sprintCustomName = report.title.replace('Relatório Sprint ', '');
          }
        }
      } catch (error) {
        console.warn('Erro ao buscar relatório do sprint:', error);
      }
      setSprintFormData({
        name: sprintCustomName,
        start_date: sprint.week_start_date,
        end_date: sprint.week_end_date,
        description: sprintDescription,
        status: sprint.status || 'PLANNED',
        roadmap_item_id: sprint.roadmap_item_id || ''
      });
      // Pré-selecionar evidências existentes
      const sprintEvidenceIds = sprint.evidences?.map((e: any) => e.id) || [];
      setSelectedEvidences(sprintEvidenceIds);
    } else {
      resetForms();
      setSelectedEvidences([]);
    }
    setSprintModalOpen(true);
  };

  const openRoadmapModal = (roadmap?: any) => {
    if (roadmap) {
      setEditingRoadmap(roadmap);
      setRoadmapFormData({
        title: roadmap.title,
        description: roadmap.description,
        category: roadmap.category || '',
        priority: roadmap.priority || 'medium',
        status: roadmap.status || 'NOT_STARTED'
      });
    } else {
      resetForms();
    }
    setRoadmapModalOpen(true);
  };

  const openReportModal = (report?: any) => {
    if (report) {
      setEditingReport(report);
      setReportFormData({
        title: report.title,
        description: report.description || '',
        type: report.type || 'weekly'
      });
    } else {
      resetForms();
    }
    setReportModalOpen(true);
  };

  const openReportViewModal = (report: any) => {
    setViewingReport(report);
    setReportViewModalOpen(true);
  };

  const openSprintViewModal = async (sprint: any) => {
    // Buscar relatório associado ao sprint para carregar a descrição
    let sprintDescription = '';
    try {
      const { data: report } = await supabase
        .from('reports')
        .select('content_md, title')
        .eq('sprint_id', sprint.id)
        .limit(1)
        .single();

      if (report) {
        sprintDescription = report.content_md || '';
      }
    } catch (error) {
      console.warn('Erro ao buscar relatório do sprint:', error);
    }

    // Adicionar descrição ao sprint para exibição
    setViewingSprint({ ...sprint, description: sprintDescription });
    setSprintViewModalOpen(true);
  };

  const loadAvailableEvidences = async () => {
    if (!selectedProject) return;
    
    try {
      // Buscar todas as evidências do projeto atual
      const { data: projectReports } = await supabase
        .from('reports')
        .select('id')
        .eq('project_id', selectedProject.id);
        
      if (projectReports && projectReports.length > 0) {
        const reportIds = projectReports.map(r => r.id);
        const { data: projectEvidences } = await supabase
          .from('evidences')
          .select(`
            id,
            report_id,
            type,
            storage_key,
            url,
            thumbnail_url,
            mime_type,
            created_at
          `)
          .in('report_id', reportIds);
          
        setAvailableEvidences(projectEvidences || []);
      } else {
        setAvailableEvidences([]);
      }
    } catch (error) {
      console.error('Erro ao carregar evidências disponíveis:', error);
      setAvailableEvidences([]);
    }
  };

  // Atualizar nome da evidência
  const handleRenameEvidence = async (id: string, name: string) => {
    const { error } = await supabase
      .from('evidences')
      .update({ name })
      .eq('id', id);
    if (!error) {
      await loadAvailableEvidences();
      toast({ title: 'Nome atualizado', description: 'Nome da evidência atualizado com sucesso!' });
    } else {
      toast({ title: 'Erro', description: 'Erro ao atualizar nome da evidência', variant: 'destructive' });
    }
  };

  // Remover evidência
  const handleDeleteEvidence = async (id: string) => {
    const { error } = await supabase
      .from('evidences')
      .delete()
      .eq('id', id);
    if (!error) {
      await loadAvailableEvidences();
      toast({ title: 'Evidência removida', description: 'Evidência removida com sucesso!' });
    } else {
      toast({ title: 'Erro', description: 'Erro ao remover evidência', variant: 'destructive' });
    }
  };

  // CLIENT CRUD
  const handleSaveClient = async () => {
    try {
      if (editingClient) {
        // Update
        const { error } = await supabase
          .from('profiles')
          .update({
            name: clientFormData.name,
            email: clientFormData.email
          })
          .eq('id', editingClient.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Cliente atualizado com sucesso!",
        });
      } else {
        // Create new client profile - seria necessário criar um usuário primeiro
        toast({
          title: "Info",
          description: "Funcionalidade de criação de cliente em desenvolvimento. Use o sistema de autenticação.",
          variant: "destructive",
        });
        return;
      }

      setClientModalOpen(false);
      resetForms();
      fetchClientsData();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar cliente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente deletado com sucesso!",
      });

      fetchClientsData();
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar cliente.",
        variant: "destructive",
      });
    }
  };

  // PROJECT CRUD
  const handleSaveProject = async () => {
    if (!selectedClient) return;

    try {
      if (editingProject) {
        // Update
        const { error } = await supabase
          .from('projects')
          .update({
            name: projectFormData.name,
            description: projectFormData.description,
            status: projectFormData.status as 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'DONE'
          })
          .eq('id', editingProject.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Projeto atualizado com sucesso!",
        });
      } else {
        // Create
        // Gerar slug a partir do nome
        const slug = projectFormData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: projectFormData.name,
            slug: projectFormData.slug || slug,
            description: projectFormData.description,
            status: projectFormData.status as 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'DONE',
            progress_percent: 0
          })
          .select()
          .single();

        if (projectError) throw projectError;

        // Create project access
        const { error: accessError } = await supabase
          .from('client_project_access')
          .insert({
            user_id: selectedClient.user_id,
            project_id: newProject.id,
            is_active: true
          });

        if (accessError) throw accessError;

        toast({
          title: "Sucesso",
          description: "Projeto criado com sucesso!",
        });
      }

      setProjectModalOpen(false);
      resetForms();
      
      // Aguardar e recarregar dados
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchClientsData();
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar projeto.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      // Delete project access first
      await supabase
        .from('client_project_access')
        .delete()
        .eq('project_id', projectId);

      // Delete project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Projeto deletado com sucesso!",
      });

      // Aguardar e recarregar dados
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchClientsData();
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar projeto.",
        variant: "destructive",
      });
    }
  };

  // SPRINT CRUD
  const handleSaveSprint = async () => {
    if (!selectedProject) return;

    console.log('Iniciando salvamento do sprint...');
    console.log('Sprint form data:', sprintFormData);
    console.log('Editing sprint:', editingSprint);

    try {
      let sprintId = null;

      if (editingSprint) {
        // Update sprint básico - apenas campos que existem na tabela
        console.log('Atualizando sprint existente:', editingSprint.id);
        const { error: sprintError } = await supabase
          .from('sprints')
          .update({
            week_start_date: sprintFormData.start_date,
            week_end_date: sprintFormData.end_date,
            status: sprintFormData.status as 'PLANNED' | 'IN_PROGRESS' | 'DONE',
            roadmap_item_id: sprintFormData.roadmap_item_id || null
          })
          .eq('id', editingSprint.id);

        if (sprintError) {
          console.error('Erro ao atualizar sprint:', sprintError);
          throw sprintError;
        }
        sprintId = editingSprint.id;

        // Atualizar ou criar relatório associado ao sprint
        console.log('Atualizando relatório do sprint existente');
        const { data: existingReport } = await supabase
          .from('reports')
          .select('id')
          .eq('project_id', selectedProject.id)
          .eq('sprint_id', sprintId)
          .limit(1)
          .single();

        if (existingReport) {
          // Atualizar relatório existente
          const { error: reportError } = await supabase
            .from('reports')
            .update({
              title: `Relatório Sprint ${sprintFormData.name}`,
              content_md: sprintFormData.description || 'Relatório do sprint'
            })
            .eq('id', existingReport.id);

          if (reportError) {
            console.warn('Erro ao atualizar relatório do sprint:', reportError);
          }
        } else {
          // Criar novo relatório se não existir
          const { data: newReport, error: reportError } = await supabase
            .from('reports')
            .insert({
              project_id: selectedProject.id,
              sprint_id: sprintId,
              title: `Relatório Sprint ${sprintFormData.name}`,
              content_md: sprintFormData.description || 'Relatório do sprint',
              created_by: (await supabase.auth.getUser()).data.user?.id
            })
            .select('id')
            .single();

          if (reportError) {
            console.warn('Erro ao criar relatório do sprint:', reportError);
          }
        }

        toast({
          title: "Sucesso",
          description: "Sprint atualizado com sucesso!",
        });
      } else {
        // Create new sprint - apenas campos que existem na tabela
        console.log('Criando novo sprint');
        const totalSprints = selectedProject.roadmapItems.reduce((acc, item) => acc + item.sprints.length, 0);

        const { data: newSprint, error: sprintError } = await supabase
          .from('sprints')
          .insert({
            project_id: selectedProject.id,
            sprint_number: totalSprints + 1,
            week_start_date: sprintFormData.start_date,
            week_end_date: sprintFormData.end_date,
            status: sprintFormData.status as 'PLANNED' | 'IN_PROGRESS' | 'DONE',
            roadmap_item_id: sprintFormData.roadmap_item_id || null
          })
          .select('id')
          .single();

        if (sprintError) {
          console.error('Erro ao criar sprint:', sprintError);
          throw sprintError;
        }
        sprintId = newSprint.id;
        console.log('Novo sprint criado com ID:', sprintId);

        toast({
          title: "Sucesso",
          description: "Sprint criado com sucesso!",
        });
      }

      // Associar evidências selecionadas ao sprint via relatórios
      if (selectedEvidences.length > 0 && sprintId) {
        console.log('Associando evidências:', selectedEvidences);
        // Criar ou encontrar um relatório para este sprint
        let sprintReportId = null;

        const { data: existingReport } = await supabase
          .from('reports')
          .select('id')
          .eq('project_id', selectedProject.id)
          .eq('sprint_id', sprintId)
          .limit(1)
          .single();

        if (existingReport) {
          sprintReportId = existingReport.id;
          console.log('Relatório existente encontrado:', sprintReportId);
        } else {
          // Criar novo relatório para o sprint
          console.log('Criando novo relatório para o sprint');
          const { data: newReport, error: reportError } = await supabase
            .from('reports')
            .insert({
              project_id: selectedProject.id,
              sprint_id: sprintId,
              title: `Relatório Sprint ${sprintFormData.name || editingSprint?.sprint_number || 'Novo'}`,
              content_md: sprintFormData.description || 'Relatório do sprint',
              created_by: (await supabase.auth.getUser()).data.user?.id
            })
            .select('id')
            .single();

          if (reportError) {
            console.warn('Erro ao criar relatório do sprint:', reportError);
          } else {
            sprintReportId = newReport.id;
            console.log('Novo relatório criado:', sprintReportId);
          }
        }

        // Atualizar evidências selecionadas para usar este relatório
        if (sprintReportId) {
          const { error: evidenceError } = await supabase
            .from('evidences')
            .update({ report_id: sprintReportId })
            .in('id', selectedEvidences);

          if (evidenceError) {
            console.warn('Erro ao associar evidências:', evidenceError);
          } else {
            console.log('Evidências associadas com sucesso');
          }
        }
      }

      setSprintModalOpen(false);
      resetForms();

      console.log('Aguardando 500ms antes de recarregar dados...');
      // Aguardar e recarregar dados
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Recarregando dados...');
      await fetchClientsData();
      console.log('Dados recarregados com sucesso');
    } catch (error) {
      console.error('Erro ao salvar sprint:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar sprint.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSprint = async (sprintId: string) => {
    try {
      const { error } = await supabase
        .from('sprints')
        .delete()
        .eq('id', sprintId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Sprint deletado com sucesso!",
      });

      // Aguardar e recarregar dados
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchClientsData();
    } catch (error) {
      console.error('Erro ao deletar sprint:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar sprint.",
        variant: "destructive",
      });
    }
  };

  // ROADMAP CRUD
  const handleSaveRoadmap = async () => {
    if (!selectedProject) return;

    try {
      if (editingRoadmap) {
        // Update
        const { error } = await supabase
          .from('roadmap_items')
          .update({
            title: roadmapFormData.title,
            description: roadmapFormData.description,
            status: roadmapFormData.status as 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE'
          })
          .eq('id', editingRoadmap.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Item do roadmap atualizado com sucesso!",
        });
      } else {
        // Create
        const { error } = await supabase
          .from('roadmap_items')
          .insert({
            project_id: selectedProject.id,
            title: roadmapFormData.title,
            description: roadmapFormData.description,
            status: roadmapFormData.status as 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE'
          });

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Item do roadmap criado com sucesso!",
        });
      }

      setRoadmapModalOpen(false);
      resetForms();
      
      // Aguardar e recarregar dados
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchClientsData();
    } catch (error) {
      console.error('Erro ao salvar roadmap:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar item do roadmap.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRoadmap = async (roadmapId: string) => {
    try {
      const { error } = await supabase
        .from('roadmap_items')
        .delete()
        .eq('id', roadmapId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item do roadmap deletado com sucesso!",
      });

      // Aguardar e recarregar dados
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchClientsData();
    } catch (error) {
      console.error('Erro ao deletar roadmap:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar item do roadmap.",
        variant: "destructive",
      });
    }
  };

  // REPORT CRUD
  const handleSaveReport = async () => {
    if (!selectedProject) return;

    try {
      if (editingReport) {
        // Update
        const { error } = await supabase
          .from('reports')
          .update({
            title: reportFormData.title,
            content_md: reportFormData.description
          })
          .eq('id', editingReport.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Relatório atualizado com sucesso!",
        });
      } else {
        // Create
        // Obter user ID atual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { error } = await supabase
          .from('reports')
          .insert({
            project_id: selectedProject.id,
            title: reportFormData.title,
            content_md: reportFormData.description,
            created_by: user.id
          });

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Relatório criado com sucesso!",
        });
      }

      setReportModalOpen(false);
      resetForms();
      
      // Aguardar e recarregar dados
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchClientsData();
    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar relatório.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Relatório deletado com sucesso!",
      });

      // Aguardar e recarregar dados
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchClientsData();
    } catch (error) {
      console.error('Erro ao deletar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar relatório.",
        variant: "destructive",
      });
    }
  };

  // EVIDENCE CRUD
  const openEvidenceModal = () => {
    setSelectedFiles(null);
    setEvidenceModalOpen(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
    // Inicializar nomes customizados
    if (event.target.files) {
      const names: {[key: string]: string} = {};
      Array.from(event.target.files).forEach((file, idx) => {
        names[idx] = file.name.replace(/\.[^/.]+$/, "");
      });
      setEvidenceNames(names);
    }
  };

  const handleUploadEvidences = async () => {
    if (!selectedFiles || selectedFiles.length === 0 || !selectedProject) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um arquivo e um projeto.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    setUploadingFiles(true);
    
    try {
      const uploadedEvidences = [];
      
      // Primeiro, criar um relatório para as evidências se não existir um relatório padrão
      let defaultReportId = null;
      const { data: existingReports } = await supabase
        .from('reports')
        .select('id')
        .eq('project_id', selectedProject.id)
        .eq('title', 'Evidências Gerais')
        .limit(1);
      
      if (existingReports && existingReports.length > 0) {
        defaultReportId = existingReports[0].id;
      } else {
        // Criar relatório padrão para evidências
        const { data: newReport, error: reportError } = await supabase
          .from('reports')
          .insert({
            project_id: selectedProject.id,
            title: 'Evidências Gerais',
            content_md: 'Relatório automaticamente criado para armazenar evidências gerais do projeto.',
            created_by: user.id,
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();
        
        if (reportError) throw reportError;
        defaultReportId = newReport.id;
      }

      // Upload de cada arquivo
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExtension = file.name.split('.').pop();
        const customName = evidenceNames[i] || file.name.replace(/\.[^/.]+$/, "");
        const fileName = `${selectedProject.id}/${Date.now()}_${i}.${fileExtension}`;

        // Upload para storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('evidences')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Erro no upload:', uploadError);
          continue;
        }

        // Gerar URL pública ou assinada
        let fileUrl = null;
        // Tentar publicUrl (caso bucket seja público)
        const { data: publicUrlData } = supabase.storage
          .from('evidences')
          .getPublicUrl(fileName);
        if (publicUrlData?.publicUrl) {
          fileUrl = publicUrlData.publicUrl;
        } else {
          // Gerar signedUrl (caso bucket privado)
          const { data: signedData } = await supabase.storage
            .from('evidences')
            .createSignedUrl(fileName, 3600);
          if (signedData?.signedUrl) fileUrl = signedData.signedUrl;
        }
        if (!fileUrl) {
          console.error('Não foi possível obter a URL da evidência.');
          continue;
        }

        // Determinar o tipo do arquivo
        const fileType = file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO';

        // Salvar referência no banco
        const { data: user } = await supabase.auth.getUser();
        const { data: evidenceData, error: evidenceError } = await supabase
          .from('evidences')
          .insert({
            report_id: defaultReportId,
            type: fileType,
            storage_key: fileName,
            mime_type: file.type,
            size_bytes: file.size,
            created_at: new Date().toISOString(),
            uploaded_by: user.user?.id,
            url: fileUrl,
            name: customName
          })
          .select('id, name')
          .single();

        if (evidenceError) {
          console.error('Erro ao salvar evidência:', evidenceError);
          continue;
        }

        uploadedEvidences.push(evidenceData);
      }

      toast({
        title: "Sucesso",
        description: `${uploadedEvidences.length} evidência(s) enviada(s) com sucesso!`,
      });

  setEvidenceModalOpen(false);
  setSelectedFiles(null);
  // Recarregar evidências disponíveis após upload
  await loadAvailableEvidences();
  // Opcional: manter modal de sprint aberto e atualizar lista se necessário
      
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar evidências.",
        variant: "destructive",
      });
    } finally {
      setUploadingFiles(false);
    }
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
      <div className="w-80 border-r border-border bg-card/30 backdrop-blur-sm animate-in slide-in-from-left-4 duration-500">
        {/* Header da Sidebar */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-2 mb-3">
            <Users className="h-5 w-5 text-blue-500" />
            <h2 className="font-semibold text-foreground">Clientes</h2>
            <Badge variant="secondary" className="text-xs animate-in zoom-in duration-300">
              {clients.length}
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="overflow-y-auto flex-1">
          {filteredClients.map((client, index) => (
            <div
              key={client.id}
              onClick={() => handleClientSelect(client)}
              className={`p-4 border-b border-border/50 cursor-pointer transition-all duration-200 hover:bg-muted/50 animate-in slide-in-from-left-4 ${
                selectedClient?.id === client.id ? 'bg-primary/10 border-l-4 border-l-primary shadow-sm' : ''
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-semibold text-sm">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">{client.name}</div>
                  <div className="text-xs text-muted-foreground">{client.email}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center space-x-1">
                    <FolderOpen className="h-3 w-3" />
                    <span>{client.projects.length} projeto{client.projects.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                {selectedClient?.id === client.id && (
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                )}
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
              className="h-8 hover:bg-primary/10 transition-colors"
            >
              ← Dashboard
            </Button>
            <div className="h-4 w-px bg-border" />
            <span className="text-sm text-muted-foreground">Ferramentas de Edição:</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => openSprintModal()}
              className="h-8 hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
            >
              <Plus className="h-3 w-3 mr-1" />
              Novo Sprint
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => openRoadmapModal()}
              className="h-8 hover:bg-purple-500/10 hover:text-purple-500 transition-colors"
            >
              <Plus className="h-3 w-3 mr-1" />
              Novo Roadmap
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => openReportModal()}
              className="h-8 hover:bg-green-500/10 hover:text-green-500 transition-colors"
            >
              <Plus className="h-3 w-3 mr-1" />
              Novo Relatório
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={openEvidenceModal}
              className="h-8 hover:bg-yellow-500/10 hover:text-yellow-600 transition-colors"
            >
              <Image className="h-3 w-3 mr-1" />
              Adicionar Evidências
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => openClientModal()}
              className="h-8 hover:bg-orange-500/10 hover:text-orange-500 transition-colors"
            >
              <Plus className="h-3 w-3 mr-1" />
              Novo Cliente
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  <Filter className="h-3 w-3 mr-1" />
                  Filtros
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="mb-2 font-semibold">Filtrar Projetos</div>
                <Input
                  placeholder="Buscar por nome do projeto..."
                  onChange={e => setSearchTerm(e.target.value)}
                  value={searchTerm}
                  className="mb-2"
                />
                <div className="text-xs text-muted-foreground">Digite para filtrar os projetos exibidos.</div>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  <Settings className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 space-y-4">
                <div className="font-semibold mb-2">Configurações</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Modo escuro</span>
                  <Switch
                    checked={typeof window !== 'undefined' && document.documentElement.classList.contains('dark')}
                    onCheckedChange={checked => {
                      if (checked) {
                        document.documentElement.classList.add('dark');
                      } else {
                        document.documentElement.classList.remove('dark');
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Exibir roadmap concluído</span>
                  <Switch
                    checked={showCompletedRoadmap}
                    onCheckedChange={setShowCompletedRoadmap}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-y-auto p-6 animate-in fade-in duration-300">
          {selectedClient ? (
            <div className="space-y-6">
              {/* Header do Cliente */}
              <div className="flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
                <div>
                  <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {selectedClient.name}
                  </h1>
                  <div className="text-muted-foreground flex items-center space-x-2 mt-1">
                    <span>{selectedClient.email}</span>
                    <Badge variant="outline" className="text-xs">
                      Cliente Ativo
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <FolderOpen className="h-3 w-3 mr-1" />
                    {selectedClient.projects.length} projeto{selectedClient.projects.length !== 1 ? 's' : ''}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openProjectModal()}
                    className="hover:bg-primary/10"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Novo Projeto
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openClientModal(selectedClient)}
                    className="hover:bg-primary/10"
                  >
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
                      className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] animate-in slide-in-from-bottom-4 group ${
                        selectedProject?.id === project.id ? 'ring-2 ring-primary shadow-xl bg-primary/5' : 'hover:shadow-lg'
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                            <FolderOpen className="h-5 w-5 text-green-500" />
                          </div>
                          <Badge className={`${getStatusColor(project.status)} text-white transition-transform group-hover:scale-105`}>
                            {project.status}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">{project.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium text-primary">{project.progress_percent}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${project.progress_percent}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Map className="h-3 w-3" />
                              <span>{project.roadmapItems.length} roadmap items</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{project.roadmapItems.reduce((acc, item) => acc + item.sprints.length, 0)} sprints</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12 animate-in fade-in duration-500">
                  <CardContent>
                    <div className="animate-bounce">
                      <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Nenhum Projeto Encontrado
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Este cliente ainda não possui projetos associados.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => openProjectModal()}
                      className="hover:bg-primary/10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Projeto
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Detalhes do Projeto Selecionado */}
              {selectedProject && (
                <Card className="mt-8 animate-in slide-in-from-bottom-4 duration-500">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <FolderOpen className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-foreground">{selectedProject.name}</CardTitle>
                          <pre className="text-muted-foreground whitespace-pre-line break-words" style={{fontFamily: 'inherit', margin: 0}}>{selectedProject.description}</pre>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getStatusColor(selectedProject.status)} text-white`}>
                          {selectedProject.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-primary/10"
                          onClick={() => openProjectModal(selectedProject)}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Editar Projeto
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    {/* Roadmap Items */}
                    <div className="space-y-4">
                      {selectedProject.roadmapItems.map((roadmapItem, roadmapIndex) => (
                        <Card key={roadmapItem.id} className="bg-muted/20 animate-in slide-in-from-left-4" style={{ animationDelay: `${roadmapIndex * 150}ms` }}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => toggleRoadmapExpansion(roadmapItem.id)}
                                className="flex items-center space-x-2 hover:bg-muted/50 p-2 rounded transition-colors flex-1 text-left"
                              >
                                {expandedRoadmaps.has(roadmapItem.id) ? (
                                  <ChevronDown className="h-4 w-4 transition-transform" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 transition-transform" />
                                )}
                                <div className="p-1 bg-purple-500/20 rounded">
                                  <Map className="h-4 w-4 text-purple-500" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-foreground">{roadmapItem.title}</div>
                                  <div className="text-sm text-muted-foreground">{roadmapItem.description}</div>
                                </div>
                              </button>
                              <div className="flex items-center space-x-2">
                                <Badge className={`${getStatusColor(roadmapItem.status)} text-white transition-transform hover:scale-105`}>
                                  {roadmapItem.status}
                                </Badge>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openRoadmapModal(roadmapItem);
                                  }}
                                  className="h-6 w-6 p-0 hover:bg-primary/20"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={(e) => e.stopPropagation()}
                                      className="h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-500"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Deletar Item do Roadmap</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza de que deseja deletar o item "{roadmapItem.title}"? Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteRoadmap(roadmapItem.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Deletar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CardHeader>

                          {expandedRoadmaps.has(roadmapItem.id) && (
                            <CardContent className="space-y-4 animate-in fade-in duration-300">
                              {/* Sprints */}
                              {roadmapItem.sprints.length > 0 && (
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2">
                                    <div className="p-1 bg-orange-500/20 rounded">
                                      <Calendar className="h-4 w-4 text-orange-500" />
                                    </div>
                                    <span className="font-medium">Sprints ({roadmapItem.sprints.length})</span>
                                  </div>
                                  
                                  {roadmapItem.sprints.map((sprint, sprintIndex) => {
                                    // Função auxiliar para obter o nome personalizado da sprint
                                    const getSprintDisplayName = (sprint: any) => {
                                      // Se temos um nome personalizado salvo, use-o
                                      if (sprint.custom_name) return sprint.custom_name;
                                      // Caso contrário, use o padrão
                                      return `Sprint ${sprint.sprint_number}`;
                                    };

                                    const StatusIcon = getStatusIcon(sprint.status);
                                    return (
                                      <Card
                                        key={sprint.id}
                                        className="bg-background/50 hover:bg-background/70 transition-colors animate-in slide-in-from-bottom-2"
                                        style={{ animationDelay: `${sprintIndex * 100}ms` }}
                                      >
                                        <CardContent className="p-4">
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-2">
                                              <div className="p-1 bg-orange-500/20 rounded">
                                                <StatusIcon className="h-4 w-4 text-orange-500" />
                                              </div>
                                              <span className="font-medium">{getSprintDisplayName(sprint)}</span>
                                              {sprint.evidences && sprint.evidences.length > 0 && (
                                                <div className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                                  <Image className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{sprint.evidences.length}</span>
                                                </div>
                                              )}
                                              <Badge className={`${getStatusColor(sprint.status)} text-white text-xs`}>
                                                {sprint.status}
                                              </Badge>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                                {sprint.start_date} - {sprint.end_date}
                                              </div>
                                              <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => openSprintViewModal(sprint)}
                                                className="h-5 w-5 p-0 hover:bg-orange-500/20 hover:text-orange-500"
                                                title="Visualizar Sprint"
                                              >
                                                <Calendar className="h-2.5 w-2.5" />
                                              </Button>
                                              <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => openSprintModal(sprint)}
                                                className="h-5 w-5 p-0 hover:bg-blue-500/20 hover:text-blue-500"
                                                title="Editar Sprint"
                                              >
                                                <Edit2 className="h-2.5 w-2.5" />
                                              </Button>
                                              <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                  <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-5 w-5 p-0 hover:bg-red-500/20 hover:text-red-500"
                                                  >
                                                    <Trash2 className="h-2.5 w-2.5" />
                                                  </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                  <AlertDialogHeader>
                                                    <AlertDialogTitle>Deletar Sprint</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                      Tem certeza de que deseja deletar o Sprint #{sprint.sprint_number}? Esta ação não pode ser desfeita.
                                                    </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction 
                                                      onClick={() => handleDeleteSprint(sprint.id)}
                                                      className="bg-red-600 hover:bg-red-700"
                                                    >
                                                      Deletar
                                                    </AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </AlertDialogContent>
                                              </AlertDialog>
                                            </div>
                                          </div>
                                          
                                          {/* Resumo das Evidências da Sprint */}
                                          {sprint.evidences.length > 0 && (
                                            <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                  <Image className="h-4 w-4 text-orange-500" />
                                                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                                    {sprint.evidences.length} evidência{sprint.evidences.length !== 1 ? 's' : ''} anexada{sprint.evidences.length !== 1 ? 's' : ''}
                                                  </span>
                                                </div>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => openSprintViewModal(sprint)}
                                                  className="text-xs h-6 px-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 dark:text-orange-300"
                                                >
                                                  Ver detalhes
                                                </Button>
                                              </div>
                                            </div>
                                          )}

                                          {/* Sprint Tasks removido para compatibilidade com banco atual */}
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Relatórios */}
                              {roadmapItem.reports.length > 0 && (
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2">
                                    <div className="p-1 bg-blue-500/20 rounded">
                                      <FileText className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <span className="font-medium">Relatórios ({roadmapItem.reports.length})</span>
                                  </div>
                                  
                                  {roadmapItem.reports.map((report, reportIndex) => (
                                    <Card 
                                      key={report.id} 
                                      className="bg-background/50 hover:bg-background/70 transition-colors animate-in slide-in-from-bottom-2"
                                      style={{ animationDelay: `${reportIndex * 100}ms` }}
                                    >
                                      <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center space-x-2">
                                            <div className="p-1 bg-blue-500/20 rounded">
                                              <FileText className="h-4 w-4 text-blue-500" />
                                            </div>
                                            <span className="font-medium">{report.title}</span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                              {new Date(report.created_at).toLocaleDateString('pt-BR')}
                                            </div>
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              onClick={() => openReportViewModal(report)}
                                              className="h-5 w-5 p-0 hover:bg-blue-500/20 hover:text-blue-500"
                                            >
                                              <FileText className="h-2.5 w-2.5" />
                                            </Button>
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              onClick={() => openReportModal(report)}
                                              className="h-5 w-5 p-0 hover:bg-green-500/20 hover:text-green-500"
                                            >
                                              <Edit2 className="h-2.5 w-2.5" />
                                            </Button>
                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button 
                                                  variant="ghost" 
                                                  size="sm" 
                                                  className="h-5 w-5 p-0 hover:bg-red-500/20 hover:text-red-500"
                                                >
                                                  <Trash2 className="h-2.5 w-2.5" />
                                                </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle>Deletar Relatório</AlertDialogTitle>
                                                  <AlertDialogDescription>
                                                    Tem certeza de que deseja deletar o relatório "{report.title}"? Esta ação não pode ser desfeita.
                                                  </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                  <AlertDialogAction 
                                                    onClick={() => handleDeleteReport(report.id)}
                                                    className="bg-red-600 hover:bg-red-700"
                                                  >
                                                    Deletar
                                                  </AlertDialogAction>
                                                </AlertDialogFooter>
                                              </AlertDialogContent>
                                            </AlertDialog>
                                          </div>
                                        </div>
                                        
                                        {/* Evidências do Relatório */}
                                        {report.evidences.length > 0 && (
                                          <div className="mt-3">
                                            <div className="flex items-center space-x-2 mb-2">
                                              <div className="p-1 bg-red-500/20 rounded">
                                                <Image className="h-3 w-3 text-red-500" />
                                              </div>
                                              <span className="text-sm font-medium">Evidências ({report.evidences.length})</span>
                                            </div>
                                            <div className="grid grid-cols-4 gap-2">
                                              {report.evidences.slice(0, 4).map((evidence, evidenceIndex) => (
                                                <div 
                                                  key={evidence.id} 
                                                  className="aspect-square bg-muted/30 rounded flex items-center justify-center hover:bg-muted/50 transition-colors cursor-pointer animate-in zoom-in"
                                                  style={{ animationDelay: `${evidenceIndex * 50}ms` }}
                                                >
                                                  {evidence.thumbnail_url ? (
                                                    <img 
                                                      src={evidence.thumbnail_url} 
                                                      alt="Evidence" 
                                                      className="w-full h-full object-cover rounded hover:scale-105 transition-transform"
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
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full animate-in fade-in duration-500">
              <div className="text-center">
                <div className="animate-bounce mb-4">
                  <Users className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                </div>
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

      {/* MODALS */}
      
      {/* Client Modal */}
      <Dialog open={clientModalOpen} onOpenChange={setClientModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
            <DialogDescription>
              {editingClient ? 'Edite as informações do cliente.' : 'Adicione um novo cliente ao sistema.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="client-name" className="text-right">
                Nome
              </Label>
              <Input
                id="client-name"
                value={clientFormData.name}
                onChange={(e) => setClientFormData({...clientFormData, name: e.target.value})}
                className="col-span-3"
                placeholder="Nome do cliente"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="client-email" className="text-right">
                Email
              </Label>
              <Input
                id="client-email"
                value={clientFormData.email}
                onChange={(e) => setClientFormData({...clientFormData, email: e.target.value})}
                className="col-span-3"
                placeholder="email@exemplo.com"
                type="email"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="client-company" className="text-right">
                Empresa
              </Label>
              <Input
                id="client-company"
                value={clientFormData.company}
                onChange={(e) => setClientFormData({...clientFormData, company: e.target.value})}
                className="col-span-3"
                placeholder="Nome da empresa"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClientModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveClient}>
              {editingClient ? 'Salvar Alterações' : 'Criar Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Modal */}
      <Dialog open={projectModalOpen} onOpenChange={setProjectModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
            </DialogTitle>
            <DialogDescription>
              {editingProject ? 'Edite as informações do projeto.' : 'Adicione um novo projeto ao cliente.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project-name" className="text-right">
                Nome
              </Label>
              <Input
                id="project-name"
                value={projectFormData.name}
                onChange={(e) => setProjectFormData({...projectFormData, name: e.target.value})}
                className="col-span-3"
                placeholder="Nome do projeto"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project-slug" className="text-right">
                Slug
              </Label>
              <Input
                id="project-slug"
                value={projectFormData.slug}
                onChange={(e) => setProjectFormData({...projectFormData, slug: e.target.value})}
                className="col-span-3"
                placeholder="slug-do-projeto"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project-description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="project-description"
                value={projectFormData.description}
                onChange={(e) => setProjectFormData({...projectFormData, description: e.target.value})}
                className="col-span-3"
                placeholder="Descrição do projeto"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project-status" className="text-right">
                Status
              </Label>
              <Select 
                value={projectFormData.status} 
                onValueChange={(value: 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'DONE') => setProjectFormData({...projectFormData, status: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNED">Planejado</SelectItem>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="ON_HOLD">Pausado</SelectItem>
                  <SelectItem value="DONE">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProject}>
              {editingProject ? 'Salvar Alterações' : 'Criar Projeto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sprint Modal */}
      <SprintModal
        isOpen={sprintModalOpen}
        onClose={() => setSprintModalOpen(false)}
        onSave={handleSprintSave}
        editingSprint={editingSprint}
        roadmapItems={(selectedProject?.roadmapItems || []).map(item => ({
          ...item,
          project_id: item.project_id ?? selectedProject?.id ?? '',
        }))}
  availableEvidences={availableEvidences}
  selectedEvidences={selectedEvidences}
  onEvidenceSelectionChange={setSelectedEvidences}
        loading={sprintCRUD.loading}
      />

      {/* Roadmap Modal */}
      <RoadmapModal
        isOpen={roadmapModalOpen}
        onClose={() => setRoadmapModalOpen(false)}
        onSave={handleRoadmapSave}
        editingItem={editingRoadmap}
        loading={false}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSave={handleReportSave}
        editingReport={editingReport}
        loading={reportCRUD.loading}
      />

  {/* Report View Modal */}
      <Dialog open={reportViewModalOpen} onOpenChange={setReportViewModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-600">
              📊 {viewingReport?.title}
            </DialogTitle>
            <DialogDescription>
              Relatório criado em {viewingReport?.created_at ? new Date(viewingReport.created_at).toLocaleDateString('pt-BR') : 'Data não disponível'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            <div className="prose prose-sm max-w-none">
              {viewingReport?.content_md ? (
                <div className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
                  <div 
                    className="markdown-content"
                    style={{ 
                      lineHeight: '1.6',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                  >
                    {/* Renderização simples de markdown */}
                    {viewingReport.content_md
                      .split('\n')
                      .map((line: string, index: number) => {
                        // Títulos
                        if (line.startsWith('### ')) {
                          return <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">{line.replace('### ', '')}</h3>;
                        }
                        if (line.startsWith('## ')) {
                          return <h2 key={index} className="text-xl font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100">{line.replace('## ', '')}</h2>;
                        }
                        if (line.startsWith('# ')) {
                          return <h1 key={index} className="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-gray-100">{line.replace('# ', '')}</h1>;
                        }
                        
                        // Lista com marcadores
                        if (line.startsWith('- ') || line.startsWith('* ')) {
                          return <li key={index} className="ml-4 mb-1 text-gray-700 dark:text-gray-300">{line.replace(/^[*-] /, '• ')}</li>;
                        }
                        
                        // Texto em negrito **texto**
                        if (line.includes('**')) {
                          const parts = line.split('**');
                          return (
                            <p key={index} className="mb-2 text-gray-700 dark:text-gray-300">
                              {parts.map((part, i) => 
                                i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
                              )}
                            </p>
                          );
                        }
                        
                        // Linha vazia
                        if (line.trim() === '') {
                          return <br key={index} />;
                        }
                        
                        // Parágrafo normal
                        return <p key={index} className="mb-2 text-gray-700 dark:text-gray-300">{line}</p>;
                      })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <FileText className="h-16 w-16 mx-auto opacity-50" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Conteúdo não disponível
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Este relatório não possui conteúdo ou ainda não foi preenchido.
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReportViewModalOpen(false)}>
              Fechar
            </Button>
            <Button 
              onClick={() => {
                setReportViewModalOpen(false);
                openReportModal(viewingReport);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Editar Relatório
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sprint View Modal */}
      <Dialog open={sprintViewModalOpen} onOpenChange={setSprintViewModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-lg">
                  <Activity className="h-8 w-8 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    🏃‍♂️ Sprint #{viewingSprint?.sprint_number}
                  </DialogTitle>
                  <DialogDescription className="text-base text-gray-600 dark:text-gray-400 mt-1">
                    📅 {viewingSprint?.week_start_date ? new Date(viewingSprint.week_start_date).toLocaleDateString('pt-BR') : ''} - {viewingSprint?.week_end_date ? new Date(viewingSprint.week_end_date).toLocaleDateString('pt-BR') : ''}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {viewingSprint?.description && (
                  <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                    <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">Com descrição</span>
                  </div>
                )}
                <Badge className={`${getStatusColor(viewingSprint?.status)} text-white px-4 py-2 text-sm font-medium shadow-md`}>
                  {viewingSprint?.status === 'PLANNED' && '📋 Planejado'}
                  {viewingSprint?.status === 'IN_PROGRESS' && '🚀 Em Progresso'}
                  {viewingSprint?.status === 'DONE' && '✅ Concluído'}
                </Badge>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* Descrição do Sprint */}
            {viewingSprint?.description && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-green-900 dark:text-green-100">📝 Descrição da Sprint</h3>
                    <p className="text-sm text-green-700 dark:text-green-300">Objetivos e detalhes do trabalho</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-100 dark:border-green-700">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                      {viewingSprint.description}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status do Sprint - Removido pois está no header */}

            {/* Evidências do Sprint */}
            {viewingSprint?.evidences && viewingSprint.evidences.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Image className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Evidências ({viewingSprint.evidences.length})
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {viewingSprint.evidences.map((evidence: any, index: number) => (
                    <div 
                      key={evidence.id}
                      className="group relative bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden border hover:shadow-lg transition-all duration-300"
                    >
                      <div className="aspect-video flex items-center justify-center p-4">
                        {evidence.thumbnail_url || evidence.url ? (
                          <img 
                            src={evidence.thumbnail_url || evidence.url} 
                            alt={`Evidência ${index + 1}`}
                            className="w-full h-full object-cover rounded hover:scale-105 transition-transform"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`flex flex-col items-center justify-center text-gray-400 ${evidence.thumbnail_url || evidence.url ? 'hidden' : ''}`}>
                          {evidence.type === 'IMAGE' ? <Image className="h-8 w-8 mb-2" /> : <FileText className="h-8 w-8 mb-2" />}
                          <span className="text-xs text-center">
                            {evidence.type === 'IMAGE' ? 'Imagem' : 'Arquivo'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-white dark:bg-gray-900 border-t">
                        <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                          {evidence.storage_key || `Evidência ${index + 1}`}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {evidence.type}
                          </span>
                          {(evidence.url || evidence.thumbnail_url) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(evidence.url || evidence.thumbnail_url, '_blank')}
                              className="h-6 w-6 p-0 hover:bg-blue-500/20"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Image className="h-16 w-16 mx-auto opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Nenhuma evidência encontrada
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Este sprint ainda não possui evidências anexadas.
                </p>
              </div>
            )}

            {/* Informações Adicionais */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-blue-900 dark:text-blue-100">📊 Estatísticas da Sprint</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Visão geral do progresso</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-100 dark:border-blue-700 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {viewingSprint?.week_start_date && viewingSprint?.week_end_date ?
                      Math.ceil((new Date(viewingSprint.week_end_date).getTime() - new Date(viewingSprint.week_start_date).getTime()) / (1000 * 3600 * 24)) : 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Dias de Duração</div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-100 dark:border-blue-700 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {viewingSprint?.evidences?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Evidências</div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-100 dark:border-blue-700 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                    {viewingSprint?.status === 'DONE' ? '100%' :
                     viewingSprint?.status === 'IN_PROGRESS' ? '50%' : '0%'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Progresso</div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-700">
                <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Status Atual</h5>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {viewingSprint?.status === 'PLANNED' && 'Sprint planejada e aguardando início das atividades'}
                  {viewingSprint?.status === 'IN_PROGRESS' && 'Desenvolvimento ativo em andamento - foco total na entrega!'}
                  {viewingSprint?.status === 'DONE' && 'Sprint concluída com sucesso - objetivos alcançados!'}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSprintViewModalOpen(false)}>
              Fechar
            </Button>
            <Button 
              onClick={() => {
                setSprintViewModalOpen(false);
                openSprintModal(viewingSprint);
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Editar Sprint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Upload de Evidências */}
      <Dialog open={evidenceModalOpen} onOpenChange={setEvidenceModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Image className="h-5 w-5 text-blue-500" />
              <span>Adicionar Evidências</span>
            </DialogTitle>
            <DialogDescription>
              Envie arquivos de imagem ou vídeo para o projeto atual.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedProject && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-2">
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Projeto: {selectedProject.name}
                  </span>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="evidenceFiles">Selecionar Arquivos</Label>
              <Input
                id="evidenceFiles"
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground">
                Formatos aceitos: JPG, PNG, GIF, MP4, MOV, AVI
              </p>
            </div>
            
            {selectedFiles && selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Arquivos Selecionados:</Label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {Array.from(selectedFiles).map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm p-2 bg-muted rounded">
                      {file.type.startsWith('image/') ? (
                        <Image className="h-4 w-4 text-green-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-500" />
                      )}
                      <input
                        className="flex-1 bg-transparent border-b border-dashed border-gray-400 focus:outline-none"
                        value={evidenceNames[index] || file.name.replace(/\.[^/.]+$/, "")}
                        onChange={e => setEvidenceNames({ ...evidenceNames, [index]: e.target.value })}
                        placeholder="Nome da evidência"
                      />
                      <span className="text-muted-foreground text-xs">
                        {(file.size / 1024 / 1024).toFixed(1)}MB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEvidenceModalOpen(false)} disabled={uploadingFiles}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUploadEvidences}
              disabled={!selectedFiles || selectedFiles.length === 0 || uploadingFiles}
              className="bg-green-600 hover:bg-green-700"
            >
              {uploadingFiles ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Image className="h-4 w-4 mr-2" />
                  Enviar Evidências
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientCenteredView;
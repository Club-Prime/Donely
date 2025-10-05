import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowLeft, Edit, Trash2, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { ComentariosView } from '@/components/client/ComentariosView';

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  client_display_name: string;
  status: string;
  progress_percent: number;
  start_date: string;
  end_date_target: string;
  created_at: string;
  client_id?: string;
}

interface Client {
  id: string;
  name: string;
}

export const ProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    client_display_name: '',
    start_date: '',
    end_date_target: ''
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    fetchProjectsAndClients();
  }, []);

  const fetchProjectsAndClients = async () => {
    try {
      // Buscar projetos e clientes relacionados
      const [{ data: projectsData, error: projectsError }, { data: clientsData, error: clientsError }] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, name').eq('role', 'CLIENT')
      ]);
      if (projectsError) throw projectsError;
      if (clientsError) throw clientsError;
      setProjects(projectsData || []);
      setClients(clientsData || []);
    } catch (error) {
      console.error('Erro ao buscar projetos/clientes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os projetos/clientes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update(formData)
          .eq('id', editingProject.id);
          
        if (error) throw error;
        toast({ title: "Projeto atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([formData]);
          
        if (error) throw error;
        toast({ title: "Projeto criado com sucesso!" });
      }
      
      setShowForm(false);
      setEditingProject(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        client_display_name: '',
        start_date: '',
        end_date_target: ''
      });
      fetchProjectsAndClients();
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o projeto",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      slug: project.slug,
      description: project.description || '',
      client_display_name: project.client_display_name || '',
      start_date: project.start_date || '',
      end_date_target: project.end_date_target || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      toast({ title: "Projeto excluído com sucesso!" });
      fetchProjectsAndClients();
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o projeto",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'bg-blue-500/10 text-blue-500';
      case 'ACTIVE': return 'bg-green-500/10 text-green-500';
      case 'ON_HOLD': return 'bg-yellow-500/10 text-yellow-500';
      case 'COMPLETED': return 'bg-purple-500/10 text-purple-500';
      case 'CANCELLED': return 'bg-red-500/10 text-red-500';
      default: return 'bg-gray-500/10 text-gray-500';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 py-10">
      <div className="max-w-[1800px] mx-auto px-2 mb-4">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-300 hover:text-primary transition mb-2"
        >
          <ArrowLeft className="w-5 h-5" /> Voltar para o Dashboard
        </button>
      </div>
      <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row gap-8">
        {/* Sidebar hierárquica: Clientes > Projetos */}
        <aside className="hidden md:flex flex-col gap-4 w-56 p-4 bg-gray-800 rounded-xl border border-gray-700 shadow-lg min-h-[600px] text-sm overflow-y-auto">
          <div className="mb-2">
            <span className="text-xs text-gray-400 font-medium">Clientes e Projetos</span>
          </div>
          {clients.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-sm text-gray-400">Nenhum cliente encontrado</div>
            </div>
          ) : (
            clients.map(client => {
              const clientProjects = projects.filter(p => p.client_display_name === client.name);
              return (
                <div key={client.id} className="space-y-2">
                  {/* Cliente Header */}
                  <div className="flex items-center gap-2 text-blue-300 font-medium">
                    <User className="w-4 h-4" />
                    <span className="truncate">{client.name}</span>
                  </div>

                  {/* Projetos do Cliente */}
                  {clientProjects.length > 0 ? (
                    <ul className="pl-4 border-l-2 border-blue-700 ml-2 mt-1 space-y-1">
                      {clientProjects.map(p => (
                        <li key={p.id}>
                          <button
                            className={`hover:underline text-left text-purple-200 transition-colors w-full text-left ${selectedProjectId === p.id ? 'font-bold underline text-purple-100' : ''}`}
                            onClick={() => setSelectedProjectId(p.id)}
                          >
                            <span className="truncate block">{p.name}</span>
                            <span className="text-xs text-gray-400 block">
                              {p.progress_percent || 0}% • {p.status}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="pl-6 text-xs text-gray-500 italic">
                      Nenhum projeto
                    </div>
                  )}
                </div>
              );
            })
          )}
        </aside>
        {/* Conteúdo principal: Formulário e cards */}
        <main className="flex-1 flex flex-col md:flex-row gap-8">
          <section className="flex-[1.5]">
            <header className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Projetos</h1>
              <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" /> Novo Projeto
              </Button>
            </header>
            {showForm && (
              <Card className="mb-8 bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">Nome do Projeto</label>
                        <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Slug</label>
                        <Input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} required />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Nome do Cliente</label>
                      <Input value={formData.client_display_name} onChange={e => setFormData({ ...formData, client_display_name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Descrição</label>
                      <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">Data de Início</label>
                        <Input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Data Alvo</label>
                        <Input type="date" value={formData.end_date_target} onChange={e => setFormData({ ...formData, end_date_target: e.target.value })} />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit">{editingProject ? 'Atualizar' : 'Criar'}</Button>
                      <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingProject(null); setFormData({ name: '', slug: '', description: '', client_display_name: '', start_date: '', end_date_target: '' }); }}>Cancelar</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
            <div className="grid gap-6 grid-cols-1">
              {projects.map(project => (
                <Card
                  key={project.id}
                  className={`bg-card/80 backdrop-blur-sm border-border/50 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                    selectedProjectId === project.id
                      ? 'ring-2 ring-primary bg-primary/5 border-primary/50'
                      : 'hover:bg-card/90'
                  }`}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <CardDescription>
                          <span className="flex items-center gap-2 text-blue-300">
                            <User className="w-4 h-4" />
                            {project.client_display_name || 'Cliente não definido'}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                        {selectedProjectId === project.id && (
                          <Badge className="bg-primary text-primary-foreground">Selecionado</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {project.description || 'Sem descrição'}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {project.start_date
                            ? new Date(project.start_date).toLocaleDateString()
                            : 'Data não definida'
                          }
                        </span>
                        {project.end_date_target && (
                          <>
                            <span>→</span>
                            <span>{new Date(project.end_date_target).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Progresso: </span>
                          <span className="font-medium text-primary">{project.progress_percent || 0}%</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation(); // Evitar que clique no botão selecione o projeto
                              handleEdit(project);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation(); // Evitar que clique no botão selecione o projeto
                              handleDelete(project.id);
                            }}
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {projects.length === 0 && (
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="text-lg font-medium">Nenhum projeto encontrado</div>
                    <p className="text-muted-foreground text-sm">Clique em "Novo Projeto" para começar.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </section>
          {/* Gerenciamento de Comentários do Projeto */}
          <section className="flex-[2.2] bg-gray-950 rounded-xl border border-gray-800 shadow-lg p-6 min-w-[700px]">
            <div className="h-full">
              {selectedProjectId ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-300">Comentários do Projeto</h2>
                    <div className="text-sm text-gray-400">
                      {projects.find(p => p.id === selectedProjectId)?.name}
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <ComentariosView projectId={selectedProjectId} isAdminView={true} />
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="text-gray-400">
                    <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Selecione um Projeto</h3>
                    <p className="text-sm text-gray-500">
                      Clique em um projeto na lista ou na barra lateral para ver os comentários e interagir com o cliente.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
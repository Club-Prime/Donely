import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowLeft, Edit, Trash2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

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
}

export const ProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
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

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
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
      fetchProjects();
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
      fetchProjects();
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
    <div className="min-h-screen bg-gradient-primary">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-xl font-bold">Gerenciar Projetos</h1>
          </div>
          
          <Button
            onClick={() => setShowForm(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Projeto  
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {showForm && (
          <Card className="mb-8 bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>
                {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Nome do Projeto</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Slug</label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Nome do Cliente</label>
                  <Input
                    value={formData.client_display_name}
                    onChange={(e) => setFormData({...formData, client_display_name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Data de Início</label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Data Alvo</label>
                    <Input
                      type="date"
                      value={formData.end_date_target}
                      onChange={(e) => setFormData({...formData, end_date_target: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button type="submit">
                    {editingProject ? 'Atualizar' : 'Criar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
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
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription>{project.client_display_name}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {project.description}
                  </p>
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Não definido'}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(project)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(project.id)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
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
                <p className="text-muted-foreground text-sm">
                  Clique em "Novo Projeto" para começar.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};
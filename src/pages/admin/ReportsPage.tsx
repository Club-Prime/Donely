import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, FileText, Edit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface Report {
  id: string;
  title: string;
  content_md: string;
  project_id: string;
  sprint_id: string;
  is_published: boolean;
  version: number;
  created_at: string;
  projects: {
    name: string;
  };
  sprints: {
    sprint_number: number;
  };
}

interface Project {
  id: string;
  name: string;
}

interface Sprint {
  id: string;
  sprint_number: number;
  project_id: string;
}

export const ReportsPage = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content_md: '',
    project_id: '',
    sprint_id: ''
  });

  useEffect(() => {
    Promise.all([fetchReports(), fetchProjects(), fetchSprints()]);
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          projects(name),
          sprints(sprint_number)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os relatórios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
    }
  };

  const fetchSprints = async () => {
    try {
      const { data, error } = await supabase
        .from('sprints')
        .select('id, sprint_number, project_id')
        .order('sprint_number');

      if (error) throw error;
      setSprints(data || []);
    } catch (error) {
      console.error('Erro ao buscar sprints:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingReport) {
        const updateData = {
          ...formData,
          sprint_id: formData.sprint_id || null // Convert empty string to null
        };
        
        const { error } = await supabase
          .from('reports')
          .update(updateData)
          .eq('id', editingReport.id);
          
        if (error) throw error;
        toast({ title: "Relatório atualizado com sucesso!" });
      } else {
        const reportData = {
          ...formData,
          sprint_id: formData.sprint_id || null, // Convert empty string to null
          created_by: (await supabase.auth.getUser()).data.user?.id
        };
        
        const { error } = await supabase
          .from('reports')
          .insert([reportData]);
          
        if (error) throw error;
        toast({ title: "Relatório criado com sucesso!" });
      }
      
      setShowForm(false);
      setEditingReport(null);
      setFormData({
        title: '',
        content_md: '',
        project_id: '',
        sprint_id: ''
      });
      fetchReports();
    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o relatório",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (report: Report) => {
    setEditingReport(report);
    setFormData({
      title: report.title,
      content_md: report.content_md || '',
      project_id: report.project_id,
      sprint_id: report.sprint_id
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este relatório?')) return;
    
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      toast({ title: "Relatório excluído com sucesso!" });
      fetchReports();
    } catch (error) {
      console.error('Erro ao excluir relatório:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o relatório",
        variant: "destructive"
      });
    }
  };

  const togglePublish = async (report: Report) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ 
          is_published: !report.is_published,
          published_at: !report.is_published ? new Date().toISOString() : null
        })
        .eq('id', report.id);
        
      if (error) throw error;
      toast({ 
        title: `Relatório ${!report.is_published ? 'publicado' : 'despublicado'} com sucesso!` 
      });
      fetchReports();
    } catch (error) {
      console.error('Erro ao alterar status de publicação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status de publicação",
        variant: "destructive"
      });
    }
  };

  const filteredSprints = sprints.filter(sprint => 
    !formData.project_id || sprint.project_id === formData.project_id
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold">Carregando relatórios...</div>
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
            <h1 className="text-xl font-bold">Gerenciar Relatórios</h1>
          </div>
          
          <Button
            onClick={() => setShowForm(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Relatório
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {showForm && (
          <Card className="mb-8 bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>
                {editingReport ? 'Editar Relatório' : 'Novo Relatório'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Título do Relatório</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Projeto</label>
                    <Select
                      value={formData.project_id}
                      onValueChange={(value) => setFormData({...formData, project_id: value, sprint_id: ''})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um projeto" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Sprint</label>
                    <Select
                      value={formData.sprint_id}
                      onValueChange={(value) => setFormData({...formData, sprint_id: value})}
                      disabled={!formData.project_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma sprint" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSprints.map((sprint) => (
                          <SelectItem key={sprint.id} value={sprint.id}>
                            Sprint {sprint.sprint_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Conteúdo (Markdown)</label>
                  <Textarea
                    value={formData.content_md}
                    onChange={(e) => setFormData({...formData, content_md: e.target.value})}
                    rows={10}
                    placeholder="Escreva o conteúdo do relatório em Markdown..."
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button type="submit">
                    {editingReport ? 'Atualizar' : 'Criar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingReport(null);
                      setFormData({
                        title: '',
                        content_md: '',
                        project_id: '',
                        sprint_id: ''
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

        <div className="grid gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>{report.projects?.name}</span>
                      <span>•</span>
                      <span>Sprint {report.sprints?.sprint_number}</span>
                      <span>•</span>
                      <span>v{report.version}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={report.is_published ? "default" : "secondary"}>
                      {report.is_published ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {report.content_md ? report.content_md.substring(0, 200) + '...' : 'Sem conteúdo'}
                  </p>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => togglePublish(report)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {report.is_published ? 'Despublicar' : 'Publicar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(report)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(report.id)}
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

        {reports.length === 0 && (
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <FileText className="w-16 h-16 text-muted-foreground" />
                <div className="text-lg font-medium">Nenhum relatório encontrado</div>
                <p className="text-muted-foreground text-sm">
                  Clique em "Novo Relatório" para começar.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};
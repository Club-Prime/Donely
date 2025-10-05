import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Edit2, Save, X, Image, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminEvidenciasView } from '@/components/admin/AdminEvidenciasView';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Evidence = Database['public']['Tables']['evidences']['Row'] & {
  reports?: {
    id: string;
    title: string;
    sprint_id: string;
    sprints?: {
      sprint_number: number;
    };
  };
};

interface Project {
  id: string;
  name: string;
  client_display_name: string;
}

export const EvidencesPage = () => {
  const navigate = useNavigate();
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  useEffect(() => {
    fetchProjects();
    fetchEvidences();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, client_display_name')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os projetos",
        variant: "destructive"
      });
    }
  };

  const fetchEvidences = async () => {
    try {
      console.log('🔄 EvidencesPage: Buscando todas as evidências...');
      const { data, error } = await supabase
        .from('evidences')
        .select(`
          *,
          reports(id, title, sprint_id, sprints(sprint_number))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('📊 Evidências encontradas:', data?.length || 0);

      // Gerar URLs públicas para as evidências (bucket é público)
      const evidencesWithUrls = (data || []).map((evidence) => {
        try {
          console.log('🔗 Gerando URL pública para:', evidence.storage_key);
          const { data: publicUrlData } = supabase.storage
            .from('evidences')
            .getPublicUrl(evidence.storage_key);

          const { data: thumbnailPublicUrlData } = evidence.thumbnail_url
            ? supabase.storage
                .from('evidences')
                .getPublicUrl(evidence.thumbnail_url)
            : { data: null };

          const updatedEvidence = {
            ...evidence,
            url: publicUrlData?.publicUrl || evidence.url,
            thumbnail_url: thumbnailPublicUrlData?.publicUrl || evidence.thumbnail_url
          };

          console.log('✅ URL pública gerada para evidência:', evidence.id, updatedEvidence.url ? 'SUCESSO' : 'FALHA');
          return updatedEvidence;
        } catch (urlError) {
          console.error('❌ Erro ao gerar URL pública para evidência:', evidence.id, urlError);
          return evidence; // Retorna a evidência original se falhar
        }
      });

      console.log('🎯 Evidências com URLs processadas:', evidencesWithUrls.length);
      setEvidences(evidencesWithUrls);
    } catch (error) {
      console.error('❌ Erro ao buscar evidências:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as evidências",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditName = (evidenceId: string, currentName: string) => {
    setEditingName(evidenceId);
    setEditNameValue(currentName || '');
  };

  const handleSaveName = async (evidenceId: string) => {
    try {
      const { error } = await supabase
        .from('evidences')
        .update({ name: editNameValue })
        .eq('id', evidenceId);

      if (error) throw error;

      // Atualizar localmente
      setEvidences(prev => prev.map(ev => 
        ev.id === evidenceId ? { ...ev, name: editNameValue } : ev
      ));

      setEditingName(null);
      setEditNameValue('');
      toast({ title: 'Nome atualizado', description: 'Nome da evidência atualizado com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar nome:', error);
      toast({ title: 'Erro', description: 'Erro ao atualizar nome da evidência', variant: 'destructive' });
    }
  };

  const handleCancelEdit = () => {
    setEditingName(null);
    setEditNameValue('');
  };

  const AllEvidencesView = () => (
    <div className="space-y-4">
      {evidences.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhuma evidência encontrada.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {evidences.map((evidence) => (
            <Card key={evidence.id} className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {evidence.type === 'IMAGE' ? (
                      <Image className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Video className="w-4 h-4 text-purple-500" />
                    )}
                    <Badge variant="outline" className="text-xs">
                      {evidence.type === 'IMAGE' ? 'Imagem' : 'Vídeo'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Preview */}
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  {evidence.type === 'IMAGE' ? (
                    <img 
                      src={evidence.url} 
                      alt={evidence.name || 'Evidência'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Erro ao carregar imagem:', evidence.url);
                        e.currentTarget.src = '/placeholder.svg'; // Fallback para placeholder
                      }}
                      onLoad={() => console.log('Imagem carregada com sucesso:', evidence.url)}
                    />
                  ) : (
                    <video 
                      className="w-full h-full object-cover"
                      controls
                      poster={evidence.thumbnail_url}
                      onError={(e) => console.error('Erro ao carregar vídeo:', evidence.url)}
                    >
                      <source src={evidence.url} type={evidence.mime_type || 'video/mp4'} />
                    </video>
                  )}
                </div>

                {/* Nome com edição */}
                <div className="space-y-2">
                  {editingName === evidence.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        placeholder="Nome da evidência"
                        className="flex-1"
                      />
                      <Button size="sm" onClick={() => handleSaveName(evidence.id)}>
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {evidence.name || 'Sem nome'}
                      </span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleEditName(evidence.id, evidence.name || '')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Informações */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Report: {evidence.reports?.title || 'N/A'}</div>
                  <div>Sprint: {evidence.reports?.sprints?.sprint_number || 'N/A'}</div>
                  <div>Data: {new Date(evidence.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold">Carregando evidências...</div>
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
        {/* Sidebar de projetos */}
        <aside className="hidden md:flex flex-col gap-4 w-56 p-4 bg-gray-800 rounded-xl border border-gray-700 shadow-lg min-h-[600px] text-sm">
          <div className="mb-2">
            <span className="text-xs text-gray-400">Projetos</span>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedProjectId(null)}
              className={`w-full text-left px-2 py-1 rounded hover:bg-gray-700 ${!selectedProjectId ? 'bg-gray-700' : ''}`}
            >
              Todos os projetos
            </button>
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={`w-full text-left px-2 py-1 rounded hover:bg-gray-700 ${selectedProjectId === project.id ? 'bg-gray-700' : ''}`}
              >
                {project.name}
              </button>
            ))}
          </div>
        </aside>

        {/* Conteúdo principal */}
        <main className="flex-1">
          <header className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Gerenciamento de Evidências</h1>
          </header>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Evidências</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedProjectId ? (
                <AdminEvidenciasView
                  projectId={selectedProjectId}
                />
              ) : (
                <AllEvidencesView />
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};
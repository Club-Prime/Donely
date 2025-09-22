import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Image, Video, Download, ExternalLink, Calendar } from 'lucide-react';

interface Evidence {
  id: string;
  report_id: string;
  type: 'IMAGE' | 'VIDEO';
  storage_key: string;
  url: string;
  thumbnail_url?: string;
  mime_type?: string;
  size_bytes?: number;
  uploaded_by: string;
  created_at: string;
  reports?: {
    sprint_id: string | null;
    sprints?: {
      sprint_number: number;
    }
  };
}

interface EvidenciasViewProps {
  projectId: string;
}

export const EvidenciasView = ({ projectId }: EvidenciasViewProps) => {
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [sprints, setSprints] = useState<{ id: string; sprint_number: number }[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvidences = async () => {
      try {
        // Buscar evidências através dos reports do projeto
        const { data, error } = await supabase
          .from('evidences')
          .select(`
            *,
            reports!inner(project_id, sprint_id, sprints(sprint_number))
          `)
          .eq('reports.project_id', projectId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setEvidences(data || []);
      } catch (error) {
        console.error('Erro ao buscar evidências:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchSprints = async () => {
      try {
        const { data, error } = await supabase
          .from('sprints')
          .select('id, sprint_number')
          .eq('project_id', projectId)
          .order('sprint_number', { ascending: false });
        if (error) throw error;
        setSprints(data || []);
      } catch (error) {
        console.error('Erro ao buscar sprints:', error);
      }
    };

    fetchEvidences();
    fetchSprints();
  }, [projectId]);

  const getFileIcon = (type: 'IMAGE' | 'VIDEO') => {
    if (type === 'IMAGE') {
      return <Image className="w-5 h-5 text-blue-500" />;
    } else if (type === 'VIDEO') {
      return <Video className="w-5 h-5 text-purple-500" />;
    } else {
      return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getFileTypeBadge = (type: 'IMAGE' | 'VIDEO') => {
    if (type === 'IMAGE') {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Imagem</Badge>;
    } else if (type === 'VIDEO') {
      return <Badge className="bg-purple-500 hover:bg-purple-600">Vídeo</Badge>;
    } else {
      return <Badge variant="outline">Arquivo</Badge>;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filteredEvidences = selectedSprintId
    ? evidences.filter((e) => e.reports?.sprint_id === selectedSprintId)
    : evidences;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Evidências do Projeto</h3>
        <p className="text-muted-foreground">
          Imagens, vídeos e documentos relacionados ao desenvolvimento do projeto.
        </p>
      </div>

      {/* Sprint filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={selectedSprintId === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedSprintId('')}
        >
          Todas as Sprints
        </Button>
        {sprints.map((s) => (
          <Button
            key={s.id}
            variant={selectedSprintId === s.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSprintId(s.id)}
          >
            Sprint {s.sprint_number}
          </Button>
        ))}
      </div>

      {filteredEvidences.length === 0 ? (
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">Nenhuma evidência ainda</h4>
            <p className="text-muted-foreground text-sm">
              As evidências do projeto (capturas de tela, vídeos de demonstração, etc.) aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvidences.map((evidence) => (
            <Card key={evidence.id} className="bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getFileIcon(evidence.type)}
                    <CardTitle className="text-lg truncate">
                      {evidence.type === 'IMAGE' ? 'Imagem' : 'Vídeo'}
                      {evidence.reports?.sprints?.sprint_number ? ` - Sprint ${evidence.reports.sprints.sprint_number}` : ''}
                    </CardTitle>
                  </div>
                  {getFileTypeBadge(evidence.type)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preview for images */}
                {evidence.type === 'IMAGE' && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={evidence.url} 
                      alt={`Evidência ${evidence.id}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Video preview */}
                {evidence.type === 'VIDEO' && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <video 
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                      poster={evidence.thumbnail_url}
                    >
                      <source src={evidence.url} type={evidence.mime_type || 'video/mp4'} />
                      Seu navegador não suporta vídeos.
                    </video>
                  </div>
                )}

                {/* File info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tamanho:</span>
                    <span>{formatFileSize(evidence.size_bytes) || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Criado em:</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(evidence.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <a
                    href={evidence.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Abrir
                  </a>
                  <a
                    href={evidence.url}
                    download={`evidencia-${evidence.id.slice(0, 8)}`}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
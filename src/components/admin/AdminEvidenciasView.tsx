import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Image, Video, Download, ExternalLink, Calendar, Trash2, Eye, Plus, Upload, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
  sprint_task_id?: string | null;
  reports?: {
    id: string;
    title: string;
    sprint_id: string;
    sprints?: {
      sprint_number: number;
    };
  };
}

interface Report {
  id: string;
  title: string;
  sprint_id: string;
  sprints?: {
    sprint_number: number;
  };
}

interface SprintTask {
  id: string;
  sprint_id: string;
  title: string;
  description?: string | null;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
}

interface AdminEvidenciasViewProps {
  projectId: string;
}

export const AdminEvidenciasView = ({ projectId }: AdminEvidenciasViewProps) => {
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [tasksBySprint, setTasksBySprint] = useState<Record<string, SprintTask[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadData, setUploadData] = useState({
    reportId: '',
    sprintTaskId: '',
    files: [] as File[]
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEvidences();
    fetchReports();
  }, [projectId]);

  const fetchEvidences = async () => {
    try {
      // Buscar evidências através dos reports do projeto
      const { data, error } = await supabase
        .from('evidences')
        .select(`
          *,
          reports!inner(
            id,
            title,
            sprint_id,
            project_id,
            sprints(sprint_number)
          )
        `)
        .eq('reports.project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvidences(data || []);
    } catch (error) {
      console.error('Erro ao buscar evidências:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as evidências",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          title,
          sprint_id,
          sprints(sprint_number)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
    }
  };

  const fetchTasksForSprint = async (sprintId: string) => {
    if (!sprintId) return;
    try {
      const { data, error } = await supabase
        .from('sprint_tasks')
        .select('id, sprint_id, title, description, status, created_at')
        .eq('sprint_id', sprintId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setTasksBySprint(prev => ({ ...prev, [sprintId]: data as SprintTask[] || [] }));
    } catch (error) {
      console.error('Erro ao buscar tarefas da sprint:', error);
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta evidência?')) return;

    try {
      const { error } = await supabase
        .from('evidences')
        .delete()
        .eq('id', evidenceId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Evidência excluída com sucesso!"
      });

      fetchEvidences();
    } catch (error) {
      console.error('Erro ao excluir evidência:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a evidência",
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      
      if (!isImage && !isVideo) {
        toast({
          title: "Arquivo inválido",
          description: `${file.name} não é uma imagem ou vídeo válido`,
          variant: "destructive"
        });
        return false;
      }
      
      if (!isValidSize) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} deve ter no máximo 50MB`,
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    });

    setUploadData(prev => ({
      ...prev,
      files: [...prev.files, ...validFiles]
    }));
  };

  const removeFile = (index: number) => {
    setUploadData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleUpload = async () => {
    if (!uploadData.reportId || uploadData.files.length === 0) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um relatório e pelo menos um arquivo",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Get current authenticated user to set uploaded_by correctly
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        throw userError;
      }
      const userId = userData.user?.id;
      if (!userId) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }

      for (const file of uploadData.files) {
        // Generate unique filename
        const fileExtension = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const filePath = `evidences/${projectId}/${fileName}`;

        // Upload to Supabase Storage
        const { data: storageData, error: uploadError } = await supabase.storage
          .from('evidences')
          .upload(filePath, file, { contentType: file.type, upsert: false });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('evidences')
          .getPublicUrl(filePath);

        // Determine file type
        const type = file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO';

        // Save to database
        const { error: dbError } = await supabase
          .from('evidences')
          .insert([{
            report_id: uploadData.reportId,
            type,
            storage_key: filePath,
            url: publicUrl,
            mime_type: file.type,
            size_bytes: file.size,
            uploaded_by: userId,
            sprint_task_id: uploadData.sprintTaskId || null
          }]);

        if (dbError) throw dbError;
      }

      toast({
        title: "Sucesso",
        description: `${uploadData.files.length} evidência(s) adicionada(s) com sucesso!`
      });

      // Reset form
  setUploadData({ reportId: '', sprintTaskId: '', files: [] });
      setShowAddModal(false);
      fetchEvidences();

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível fazer upload das evidências",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

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
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Gerenciar Evidências</h3>
          <p className="text-muted-foreground">
            Visualizar e gerenciar as evidências (imagens e vídeos) enviadas nos relatórios.
          </p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Evidência
        </Button>
      </div>

      {evidences.length === 0 ? (
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">Nenhuma evidência ainda</h4>
            <p className="text-muted-foreground text-sm">
              As evidências aparecerão aqui quando forem enviadas nos relatórios das sprints.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {evidences.map((evidence) => (
            <Card key={evidence.id} className="bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getFileIcon(evidence.type)}
                    <CardTitle className="text-base truncate">
                      {evidence.type === 'IMAGE' ? 'Imagem' : 'Vídeo'} - Sprint {evidence.reports?.sprints?.sprint_number || '?'}
                    </CardTitle>
                  </div>
                  <div className="flex flex-col gap-2">
                    {getFileTypeBadge(evidence.type)}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Relatório: {evidence.reports?.title || 'Sem título'}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preview for images */}
                {evidence.type === 'IMAGE' && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={evidence.url} 
                      alt={`Evidência ${evidence.id}`}
                      className="w-full h-full object-cover cursor-pointer"
                      loading="lazy"
                      onClick={() => setSelectedEvidence(evidence)}
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
                    <span className="text-muted-foreground">Enviado em:</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(evidence.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEvidence(evidence)}
                    className="flex-1"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Ver
                  </Button>
                  <a
                    href={evidence.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteEvidence(evidence.id)}
                    className="text-destructive hover:text-destructive px-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Evidence Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Evidências</DialogTitle>
            <DialogDescription>
              Faça upload de imagens ou vídeos como evidências para um relatório específico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Report Selection */}
            <div className="space-y-2">
              <Label htmlFor="report-select">Relatório</Label>
              <Select
                value={uploadData.reportId}
                onValueChange={async (value) => {
                  setUploadData(prev => ({ ...prev, reportId: value, sprintTaskId: '' }));
                  const sprintId = reports.find(r => r.id === value)?.sprint_id;
                  if (sprintId) await fetchTasksForSprint(sprintId);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um relatório para anexar as evidências" />
                </SelectTrigger>
                <SelectContent>
                  {reports.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{report.title}</span>
                        <span className="text-muted-foreground ml-2">
                          Sprint {report.sprints?.sprint_number || '?'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sprint Task Selection */}
            <div className="space-y-2">
              <Label htmlFor="task-select">Tarefa Executada (opcional)</Label>
              <Select
                value={uploadData.sprintTaskId}
                onValueChange={(value) => setUploadData(prev => ({ ...prev, sprintTaskId: value }))}
                disabled={!uploadData.reportId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vincule a evidência a uma tarefa desta sprint" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const sprintId = reports.find(r => r.id === uploadData.reportId)?.sprint_id;
                    const tasks = sprintId ? (tasksBySprint[sprintId] || []) : [];
                    if (!sprintId) {
                      return <SelectItem value="" disabled>Nenhuma sprint definida para este relatório</SelectItem>;
                    }
                    if (tasks.length === 0) {
                      return <SelectItem value="" disabled>Sem tarefas cadastradas nesta sprint</SelectItem>;
                    }
                    return tasks.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Arquivos</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      Selecionar Arquivos
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Imagens e vídeos até 50MB cada
                  </p>
                </div>
              </div>
            </div>

            {/* File List */}
            {uploadData.files.length > 0 && (
              <div className="space-y-2">
                <Label>Arquivos Selecionados</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uploadData.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center space-x-2">
                        {file.type.startsWith('image/') ? (
                          <Image className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Video className="w-4 h-4 text-purple-500" />
                        )}
                        <span className="text-sm truncate">{file.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setUploadData({ reportId: '', sprintTaskId: '', files: [] });
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading || !uploadData.reportId || uploadData.files.length === 0}
              >
                {uploading ? 'Enviando...' : 'Adicionar Evidências'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Evidence Detail Modal */}
      <Dialog open={!!selectedEvidence} onOpenChange={(open) => !open && setSelectedEvidence(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEvidence?.type === 'IMAGE' ? 'Imagem' : 'Vídeo'} - Sprint {selectedEvidence?.reports?.sprints?.sprint_number}
            </DialogTitle>
            <DialogDescription>
              Visualização detalhada da evidência anexada ao relatório.
            </DialogDescription>
          </DialogHeader>
          {selectedEvidence && (
            <div className="space-y-4">
              {/* Full size preview */}
              {selectedEvidence.type === 'IMAGE' ? (
                <div className="rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={selectedEvidence.url} 
                    alt={`Evidência ${selectedEvidence.id}`}
                    className="w-full h-auto max-h-[60vh] object-contain"
                  />
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden bg-muted">
                  <video 
                    className="w-full h-auto max-h-[60vh] object-contain"
                    controls
                    poster={selectedEvidence.thumbnail_url}
                  >
                    <source src={selectedEvidence.url} type={selectedEvidence.mime_type || 'video/mp4'} />
                    Seu navegador não suporta vídeos.
                  </video>
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Relatório:</span>
                  <div className="font-medium">{selectedEvidence.reports?.title || 'Sem título'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Sprint:</span>
                  <div className="font-medium">Sprint {selectedEvidence.reports?.sprints?.sprint_number || '?'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>
                  <div className="font-medium">{selectedEvidence.type === 'IMAGE' ? 'Imagem' : 'Vídeo'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Tamanho:</span>
                  <div className="font-medium">{formatFileSize(selectedEvidence.size_bytes) || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Formato:</span>
                  <div className="font-medium">{selectedEvidence.mime_type || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Enviado em:</span>
                  <div className="font-medium">{new Date(selectedEvidence.created_at).toLocaleString('pt-BR')}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <a
                  href={selectedEvidence.url}
                  download={`evidencia-${selectedEvidence.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                <a
                  href={selectedEvidence.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir em Nova Aba
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
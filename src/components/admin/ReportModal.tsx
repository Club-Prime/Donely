import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Image, Video, File, X } from 'lucide-react';
import { ReportFormData } from '@/hooks/useReportCRUD';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ReportFormData, files?: FileList) => Promise<void>;
  editingReport?: any;
  loading?: boolean;
}


export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingReport,
  loading = false
}) => {
  const [formData, setFormData] = useState<ReportFormData>({
    title: '',
    content_md: '',
    type: 'weekly'
  });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [errors, setErrors] = useState<{[key:string]:string}>({});

  useEffect(() => {
    if (editingReport) {
      setFormData({
        title: editingReport.title,
        content_md: editingReport.content_md || '',
        type: editingReport.type || 'weekly'
      });
    } else {
      setFormData({
        title: '',
        content_md: '',
        type: 'weekly'
      });
    }
    setSelectedFiles(null);
    setErrors({});
  }, [editingReport, isOpen]);

  const validate = () => {
    const newErrors: {[key:string]:string} = {};
    if (!formData.title.trim()) newErrors.title = 'Título obrigatório';
    if (!formData.content_md.trim()) newErrors.content_md = 'Conteúdo obrigatório';
    if (!formData.type) newErrors.type = 'Tipo obrigatório';
    return newErrors;
  };

  const handleSave = async () => {
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;
    await onSave(formData, selectedFiles || undefined);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    if (!selectedFiles) return;

    const dt = new DataTransfer();
    for (let i = 0; i < selectedFiles.length; i++) {
      if (i !== index) {
        dt.items.add(selectedFiles[i]);
      }
    }
    setSelectedFiles(dt.files);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type.startsWith('video/')) return <Video className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      case 'sprint': return 'Sprint';
      case 'final': return 'Final';
      default: return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {editingReport ? 'Editar Relatório' : 'Novo Relatório'}
                </DialogTitle>
                {editingReport && (
                  <Badge variant="secondary" className="mt-1">
                    ID: {editingReport.id.slice(0, 8)}...
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Informações Básicas */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Informações do Relatório
              </h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="report-title">Título *</Label>
                <Input
                  id="report-title"
                  placeholder="Ex: Relatório da Semana 1"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  aria-invalid={!!errors.title}
                />
                {errors.title && <span className="text-xs text-red-500">{errors.title}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-type">Tipo de Relatório</Label>
                <Select value={formData.type || 'weekly'} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="sprint">Sprint</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <span className="text-xs text-red-500">{errors.type}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-content">Conteúdo *</Label>
                <Textarea
                  id="report-content"
                  placeholder="Descreva o progresso, desafios encontrados, próximos passos..."
                  rows={8}
                  value={formData.content_md}
                  onChange={(e) => setFormData({...formData, content_md: e.target.value})}
                  className="font-mono text-sm"
                  aria-invalid={!!errors.content_md}
                />
                {errors.content_md && <span className="text-xs text-red-500">{errors.content_md}</span>}
                <p className="text-xs text-gray-500">
                  Suporte a Markdown para formatação rica
                </p>
              </div>
            </div>
          </div>

          {/* Upload de Evidências */}
          {!editingReport && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Upload className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Evidências (Opcional)
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="evidence-upload">Anexar Arquivos</Label>
                  <Input
                    id="evidence-upload"
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-gray-500">
                    Aceita imagens, vídeos e documentos (PDF, DOC, TXT)
                  </p>
                </div>

                {selectedFiles && selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Arquivos Selecionados ({selectedFiles.length})</Label>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {Array.from(selectedFiles).map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            {getFileIcon(file)}
                            <div>
                              <p className="text-sm font-medium truncate max-w-[200px]">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview do Relatório */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gray-500/20 rounded-lg">
                <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                👀 Preview do Relatório
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Como aparecerá na lista
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {formData.title || 'Título do Relatório'}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(formData.type)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date().toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {formData.content_md && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded border">
                  <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4 whitespace-pre-wrap">
                    {formData.content_md}
                  </div>
                </div>
              )}

              {selectedFiles && selectedFiles.length > 0 && (
                <div className="mt-3 flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    📎 {selectedFiles.length} arquivo{selectedFiles.length > 1 ? 's' : ''} anexo{selectedFiles.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} className="min-w-[120px]">
            {loading ? 'Salvando...' : (editingReport ? 'Salvar Alterações' : 'Criar Relatório')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
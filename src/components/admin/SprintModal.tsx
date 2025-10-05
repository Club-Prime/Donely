import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Activity, Calendar, FileText, Target } from 'lucide-react';
import { SprintFormData, Sprint } from '@/hooks/useSprintCRUD';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
}

interface SprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SprintFormData, selectedEvidences: string[]) => Promise<void>;
  editingSprint?: Sprint | null;
  roadmapItems?: RoadmapItem[];
  availableEvidences?: any[];
  selectedEvidences?: string[];
  onEvidenceSelectionChange?: (evidences: string[]) => void;
  loading?: boolean;
}

interface SprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SprintFormData, selectedEvidences: string[]) => Promise<void>;
  editingSprint?: Sprint | null;
  roadmapItems?: RoadmapItem[];
  availableEvidences?: any[];
  selectedEvidences?: string[];
  onEvidenceSelectionChange?: (evidences: string[]) => void;
  loading?: boolean;
}


export const SprintModal: React.FC<SprintModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSprint,
  roadmapItems = [],
  availableEvidences = [],
  selectedEvidences = [],
  onEvidenceSelectionChange,
  loading = false
}) => {
  const [formData, setFormData] = useState<SprintFormData>({
    start_date: '',
    end_date: '',
    status: 'PLANNED',
    roadmap_item_id: 'none'
  });
  const [localSelectedEvidences, setLocalSelectedEvidences] = useState<string[]>(selectedEvidences);
  const [errors, setErrors] = useState<{[key:string]:string}>({});

  useEffect(() => {
    if (editingSprint) {
      setFormData({
        start_date: editingSprint.start_date || '',
        end_date: editingSprint.end_date || '',
        status: editingSprint.status || 'PLANNED',
        roadmap_item_id: editingSprint.roadmap_item_id || ''
      });
      setLocalSelectedEvidences(selectedEvidences);
    } else {
      setFormData({
        start_date: '',
        end_date: '',
        status: 'PLANNED',
        roadmap_item_id: 'none'
      });
      setLocalSelectedEvidences([]);
    }
    setErrors({});
  }, [editingSprint, isOpen, selectedEvidences]);

  const validate = () => {
    const newErrors: {[key:string]:string} = {};
    if (!formData.start_date) newErrors.start_date = 'Data de início obrigatória';
    if (!formData.end_date) newErrors.end_date = 'Data de fim obrigatória';
    if (!formData.status) newErrors.status = 'Status obrigatório';
    return newErrors;
  };

  const handleSave = async () => {
        const validation = validate();
        setErrors(validation);
        if (Object.keys(validation).length > 0) return;
        // Convert 'none' to null for backend
        const submitData = {
          ...formData,
          roadmap_item_id: formData.roadmap_item_id === 'none' ? null : formData.roadmap_item_id
        };
        await onSave(submitData, localSelectedEvidences);
  };

  const handleEvidenceToggle = (evidenceId: string) => {
    const newSelection = localSelectedEvidences.includes(evidenceId)
      ? localSelectedEvidences.filter(id => id !== evidenceId)
      : [...localSelectedEvidences, evidenceId];

    setLocalSelectedEvidences(newSelection);
    onEvidenceSelectionChange?.(newSelection);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'bg-blue-500';
      case 'IN_PROGRESS': return 'bg-orange-500';
      case 'DONE': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'Planejado';
      case 'IN_PROGRESS': return 'Em Andamento';
      case 'DONE': return 'Concluído';
      default: return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-lg">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {editingSprint ? 'Editar Sprint' : 'Nova Sprint'}
                </DialogTitle>
                {editingSprint && (
                  <Badge variant="secondary" className="mt-1">
                    Sprint #{editingSprint.sprint_number}
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
                Informações Básicas
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sprint-start-date">Data de Início *</Label>
                <Input
                  id="sprint-start-date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  aria-invalid={!!errors.start_date}
                />
                {errors.start_date && <span className="text-xs text-red-500">{errors.start_date}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sprint-end-date">Data de Fim *</Label>
                <Input
                  id="sprint-end-date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  aria-invalid={!!errors.end_date}
                />
                {errors.end_date && <span className="text-xs text-red-500">{errors.end_date}</span>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sprint-status">Status</Label>
              <Select value={formData.status || 'PLANNED'} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNED">Planejado</SelectItem>
                    <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                    <SelectItem value="DONE">Concluído</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <span className="text-xs text-red-500">{errors.status}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sprint-start">Data de Início *</Label>
                <Input
                  id="sprint-start"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  aria-invalid={!!errors.start_date}
                />
                {errors.start_date && <span className="text-xs text-red-500">{errors.start_date}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sprint-end">Data de Fim *</Label>
                <Input
                  id="sprint-end"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  aria-invalid={!!errors.end_date}
                />
                {errors.end_date && <span className="text-xs text-red-500">{errors.end_date}</span>}
              </div>
            </div>
          </div>

          {/* Vinculação com Roadmap */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Vinculação com Roadmap
              </h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roadmap-item">Item do Roadmap (Opcional)</Label>
              <Select value={formData.roadmap_item_id || ""} onValueChange={(value) => setFormData({...formData, roadmap_item_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um item do roadmap..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (Sprint independente)</SelectItem>
                  {roadmapItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vincular esta sprint a um item específico do roadmap ajuda no rastreamento de progresso.
              </p>
            </div>
          </div>

          {/* Evidências */}
          {availableEvidences.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Evidências ({localSelectedEvidences.length} selecionadas)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {availableEvidences.map((evidence) => (
                  <div
                    key={evidence.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      localSelectedEvidences.includes(evidence.id)
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => handleEvidenceToggle(evidence.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        localSelectedEvidences.includes(evidence.id) ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {evidence.type === 'IMAGE' ? '🖼️' : evidence.type === 'VIDEO' ? '🎥' : '📄'} {evidence.name || 'Evidência'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {new Date(evidence.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview da Sprint */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gray-500/20 rounded-lg">
                <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                👀 Preview da Sprint
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Como a sprint aparecerá na lista
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1 bg-orange-500/20 rounded">
                    <Activity className="h-4 w-4 text-orange-500" />
                  </div>
                  <span className="font-medium">{editingSprint ? `Sprint ${editingSprint.sprint_number}` : 'Nova Sprint'}</span>
                  <Badge className={`${getStatusColor(formData.status)} text-white text-xs`}>
                    {getStatusLabel(formData.status)}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                  {formData.start_date && formData.end_date ?
                    `${new Date(formData.start_date).toLocaleDateString('pt-BR')} - ${new Date(formData.end_date).toLocaleDateString('pt-BR')}` :
                    'Período não definido'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} className="min-w-[120px]">
            {loading ? 'Salvando...' : (editingSprint ? 'Salvar Alterações' : 'Criar Sprint')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
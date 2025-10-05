import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Target, Calendar, FileText, TrendingUp } from 'lucide-react';

interface RoadmapFormData {
  title: string;
  description: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
}

interface RoadmapItem extends RoadmapFormData {
  id: string;
  project_id: string;
}

interface RoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RoadmapFormData) => Promise<void>;
  editingItem?: RoadmapItem | null;
  loading?: boolean;
}

export const RoadmapModal: React.FC<RoadmapModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  loading = false
}) => {
  const [formData, setFormData] = useState<RoadmapFormData>({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    status: 'NOT_STARTED'
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title,
        description: editingItem.description,
        category: editingItem.category,
        priority: editingItem.priority,
        status: editingItem.status
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: 'medium',
        status: 'NOT_STARTED'
      });
    }
  }, [editingItem, isOpen]);

  const handleSave = async () => {
    await onSave(formData);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_STARTED': return 'bg-gray-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'DONE': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NOT_STARTED': return 'Não Iniciado';
      case 'IN_PROGRESS': return 'Em Andamento';
      case 'DONE': return 'Concluído';
      default: return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl shadow-lg">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {editingItem ? 'Editar Item do Roadmap' : 'Novo Item do Roadmap'}
                </DialogTitle>
                {editingItem && (
                  <Badge variant="secondary" className="mt-1">
                    ID: {editingItem.id.slice(0, 8)}...
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

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roadmap-title">Título *</Label>
                <Input
                  id="roadmap-title"
                  placeholder="Ex: Implementar sistema de autenticação"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roadmap-category">Categoria *</Label>
                  <Input
                    id="roadmap-category"
                    placeholder="Ex: Funcionalidade, Bug, Melhoria"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roadmap-priority">Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({...formData, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roadmap-status">Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOT_STARTED">Não Iniciado</SelectItem>
                    <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                    <SelectItem value="DONE">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roadmap-description">Descrição</Label>
                <Textarea
                  id="roadmap-description"
                  placeholder="Descreva detalhadamente este item do roadmap..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Preview do Item */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gray-500/20 rounded-lg">
                <Target className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                👀 Preview do Item
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Como aparecerá no roadmap
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Target className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {formData.title || 'Título do Item'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formData.category || 'Categoria'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={`${getPriorityColor(formData.priority)} text-white text-xs`}>
                    {getPriorityLabel(formData.priority)}
                  </Badge>
                  <Badge className={`${getStatusColor(formData.status)} text-white text-xs`}>
                    {getStatusLabel(formData.status)}
                  </Badge>
                </div>
              </div>

              {formData.description && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                  <p className="text-sm text-blue-800 dark:text-blue-200 line-clamp-3">
                    {formData.description}
                  </p>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>0 sprints vinculadas</span>
                <span>Criado recentemente</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} className="min-w-[120px]">
            {loading ? 'Salvando...' : (editingItem ? 'Salvar Alterações' : 'Criar Item')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
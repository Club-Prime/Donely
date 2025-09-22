import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Route, Plus, Edit, Trash2, CheckCircle2, Clock, Circle, ArrowUp, ArrowDown, Calendar, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProject } from '@/contexts/ProjectContext';

interface RoadmapItem {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
  effort: number;
  start_date?: string;
  end_date?: string;
  dependency_ids: string[];
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface AdminRoadmapViewProps {
  projectId: string;
}

type RoadmapFormData = {
  title: string;
  description: string;
  status: RoadmapItem['status'];
  effort: string;
  start_date: string;
  end_date: string;
};

interface RoadmapItemFormProps {
  formData: RoadmapFormData;
  setFormData: React.Dispatch<React.SetStateAction<RoadmapFormData>>;
  isEditing: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

function RoadmapItemForm({ formData, setFormData, isEditing, onCancel, onSubmit }: RoadmapItemFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Nome do item do roadmap..."
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Descrição detalhada do item..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="effort">Esforço (dias)</Label>
          <Input
            id="effort"
            type="number"
            min="1"
            value={formData.effort}
            onChange={(e) => setFormData(prev => ({ ...prev, effort: e.target.value }))}
            placeholder="1"
          />
        </div>
        <div>
          <Label htmlFor="start_date">Data de Início</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="end_date">Data de Fim</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as RoadmapItem['status'] }))}>
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

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onSubmit}>
          {isEditing ? 'Atualizar' : 'Criar'} Item
        </Button>
      </div>
    </div>
  );
}

export function AdminRoadmapView() {
  console.log('🔄 AdminRoadmapView: Componente renderizado');
  
  const { selectedProject } = useProject();
  const { toast } = useToast();
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'NOT_STARTED' as RoadmapItem['status'],
    effort: '1',
    start_date: '',
    end_date: ''
  });

  console.log('📊 AdminRoadmapView: Estado atual:', {
    itemsCount: items.length,
    loading,
    showCreateModal,
    editingItem: editingItem?.id || null,
    formDataTitle: formData.title,
    formDataDescription: formData.description,
    selectedProject: selectedProject ? {
      id: selectedProject.id,
      name: selectedProject.name
    } : null
  });

  useEffect(() => {
    fetchRoadmapItems();
  }, [selectedProject?.id]);

  const fetchRoadmapItems = async () => {
    if (!selectedProject) {
      console.log('❌ AdminRoadmapView: Nenhum projeto selecionado');
      setLoading(false);
      return;
    }
    
    console.log('🔄 AdminRoadmapView: Buscando itens para projeto:', selectedProject.id);
    
    try {
      const { data, error } = await supabase
        .from('roadmap_items')
        .select('*')
        .eq('project_id', selectedProject.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setItems(data || []);
      console.log('✅ AdminRoadmapView: Itens carregados:', data?.length || 0);
    } catch (error) {
      console.error('Erro ao buscar itens do roadmap:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os itens do roadmap.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async () => {
    if (!selectedProject) return;

    try {
      const nextOrderIndex = items.length > 0
        ? Math.max(...items.map(item => item.order_index)) + 1
        : 0;

      const { error } = await supabase
        .from('roadmap_items')
        .insert({
          project_id: selectedProject.id,
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          effort: parseInt(formData.effort),
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          order_index: nextOrderIndex
        });      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item do roadmap criado com sucesso!"
      });

      setShowCreateModal(false);
      resetForm();
      fetchRoadmapItems();
    } catch (error) {
      console.error('Erro ao criar item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o item",
        variant: "destructive"
      });
    }
  };

  const handleEditItem = async () => {
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from('roadmap_items')
        .update({
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          effort: parseInt(formData.effort),
          start_date: formData.start_date || null,
          end_date: formData.end_date || null
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item atualizado com sucesso!"
      });

      setEditingItem(null);
      resetForm();
      fetchRoadmapItems();
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o item",
        variant: "destructive"
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja excluir este item do roadmap?')) return;

    try {
      const { error } = await supabase
        .from('roadmap_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item excluído com sucesso!"
      });

      fetchRoadmapItems();
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o item",
        variant: "destructive"
      });
    }
  };

  const handleMoveItem = async (itemId: string, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex(item => item.id === itemId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    try {
      const currentItem = items[currentIndex];
      const swapItem = items[newIndex];

      // Swap order indexes using individual updates
      await supabase
        .from('roadmap_items')
        .update({ order_index: swapItem.order_index })
        .eq('id', currentItem.id);

      const { error } = await supabase
        .from('roadmap_items')
        .update({ order_index: currentItem.order_index })
        .eq('id', swapItem.id);

      if (error) throw error;

      fetchRoadmapItems();
    } catch (error) {
      console.error('Erro ao reordenar item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reordenar o item",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'NOT_STARTED',
      effort: '1',
      start_date: '',
      end_date: ''
    });
  };

  const openEditModal = (item: RoadmapItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      status: item.status,
      effort: item.effort.toString(),
      start_date: item.start_date || '',
      end_date: item.end_date || ''
    });
  };

  const getStatusBadge = (status: RoadmapItem['status']) => {
    switch (status) {
      case 'DONE':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Concluído</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />Em Progresso</Badge>;
      case 'NOT_STARTED':
        return <Badge variant="outline"><Circle className="w-3 h-3 mr-1" />Não Iniciado</Badge>;
    }
  };

  const getEffortBadge = (effort: number) => {
    if (effort <= 3) return <Badge variant="outline">Baixo ({effort})</Badge>;
    if (effort <= 7) return <Badge variant="secondary">Médio ({effort})</Badge>;
    return <Badge variant="destructive">Alto ({effort})</Badge>;
  };

  

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
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
          <h3 className="text-2xl font-bold">Gerenciar Roadmap</h3>
          <p className="text-muted-foreground">
            Criar, editar e organizar os itens do roadmap do projeto.
          </p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Item do Roadmap</DialogTitle>
              <DialogDescription>
                Adicione um novo marco ou objetivo ao roadmap do projeto.
              </DialogDescription>
            </DialogHeader>
            <RoadmapItemForm
              formData={formData}
              setFormData={setFormData}
              isEditing={!!editingItem}
              onCancel={() => {
                setShowCreateModal(false);
                setEditingItem(null);
                resetForm();
              }}
              onSubmit={handleCreateItem}
            />
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-8 text-center">
            <Route className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">Roadmap vazio</h4>
            <p className="text-muted-foreground text-sm mb-4">
              Comece criando o primeiro item do roadmap para este projeto.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <Card key={item.id} className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-mono text-muted-foreground">#{index + 1}</span>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveItem(item.id, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveItem(item.id, 'down')}
                        disabled={index === items.length - 1}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {getStatusBadge(item.status)}
                      {getEffortBadge(item.effort)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Esforço:</span>
                    <div className="font-medium">{item.effort} ponto{item.effort > 1 ? 's' : ''}</div>
                  </div>
                  {item.start_date && (
                    <div>
                      <span className="text-muted-foreground">Início:</span>
                      <div className="font-medium">
                        {new Date(item.start_date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  )}
                  {item.end_date && (
                    <div>
                      <span className="text-muted-foreground">Fim:</span>
                      <div className="font-medium">
                        {new Date(item.end_date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Item do Roadmap</DialogTitle>
            <DialogDescription>
              Modifique as informações deste item do roadmap.
            </DialogDescription>
          </DialogHeader>
          <RoadmapItemForm
            formData={formData}
            setFormData={setFormData}
            isEditing={!!editingItem}
            onCancel={() => setEditingItem(null)}
            onSubmit={handleEditItem}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
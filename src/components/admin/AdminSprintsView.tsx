import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Trash2, Edit, Plus, Calendar } from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Sprint {
  id: string;
  sprint_number: number;
  week_start_date: string;
  week_end_date: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'DONE';
  planned_scope: any;
  actual_delivered?: any;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  project_id: string;
}

interface FormData {
  sprint_number: string;
  week_start_date: string;
  week_end_date: string;
  status: string;
  planned_tasks: string[];
  actual_delivered: string[];
  notes: string;
}

interface SprintFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  editingSprint: Sprint | null;
  onCancel: () => void;
  onSubmit: () => void;
  updateTaskField: (index: number, value: string, type: 'planned_tasks' | 'actual_delivered') => void;
  addTaskField: (type: 'planned_tasks' | 'actual_delivered') => void;
  removeTaskField: (index: number, type: 'planned_tasks' | 'actual_delivered') => void;
}

function SprintForm({ formData, setFormData, editingSprint, onCancel, onSubmit, updateTaskField, addTaskField, removeTaskField }: SprintFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sprint_number">Número da Sprint</Label>
          <Input
            id="sprint_number"
            value={formData.sprint_number}
            onChange={(e) => setFormData(prev => ({ ...prev, sprint_number: e.target.value }))}
            placeholder="1"
            type="number"
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PLANNED">Planejada</SelectItem>
              <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
              <SelectItem value="DONE">Concluída</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="week_start_date">Data de Início</Label>
          <Input
            id="week_start_date"
            type="date"
            value={formData.week_start_date}
            onChange={(e) => setFormData(prev => ({ ...prev, week_start_date: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="week_end_date">Data de Fim</Label>
          <Input
            id="week_end_date"
            type="date"
            value={formData.week_end_date}
            onChange={(e) => setFormData(prev => ({ ...prev, week_end_date: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label>Escopo Planejado</Label>
        <div className="space-y-2">
          {formData.planned_tasks.map((task, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={task}
                onChange={(e) => updateTaskField(index, e.target.value, 'planned_tasks')}
                placeholder="Tarefa planejada"
              />
              {formData.planned_tasks.length > 1 && (
                <Button type="button" variant="outline" size="icon" onClick={() => removeTaskField(index, 'planned_tasks')}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => addTaskField('planned_tasks')}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Tarefa
          </Button>
        </div>
      </div>

      <div>
        <Label>Entregas Realizadas</Label>
        <div className="space-y-2">
          {formData.actual_delivered.map((delivery, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={delivery}
                onChange={(e) => updateTaskField(index, e.target.value, 'actual_delivered')}
                placeholder="Entrega realizada"
              />
              {formData.actual_delivered.length > 1 && (
                <Button type="button" variant="outline" size="icon" onClick={() => removeTaskField(index, 'actual_delivered')}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => addTaskField('actual_delivered')}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Entrega
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Observações sobre a sprint..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onSubmit}>
          {editingSprint ? 'Atualizar' : 'Criar'} Sprint
        </Button>
      </div>
    </div>
  );
}

export function AdminSprintsView() {
  const { selectedProject } = useProject();
  const { toast } = useToast();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [formData, setFormData] = useState<FormData>({
    sprint_number: '',
    week_start_date: '',
    week_end_date: '',
    status: 'PLANNED',
    planned_tasks: [''],
    actual_delivered: [''],
    notes: ''
  });

  const fetchSprints = useCallback(async () => {
    if (!selectedProject) {
      console.log('❌ AdminSprintsView: Nenhum projeto selecionado');
      setLoading(false);
      return;
    }

    console.log('🔄 AdminSprintsView: Buscando sprints para projeto:', selectedProject.id);

    try {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('project_id', selectedProject.id)
        .order('sprint_number', { ascending: true });

      if (error) throw error;
      setSprints(data || []);
      console.log('✅ AdminSprintsView: Sprints carregadas:', data?.length || 0);
    } catch (error) {
      console.error('Erro ao buscar sprints:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as sprints.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [selectedProject, toast]);

  useEffect(() => {
    fetchSprints();
  }, [fetchSprints]);

  const resetForm = useCallback(() => {
    setFormData({
      sprint_number: '',
      week_start_date: '',
      week_end_date: '',
      status: 'PLANNED',
      planned_tasks: [''],
      actual_delivered: [''],
      notes: ''
    });
  }, []);

  const getNextSprintNumber = useCallback(() => {
    if (sprints.length === 0) return 1;
    return Math.max(...sprints.map(s => s.sprint_number)) + 1;
  }, [sprints]);

  const handleCreateSprint = useCallback(async () => {
    if (!selectedProject) return;

    try {
      const plannedScope = formData.planned_tasks.filter(task => task.trim() !== '').length > 0 ? {
        tasks: formData.planned_tasks.filter(task => task.trim() !== '')
      } : null;

      const actualDelivered = formData.actual_delivered.filter(task => task.trim() !== '').length > 0 ? {
        deliveries: formData.actual_delivered.filter(task => task.trim() !== '')
      } : null;

      const { error } = await supabase
        .from('sprints')
        .insert({
          project_id: selectedProject.id,
          sprint_number: parseInt(formData.sprint_number),
          week_start_date: formData.week_start_date,
          week_end_date: formData.week_end_date,
          status: formData.status as Sprint['status'],
          planned_scope: plannedScope
        });

      if (error) throw error;

      toast({
        title: "Sprint criada",
        description: "Sprint criada com sucesso!"
      });

      setShowCreateModal(false);
      resetForm();
      fetchSprints();
    } catch (error) {
      console.error('Erro ao criar sprint:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a sprint.",
        variant: "destructive"
      });
    }
  }, [selectedProject, formData, toast, resetForm, fetchSprints]);

  const handleEditSprint = useCallback(async () => {
    if (!editingSprint) return;

    try {
      const plannedScope = formData.planned_tasks.filter(task => task.trim() !== '').length > 0 ? {
        tasks: formData.planned_tasks.filter(task => task.trim() !== '')
      } : null;

      const actualDelivered = formData.actual_delivered.filter(task => task.trim() !== '').length > 0 ? {
        deliveries: formData.actual_delivered.filter(task => task.trim() !== '')
      } : null;

      const { error } = await supabase
        .from('sprints')
        .update({
          sprint_number: parseInt(formData.sprint_number),
          week_start_date: formData.week_start_date,
          week_end_date: formData.week_end_date,
          status: formData.status as Sprint['status'],
          planned_scope: plannedScope
        })
        .eq('id', editingSprint.id);

      if (error) throw error;

      toast({
        title: "Sprint atualizada",
        description: "Sprint atualizada com sucesso!"
      });

      setEditingSprint(null);
      resetForm();
      fetchSprints();
    } catch (error) {
      console.error('Erro ao atualizar sprint:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a sprint.",
        variant: "destructive"
      });
    }
  }, [editingSprint, formData, toast, resetForm, fetchSprints]);

  const handleDeleteSprint = async (sprintId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta sprint?')) return;

    try {
      const { error } = await supabase
        .from('sprints')
        .delete()
        .eq('id', sprintId);

      if (error) throw error;

      toast({
        title: "Sprint excluída",
        description: "Sprint excluída com sucesso!"
      });

      fetchSprints();
    } catch (error) {
      console.error('Erro ao excluir sprint:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a sprint.",
        variant: "destructive"
      });
    }
  };

  const openEditModal = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setFormData({
      sprint_number: sprint.sprint_number.toString(),
      week_start_date: sprint.week_start_date,
      week_end_date: sprint.week_end_date,
      status: sprint.status,
      planned_tasks: sprint.planned_scope?.tasks || [''],
      actual_delivered: sprint.actual_delivered?.deliveries || [''],
      notes: sprint.notes || ''
    });
  };

  const updateTaskField = (index: number, value: string, type: 'planned_tasks' | 'actual_delivered') => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].map((task, i) => i === index ? value : task)
    }));
  };

  const addTaskField = (type: 'planned_tasks' | 'actual_delivered') => {
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], '']
    }));
  };

  const removeTaskField = (index: number, type: 'planned_tasks' | 'actual_delivered') => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const getStatusBadge = (status: Sprint['status']) => {
    const statusConfig = {
      PLANNED: { label: 'Planejada', variant: 'default' as const },
      IN_PROGRESS: { label: 'Em Andamento', variant: 'secondary' as const },
      DONE: { label: 'Concluída', variant: 'outline' as const }
    };

    const config = statusConfig[status] || statusConfig.PLANNED;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!selectedProject) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Selecione um projeto para gerenciar sprints.</p>
      </div>
    );
  }

  // end inline SprintForm

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
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
          <h3 className="text-2xl font-bold">Gerenciar Sprints</h3>
          <p className="text-muted-foreground">
            Criar, editar e gerenciar as sprints do projeto.
          </p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button onClick={() => setFormData(prev => ({ ...prev, sprint_number: getNextSprintNumber().toString() }))}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Sprint
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Sprint</DialogTitle>
              <DialogDescription>
                Crie uma nova sprint definindo o número, período e escopo planejado.
              </DialogDescription>
            </DialogHeader>
            <SprintForm
              formData={formData}
              setFormData={setFormData}
              editingSprint={editingSprint}
              onCancel={() => { setShowCreateModal(false); resetForm(); }}
              onSubmit={handleCreateSprint}
              updateTaskField={updateTaskField}
              addTaskField={addTaskField}
              removeTaskField={removeTaskField}
            />
          </DialogContent>
        </Dialog>
      </div>

      {sprints.length === 0 ? (
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-8 text-center">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">Nenhuma sprint criada</h4>
            <p className="text-muted-foreground text-sm mb-4">
              Comece criando a primeira sprint para este projeto.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Sprint
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sprints.map((sprint) => (
            <Card key={sprint.id} className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Sprint {sprint.sprint_number}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(sprint.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(sprint)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSprint(sprint.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(sprint.week_start_date), 'dd MMM', { locale: ptBR })} - {' '}
                  {format(new Date(sprint.week_end_date), 'dd MMM yyyy', { locale: ptBR })}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {sprint.planned_scope && (
                  <div>
                    <h5 className="font-medium mb-2">Escopo Planejado:</h5>
                    <div className="text-sm text-muted-foreground">
                      {Array.isArray(sprint.planned_scope?.tasks) ? (
                        <ul className="list-disc list-inside space-y-1">
                          {sprint.planned_scope.tasks.map((task: string, index: number) => (
                            <li key={index}>{task}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>Escopo não definido</p>
                      )}
                    </div>
                  </div>
                )}

                {sprint.actual_delivered && (
                  <div>
                    <h5 className="font-medium mb-2">Entregue:</h5>
                    <div className="text-sm text-muted-foreground">
                      {Array.isArray(sprint.actual_delivered?.deliveries) ? (
                        <ul className="list-disc list-inside space-y-1">
                          {sprint.actual_delivered.deliveries.map((delivery: string, index: number) => (
                            <li key={index}>{delivery}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>Nenhuma entrega registrada ainda</p>
                      )}
                    </div>
                  </div>
                )}

                {sprint.notes && (
                  <div>
                    <h5 className="font-medium mb-2">Observações:</h5>
                    <p className="text-sm text-muted-foreground">{sprint.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editingSprint} onOpenChange={(open) => !open && setEditingSprint(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Sprint {editingSprint?.sprint_number}</DialogTitle>
            <DialogDescription>
              Edite as informações da sprint incluindo período, status e escopo.
            </DialogDescription>
          </DialogHeader>
          <SprintForm
            formData={formData}
            setFormData={setFormData}
            editingSprint={editingSprint}
            onCancel={() => setEditingSprint(null)}
            onSubmit={handleEditSprint}
            updateTaskField={updateTaskField}
            addTaskField={addTaskField}
            removeTaskField={removeTaskField}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
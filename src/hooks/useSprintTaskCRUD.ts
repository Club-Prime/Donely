import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SprintTask {
  id: string;
  sprint_id: string;
  title: string;
  description: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
  roadmap_item_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SprintTaskFormData {
  title: string;
  description: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
  roadmap_item_id?: string;
}

export const useSprintTaskCRUD = (sprintId: string | null) => {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<SprintTask[]>([]);

  const loadTasks = useCallback(async () => {
    if (!sprintId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sprint_tasks')
        .select('*')
        .eq('sprint_id', sprintId);
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    } finally {
      setLoading(false);
    }
  }, [sprintId]);

  const createTask = useCallback(async (data: SprintTaskFormData): Promise<SprintTask | null> => {
    if (!sprintId) return null;
    setLoading(true);
    try {
      const { data: newTask, error } = await supabase
        .from('sprint_tasks')
        .insert({
          sprint_id: sprintId,
          ...data
        })
        .select()
        .single();
      if (error) throw error;
      setTasks(prev => [...prev, newTask]);
      toast({ title: "Sucesso", description: "Tarefa criada com sucesso!" });
      return newTask;
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast({ title: "Erro", description: "Erro ao criar tarefa", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [sprintId]);

  const updateTask = useCallback(async (id: string, data: Partial<SprintTaskFormData>): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('sprint_tasks')
        .update(data)
        .eq('id', id);
      if (error) throw error;
      setTasks(prev => prev.map(task =>
        task.id === id ? { ...task, ...data } : task
      ));
      toast({ title: "Sucesso", description: "Tarefa atualizada com sucesso!" });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast({ title: "Erro", description: "Erro ao atualizar tarefa", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('sprint_tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setTasks(prev => prev.filter(task => task.id !== id));
      toast({ title: "Sucesso", description: "Tarefa excluída com sucesso!" });
      return true;
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast({ title: "Erro", description: "Erro ao excluir tarefa", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    tasks,
    loadTasks,
    createTask,
    updateTask,
    deleteTask
  };
};
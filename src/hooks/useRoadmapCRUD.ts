import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface RoadmapFormData {
  title: string;
  description: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
}

export interface RoadmapItem extends RoadmapFormData {
  id: string;
  project_id: string;
}

export const useRoadmapCRUD = (projectId: string | null) => {
  const [loading, setLoading] = useState(false);
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);

  const validateRoadmapData = (data: RoadmapFormData): string | null => {
    if (!data.title?.trim()) return 'Título é obrigatório';
    return null;
  };

  const createRoadmapItem = useCallback(async (data: RoadmapFormData): Promise<RoadmapItem | null> => {
    const validationError = validateRoadmapData(data);
    if (validationError) {
      toast({ title: "Erro de validação", description: validationError, variant: "destructive" });
      return null;
    }

    setLoading(true);
    try {
      const { data: newItem, error } = await supabase
        .from('roadmap_items')
        .insert({
          project_id: projectId!,
          title: data.title,
          description: data.description,
          status: data.status
        })
        .select()
        .single();

      if (error) throw error;

      setRoadmapItems(prev => [...prev, newItem]);
      toast({ title: "Sucesso", description: "Item do roadmap criado com sucesso!" });

      return newItem;
    } catch (error) {
      console.error('Erro ao criar item do roadmap:', error);
      toast({ title: "Erro", description: "Erro ao criar item do roadmap", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const updateRoadmapItem = useCallback(async (id: string, data: RoadmapFormData): Promise<boolean> => {
    const validationError = validateRoadmapData(data);
    if (validationError) {
      toast({ title: "Erro de validação", description: validationError, variant: "destructive" });
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('roadmap_items')
        .update({
          title: data.title,
          description: data.description,
          status: data.status
        })
        .eq('id', id);

      if (error) throw error;

      setRoadmapItems(prev =>
        prev.map(item =>
          item.id === id
            ? { ...item, ...data }
            : item
        )
      );
      toast({ title: "Sucesso", description: "Item do roadmap atualizado com sucesso!" });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar item do roadmap:', error);
      toast({ title: "Erro", description: "Erro ao atualizar item do roadmap", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRoadmapItem = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('roadmap_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRoadmapItems(prev => prev.filter(item => item.id !== id));
      toast({ title: "Sucesso", description: "Item do roadmap excluído com sucesso!" });
      return true;
    } catch (error) {
      console.error('Erro ao excluir item do roadmap:', error);
      toast({ title: "Erro", description: "Erro ao excluir item do roadmap", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRoadmapItems = useCallback(async (): Promise<void> => {
    if (!projectId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('roadmap_items')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (error) throw error;

      setRoadmapItems(data || []);
    } catch (error) {
      console.error('Erro ao carregar itens do roadmap:', error);
      toast({ title: "Erro", description: "Erro ao carregar itens do roadmap", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  return {
    loading,
    roadmapItems,
    createRoadmapItem,
    updateRoadmapItem,
    deleteRoadmapItem,
    loadRoadmapItems
  };
};
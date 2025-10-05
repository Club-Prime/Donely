import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SprintFormData {
  start_date: string;
  end_date: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'DONE';
  roadmap_item_id?: string;
}

export interface Sprint extends SprintFormData {
  id: string;
  sprint_number: number;
  project_id: string;
  roadmap_item_id?: string;
  evidences?: any[];
}

export const useSprintCRUD = (projectId: string | null) => {
  const [loading, setLoading] = useState(false);
  const [sprints, setSprints] = useState<Sprint[]>([]);

  const validateSprintData = (data: SprintFormData): string | null => {
    if (!data.start_date?.trim()) return 'Data de início é obrigatória';
    if (!data.end_date?.trim()) return 'Data de fim é obrigatória';
    if (new Date(data.start_date) >= new Date(data.end_date)) {
      return 'Data de fim deve ser posterior à data de início';
    }
    return null;
  };

  const createSprint = useCallback(async (data: SprintFormData, selectedEvidences: string[] = []): Promise<Sprint | null> => {
    if (!projectId) {
      toast({ title: "Erro", description: "Projeto não selecionado", variant: "destructive" });
      return null;
    }

    const validationError = validateSprintData(data);
    if (validationError) {
      toast({ title: "Erro de validação", description: validationError, variant: "destructive" });
      return null;
    }

    setLoading(true);
    try {
      // Get current sprint count for numbering
      const { count } = await supabase
        .from('sprints')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      const sprintNumber = (count || 0) + 1;

      // Create sprint
      const { data: newSprint, error: sprintError } = await supabase
        .from('sprints')
        .insert({
          project_id: projectId,
          sprint_number: sprintNumber,
          week_start_date: data.start_date,
          week_end_date: data.end_date,
          status: data.status
        })
        .select()
        .single();

      if (sprintError) throw sprintError;

      // Create associated report
      const { data: user } = await supabase.auth.getUser();
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          project_id: projectId,
          sprint_id: newSprint.id,
          title: `Relatório Sprint ${sprints.length + 1}`,
          content_md: 'Relatório do sprint',
          created_by: user.user?.id
        })
        .select()
        .single();

      if (reportError) {
        console.warn('Erro ao criar relatório:', reportError);
      }

      // Associate evidences if any
      if (selectedEvidences.length > 0 && report) {
        const { error: evidenceError } = await supabase
          .from('evidences')
          .update({ report_id: report.id })
          .in('id', selectedEvidences);

        if (evidenceError) {
          console.warn('Erro ao associar evidências:', evidenceError);
        }
      }

      const createdSprint: Sprint = {
        ...newSprint,
        start_date: data.start_date,
        end_date: data.end_date,
        status: data.status,
        roadmap_item_id: data.roadmap_item_id || null,
        evidences: []
      };

      setSprints(prev => [...prev, createdSprint]);
      toast({ title: "Sucesso", description: "Sprint criado com sucesso!" });

      return createdSprint;
    } catch (error) {
      console.error('Erro ao criar sprint:', error);
      toast({ title: "Erro", description: "Erro ao criar sprint", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const updateSprint = useCallback(async (sprintId: string, data: SprintFormData, selectedEvidences: string[] = []): Promise<boolean> => {
    const validationError = validateSprintData(data);
    if (validationError) {
      toast({ title: "Erro de validação", description: validationError, variant: "destructive" });
      return false;
    }

    setLoading(true);
    try {
      // Update sprint
      const { error: sprintError } = await supabase
        .from('sprints')
        .update({
          week_start_date: data.start_date,
          week_end_date: data.end_date,
          status: data.status,
          roadmap_item_id: data.roadmap_item_id || null
        })
        .eq('id', sprintId);

      if (sprintError) throw sprintError;

      // Update associated report
      // Get sprint number for report title
      const { data: sprintData } = await supabase
        .from('sprints')
        .select('sprint_number')
        .eq('id', sprintId)
        .single();

      const { data: existingReport } = await supabase
        .from('reports')
        .select('id')
        .eq('sprint_id', sprintId)
        .single();

      if (existingReport) {
        const { error: reportError } = await supabase
          .from('reports')
          .update({
            title: `Relatório Sprint ${sprintData?.sprint_number || 'N/A'}`,
            content_md: 'Relatório do sprint'
          })
          .eq('id', existingReport.id);

        if (reportError) {
          console.warn('Erro ao atualizar relatório:', reportError);
        }

        // Update evidence associations
        if (selectedEvidences.length > 0) {
          const { error: evidenceError } = await supabase
            .from('evidences')
            .update({ report_id: existingReport.id })
            .in('id', selectedEvidences);

          if (evidenceError) {
            console.warn('Erro ao associar evidências:', evidenceError);
          }
        }
      }

      setSprints(prev => prev.map(sprint =>
        sprint.id === sprintId
          ? { ...sprint, ...data }
          : sprint
      ));

      toast({ title: "Sucesso", description: "Sprint atualizado com sucesso!" });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar sprint:', error);
      toast({ title: "Erro", description: "Erro ao atualizar sprint", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSprint = useCallback(async (sprintId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('sprints')
        .delete()
        .eq('id', sprintId);

      if (error) throw error;

      setSprints(prev => prev.filter(sprint => sprint.id !== sprintId));
      toast({ title: "Sucesso", description: "Sprint deletado com sucesso!" });
      return true;
    } catch (error) {
      console.error('Erro ao deletar sprint:', error);
      toast({ title: "Erro", description: "Erro ao deletar sprint", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSprints = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('project_id', projectId)
        .order('sprint_number');

      if (error) throw error;
      setSprints(
        (data || []).map(sprint => ({
          ...sprint,
          start_date: sprint.week_start_date ?? '',
          end_date: sprint.week_end_date ?? '',
          status: sprint.status ?? 'PLANNED'
        }))
      );
    } catch (error) {
      console.error('Erro ao carregar sprints:', error);
      toast({ title: "Erro", description: "Erro ao carregar sprints", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  return {
    sprints,
    loading,
    createSprint,
    updateSprint,
    deleteSprint,
    loadSprints,
    validateSprintData
  };
};
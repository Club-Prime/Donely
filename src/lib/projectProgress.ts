// Serviço para calcular e atualizar automaticamente o progresso dos projetos
import { supabase } from '../integrations/supabase/client';

export interface ProgressData {
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  notStartedItems: number;
  progressPercent: number;
}

export type ProjectStatus = 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'DONE';

export interface StatusSuggestion {
  current: ProjectStatus;
  suggested: ProjectStatus;
  shouldUpdate: boolean;
  reason: string;
}

export class ProjectProgressService {
  
  /**
   * Calcula o progresso baseado nos roadmap_items do projeto
   */
  static async calculateProgress(projectId: string): Promise<ProgressData> {
    console.log('📊 Calculando progresso para projeto:', projectId);
    
    try {
      const { data: roadmapItems, error } = await supabase
        .from('roadmap_items')
        .select('status')
        .eq('project_id', projectId);

      if (error) {
        console.error('❌ Erro ao buscar roadmap items:', error);
        throw error;
      }

      const items = roadmapItems || [];
      const totalItems = items.length;
      
      const completedItems = items.filter(item => item.status === 'DONE').length;
      const inProgressItems = items.filter(item => item.status === 'IN_PROGRESS').length;
      const notStartedItems = items.filter(item => item.status === 'NOT_STARTED').length;
      
      const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      const result: ProgressData = {
        totalItems,
        completedItems,
        inProgressItems,
        notStartedItems,
        progressPercent
      };

      console.log('✅ Progresso calculado:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Erro ao calcular progresso:', error);
      return {
        totalItems: 0,
        completedItems: 0,
        inProgressItems: 0,
        notStartedItems: 0,
        progressPercent: 0
      };
    }
  }

  /**
   * Sugere o status do projeto baseado no progresso e atividade
   */
  static async suggestProjectStatus(projectId: string): Promise<StatusSuggestion> {
    try {
      // Buscar status atual do projeto
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('status')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      const currentStatus = projectData.status as ProjectStatus;
      
      // Calcular progresso
      const progress = await this.calculateProgress(projectId);
      
      // Verificar atividade recente (reports nos últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: recentReports } = await supabase
        .from('reports')
        .select('id')
        .eq('project_id', projectId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .limit(1);

      const hasRecentActivity = (recentReports?.length || 0) > 0;

      // Lógica de sugestão
      let suggestedStatus: ProjectStatus = currentStatus;
      let reason = 'Status atual adequado';
      let shouldUpdate = false;

      if (progress.progressPercent === 100) {
        suggestedStatus = 'DONE';
        reason = 'Todos os itens do roadmap foram concluídos';
        shouldUpdate = currentStatus !== 'DONE';
      } else if (progress.inProgressItems > 0) {
        suggestedStatus = 'ACTIVE';
        reason = `${progress.inProgressItems} itens em andamento`;
        shouldUpdate = currentStatus === 'PLANNED';
      } else if (hasRecentActivity && progress.completedItems > 0) {
        suggestedStatus = 'ACTIVE';
        reason = 'Atividade recente detectada com progresso';
        shouldUpdate = currentStatus === 'PLANNED';
      } else if (progress.totalItems === 0) {
        suggestedStatus = 'PLANNED';
        reason = 'Projeto sem itens no roadmap';
        shouldUpdate = false;
      }

      return {
        current: currentStatus,
        suggested: suggestedStatus,
        shouldUpdate,
        reason
      };
      
    } catch (error) {
      console.error('❌ Erro ao sugerir status:', error);
      return {
        current: 'PLANNED',
        suggested: 'PLANNED',
        shouldUpdate: false,
        reason: 'Erro ao calcular sugestão'
      };
    }
  }

  /**
   * Atualiza o progresso do projeto no banco de dados
   */
  static async updateProjectProgress(projectId: string, progressPercent: number): Promise<boolean> {
    try {
      console.log('🔄 Atualizando progresso do projeto:', projectId, 'para', progressPercent + '%');
      
      const { error } = await supabase
        .from('projects')
        .update({ 
          progress_percent: progressPercent,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;

      console.log('✅ Progresso atualizado com sucesso');
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao atualizar progresso:', error);
      return false;
    }
  }

  /**
   * Atualiza o status do projeto no banco de dados
   */
  static async updateProjectStatus(projectId: string, status: ProjectStatus): Promise<boolean> {
    try {
      console.log('🔄 Atualizando status do projeto:', projectId, 'para', status);
      
      const { error } = await supabase
        .from('projects')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;

      console.log('✅ Status atualizado com sucesso');
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      return false;
    }
  }

  /**
   * Sincroniza automaticamente progresso e status do projeto
   */
  static async syncProjectData(projectId: string): Promise<{
    progress: ProgressData;
    status: ProjectStatus;
    updated: boolean;
  }> {
    console.log('🔄 Sincronizando dados do projeto:', projectId);
    
    try {
      // Calcular novo progresso
      const progress = await this.calculateProgress(projectId);
      
      // Sugerir novo status
      const statusSuggestion = await this.suggestProjectStatus(projectId);
      
      let updated = false;
      
      // Atualizar progresso
      const progressUpdated = await this.updateProjectProgress(projectId, progress.progressPercent);
      
      // Atualizar status se necessário
      let statusUpdated = false;
      if (statusSuggestion.shouldUpdate) {
        statusUpdated = await this.updateProjectStatus(projectId, statusSuggestion.suggested);
      }
      
      updated = progressUpdated || statusUpdated;
      
      console.log('✅ Sincronização concluída. Updated:', updated);
      
      return {
        progress,
        status: statusSuggestion.shouldUpdate ? statusSuggestion.suggested : statusSuggestion.current,
        updated
      };
      
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      throw error;
    }
  }
}
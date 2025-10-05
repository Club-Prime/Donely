import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ReportFormData {
  title: string;
  content_md: string;
  type: 'weekly' | 'monthly' | 'sprint' | 'final';
}

export interface Evidence {
  id: string;
  storage_key: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  url?: string;
  thumbnail_url?: string;
  report_id?: string;
}

export const useReportCRUD = (projectId: string | null) => {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);

  const validateReportData = (data: ReportFormData): string | null => {
    if (!data.title?.trim()) return 'Título é obrigatório';
    if (!data.content_md?.trim()) return 'Conteúdo é obrigatório';
    return null;
  };

  const createReport = useCallback(async (data: ReportFormData, sprintId?: string): Promise<any | null> => {
    if (!projectId) {
      toast({ title: "Erro", description: "Projeto não selecionado", variant: "destructive" });
      return null;
    }

    const validationError = validateReportData(data);
    if (validationError) {
      toast({ title: "Erro de validação", description: validationError, variant: "destructive" });
      return null;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data: newReport, error } = await supabase
        .from('reports')
        .insert({
          project_id: projectId,
          sprint_id: sprintId || null,
          title: data.title,
          content_md: data.content_md,
          type: data.type,
          created_by: user.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setReports(prev => [...prev, newReport]);
      toast({ title: "Sucesso", description: "Relatório criado com sucesso!" });

      return newReport;
    } catch (error) {
      console.error('Erro ao criar relatório:', error);
      toast({ title: "Erro", description: "Erro ao criar relatório", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const updateReport = useCallback(async (reportId: string, data: ReportFormData): Promise<boolean> => {
    const validationError = validateReportData(data);
    if (validationError) {
      toast({ title: "Erro de validação", description: validationError, variant: "destructive" });
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          title: data.title,
          content_md: data.content_md,
          type: data.type
        })
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev => prev.map(report =>
        report.id === reportId
          ? { ...report, ...data }
          : report
      ));

      toast({ title: "Sucesso", description: "Relatório atualizado com sucesso!" });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar relatório:', error);
      toast({ title: "Erro", description: "Erro ao atualizar relatório", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteReport = useCallback(async (reportId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev => prev.filter(report => report.id !== reportId));
      toast({ title: "Sucesso", description: "Relatório deletado com sucesso!" });
      return true;
    } catch (error) {
      console.error('Erro ao deletar relatório:', error);
      toast({ title: "Erro", description: "Erro ao deletar relatório", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadEvidence = useCallback(async (file: File, reportId?: string): Promise<Evidence | null> => {
    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `evidences/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('evidences')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: uploadData } = supabase.storage
        .from('evidences')
        .getPublicUrl(filePath);

      const { data: user } = await supabase.auth.getUser();
      const allowedType = file.type.startsWith('image/') ? 'IMAGE' : file.type.startsWith('video/') ? 'VIDEO' : undefined;
      if (!allowedType) throw new Error('Tipo de arquivo não suportado. Apenas imagens e vídeos são permitidos.');
      const { data: newEvidence, error: dbError } = await supabase
        .from('evidences')
        .insert({
          storage_key: filePath,
          type: allowedType,
          report_id: reportId || null,
          uploaded_by: user.user?.id,
          url: uploadData.publicUrl
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Generate signed URL
      const { data: urlData } = await supabase.storage
        .from('evidences')
        .createSignedUrl(filePath, 3600);

      const evidenceWithUrl = {
        ...newEvidence,
        url: urlData?.signedUrl
      };

      setEvidences(prev => [...prev, evidenceWithUrl]);
      toast({ title: "Sucesso", description: "Evidência enviada com sucesso!" });

      return evidenceWithUrl;
    } catch (error) {
      console.error('Erro ao enviar evidência:', error);
      toast({ title: "Erro", description: "Erro ao enviar evidência", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReports = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast({ title: "Erro", description: "Erro ao carregar relatórios", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadEvidences = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('evidences')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Generate signed URLs for evidences
      const evidencesWithUrls = await Promise.all(
        (data || []).map(async (evidence) => {
          try {
            const { data: urlData } = await supabase.storage
              .from('evidences')
              .createSignedUrl(evidence.storage_key, 3600);

            return {
              ...evidence,
              url: urlData?.signedUrl
            };
          } catch (urlError) {
            console.warn('Erro ao gerar URL para evidência:', evidence.id, urlError);
            return evidence;
          }
        })
      );

      setEvidences(evidencesWithUrls);
    } catch (error) {
      console.error('Erro ao carregar evidências:', error);
      toast({ title: "Erro", description: "Erro ao carregar evidências", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  return {
    reports,
    evidences,
    loading,
    createReport,
    updateReport,
    deleteReport,
    uploadEvidence,
    loadReports,
    loadEvidences,
    validateReportData
  };
};
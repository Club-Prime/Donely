import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar } from 'lucide-react';

interface ReportsViewProps {
  projectId: string;
  reportId?: string;
}

interface Report {
  id: string;
  title: string;
  content: string;
  created_at: string;
  status: string;
  sprint_id?: string | null;
}

export const ReportsView = ({ projectId, reportId }: ReportsViewProps) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      let query = supabase.from('reports').select('*').eq('project_id', projectId);
      if (reportId) query = query.eq('id', reportId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data) {
        setReports(
          data.map((r: any) => ({
            id: r.id,
            title: r.title,
            content: r.content_md || r.content || '',
            created_at: r.created_at,
            status: r.is_published ? 'Publicado' : (r.status || 'Rascunho'),
            sprint_id: r.sprint_id ?? null,
          }))
        );
      }
      setLoading(false);
    })();
  }, [projectId, reportId]);

  if (loading) return <div className="p-4 text-gray-400">Carregando relatórios...</div>;
  if (!reports.length) return <div className="p-4 text-gray-400">Nenhum relatório encontrado.</div>;

  return (
    <div className="space-y-6">
      {reports.map((report) => (
        <Card key={report.id} className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">{report.title}</CardTitle>
              <Badge variant="outline" className="ml-2 text-xs">{report.status}</Badge>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3" />
              {new Date(report.created_at).toLocaleDateString('pt-BR')}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none text-sm mt-2 whitespace-pre-line">
              {report.content || 'Sem conteúdo.'}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

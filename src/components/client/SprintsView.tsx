import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle2, Circle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Sprint {
  id: string;
  sprint_number: number;
  week_start_date: string;
  week_end_date: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'DONE';
  planned_scope: any;
  actual_delivered?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
  project_id: string;
}

interface SprintsViewProps {
  projectId: string;
}

export const SprintsView = ({ projectId }: SprintsViewProps) => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportsBySprint, setReportsBySprint] = useState<Record<string, Report[]>>({});
  const [selectedReport, setSelectedReport] = useState<DetailedReport | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  interface Report {
    id: string;
    title: string;
    created_at: string;
    sprint_id: string | null;
    is_published: boolean;
    version?: number | null;
  }

  interface DetailedReport extends Report {
    content_md: string | null;
    published_at: string | null;
    sprints?: { sprint_number: number } | null;
  }

  useEffect(() => {
    const fetchSprints = async () => {
      try {
        const { data, error } = await supabase
          .from('sprints')
          .select('*')
          .eq('project_id', projectId)
          .order('sprint_number', { ascending: false });

        if (error) throw error;
        setSprints(data || []);
      } catch (error) {
        console.error('Erro ao buscar sprints:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('id,title,created_at,sprint_id,is_published,version')
          .eq('project_id', projectId)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const grouped = (data || []).reduce((acc: Record<string, Report[]>, report: Report) => {
          const key = report.sprint_id || 'unassigned';
          if (!acc[key]) acc[key] = [];
          acc[key].push(report);
          return acc;
        }, {} as Record<string, Report[]>);

        setReportsBySprint(grouped);
      } catch (error) {
        console.error('Erro ao buscar relatórios publicados:', error);
      }
    };

    // Disparar buscas em paralelo
    fetchSprints();
    fetchReports();
  }, [projectId]);

  const openReport = async (reportId: string) => {
    try {
      setReportLoading(true);
      setReportError(null);
      const { data, error } = await supabase
        .from('reports')
        .select('id,title,content_md,version,created_at,published_at,sprint_id,is_published,sprints(sprint_number)')
        .eq('id', reportId)
        .single();

      if (error) throw error;
      setSelectedReport(data as unknown as DetailedReport);
      setReportModalOpen(true);
    } catch (err: any) {
      console.error('Erro ao carregar relatório:', err);
      setReportError(err?.message || 'Não foi possível carregar o relatório');
    } finally {
      setReportLoading(false);
    }
  };

  const getStatusBadge = (status: Sprint['status']) => {
    switch (status) {
      case 'DONE':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Concluída</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-500 hover:bg-blue-600"><Clock className="w-3 h-3 mr-1" />Em Progresso</Badge>;
      case 'PLANNED':
        return <Badge variant="outline"><Circle className="w-3 h-3 mr-1" />Planejada</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Sprints do Projeto</h3>
        <p className="text-muted-foreground">
          Acompanhe o progresso semanal e as entregas de cada sprint.
        </p>
      </div>

      {sprints.length === 0 ? (
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-8 text-center">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">Nenhuma sprint criada ainda</h4>
            <p className="text-muted-foreground text-sm">
              As sprints aparecerão aqui conforme o desenvolvimento do projeto avançar.
            </p>
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
                  {getStatusBadge(sprint.status)}
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

                {/* Relatórios publicados vinculados à sprint */}
                <div>
                  <h5 className="font-medium mb-2">Relatórios desta sprint:</h5>
                  {reportsBySprint[sprint.id] && reportsBySprint[sprint.id].length > 0 ? (
                    <ul className="space-y-2">
                      {reportsBySprint[sprint.id].map((report) => (
                        <li key={report.id} className="flex items-center justify-between bg-muted/40 rounded-md px-3 py-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <button
                              type="button"
                              className="text-sm font-medium text-primary hover:underline"
                              onClick={() => openReport(report.id)}
                            >
                              {report.title}
                            </button>
                            {report.version != null && (
                              <Badge variant="outline" className="text-xs">v{report.version}</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(report.created_at), 'dd MMM yyyy', { locale: ptBR })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum relatório publicado nesta sprint ainda.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {reportsBySprint['unassigned'] && reportsBySprint['unassigned'].length > 0 && (
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Relatórios sem sprint
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Relatórios publicados que ainda não foram vinculados a nenhuma sprint.
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {reportsBySprint['unassigned'].map((report) => (
                    <li key={report.id} className="flex items-center justify-between bg-muted/40 rounded-md px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <button
                          type="button"
                          className="text-sm font-medium text-primary hover:underline"
                          onClick={() => openReport(report.id)}
                        >
                          {report.title}
                        </button>
                        {report.version != null && (
                          <Badge variant="outline" className="text-xs">v{report.version}</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(report.created_at), 'dd MMM yyyy', { locale: ptBR })}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Report Details Modal */}
      <Dialog open={reportModalOpen} onOpenChange={(open) => { if (!open) setReportModalOpen(false); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {reportLoading ? 'Carregando…' : selectedReport?.title || 'Relatório'}
            </DialogTitle>
            <DialogDescription>
              {selectedReport && (
                <div className="text-xs text-muted-foreground space-x-2">
                  <span>Publicado: {selectedReport.published_at ? format(new Date(selectedReport.published_at), 'dd MMM yyyy', { locale: ptBR }) : '-'}</span>
                  <span>•</span>
                  <span>Criado: {format(new Date(selectedReport.created_at), 'dd MMM yyyy', { locale: ptBR })}</span>
                  {selectedReport.version != null && (
                    <>
                      <span>•</span>
                      <span>v{selectedReport.version}</span>
                    </>
                  )}
                  {selectedReport.sprints?.sprint_number != null && (
                    <>
                      <span>•</span>
                      <span>Sprint {selectedReport.sprints.sprint_number}</span>
                    </>
                  )}
                </div>
              )}
              {reportError && <span className="text-destructive">{reportError}</span>}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            {reportLoading ? (
              <div className="h-32 bg-muted animate-pulse rounded" />
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-foreground/90">
                {selectedReport?.content_md || 'Sem conteúdo.'}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
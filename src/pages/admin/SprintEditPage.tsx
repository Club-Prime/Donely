import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PlayCircle, User, FolderOpen, MapPin, FileText, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SprintsView } from '@/components/client/SprintsView';

const SprintEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sprint, setSprint] = useState<any>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [allSprints, setAllSprints] = useState<any[]>([]);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [plannedTasks, setPlannedTasks] = useState<string[]>(['']);
  const [actualDelivered, setActualDelivered] = useState<string[]>(['']);
  const [projects, setProjects] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [client, setClient] = useState<any>(null);

  // Determinar se estamos no modo criação
  const isNew = !id || id === 'new';

  useEffect(() => {
    if (isNew) {
      // Modo criação - buscar todos os projetos disponíveis
      setLoading(true);
      (async () => {
        const { data: projectsData, error } = await supabase
          .from('projects')
          .select('id, name, client_display_name')
          .order('name');
        
        if (error) {
          setError('Erro ao carregar projetos.');
        } else {
          setProjects(projectsData || []);
        }
        setLoading(false);
      })();
      return;
    }

    // Modo edição - buscar sprint existente
    setLoading(true);
    (async () => {
      console.log('🔍 Loading sprint for edit, id:', id);
      const { data, error } = await supabase.from('sprints').select('*').eq('id', id).single();
      console.log('🔍 Sprint data:', data);
      console.log('🔍 Sprint error:', error);

      if (error) {
        setError('Sprint não encontrada.');
        console.error('❌ Error loading sprint:', error);
      } else {
        setSprint(data);
        setProjectId(data.project_id);
        // Carregar tarefas planejadas e entregues do planned_scope JSONB
        const plannedScopeData = data.planned_scope as any;
        const plannedTasksData = plannedScopeData?.tasks || [''];
        const actualDeliveredData = plannedScopeData?.deliveries || [''];

        console.log('🔍 Setting planned tasks:', plannedTasksData);
        console.log('🔍 Setting actual delivered:', actualDeliveredData);

        setPlannedTasks(plannedTasksData);
        setActualDelivered(actualDeliveredData);
      }
      setLoading(false);
    })();
  }, [id, isNew]);

  // Inicializar sprint quando projeto é selecionado no modo criação
  useEffect(() => {
    if (isNew && projectId && !sprint) {
      setSprint({
        sprint_number: '',
        week_start_date: '',
        week_end_date: '',
        status: 'PLANNED',
        planned_scope: null,
        actual_delivered: null
      });
      setPlannedTasks(['']);
      setActualDelivered(['']);
    }
  }, [isNew, projectId, sprint]);

  // Buscar todos os sprints, roadmap, projeto, cliente, relatórios para hierarquia
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      const [{ data: sprintsData }, { data: roadmapData }, { data: projectData }, { data: reportsData }] = await Promise.all([
        supabase.from('sprints').select('id, sprint_number').eq('project_id', projectId).order('sprint_number', { ascending: true }),
        supabase.from('roadmap_items').select('id, title').eq('project_id', projectId).order('order_index', { ascending: true }),
        supabase.from('projects').select('id, name, client_display_name').eq('id', projectId).single(),
        supabase.from('reports').select('id, title').eq('project_id', projectId).order('created_at', { ascending: true })
      ]);
      setAllSprints(sprintsData || []);
      setRoadmap(roadmapData?.[0] || null);
      setProject(projectData || null);
      setReports(reportsData || []);
      // Buscar cliente se houver
      if (projectData?.client_display_name) {
        const { data: clientData } = await supabase.from('profiles').select('id, name').ilike('name', `%${projectData.client_display_name}%`).maybeSingle();
        setClient(clientData || null);
      }
    })();
  }, [projectId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!sprint) return;
    setSprint({ ...sprint, [e.target.name]: e.target.value });
  };

  const handleStatusChange = (value: string) => {
    if (!sprint) return;
    setSprint({ ...sprint, status: value });
  };

  const updatePlannedTask = (index: number, value: string) => {
    const newTasks = [...plannedTasks];
    newTasks[index] = value;
    setPlannedTasks(newTasks);
  };

  const addPlannedTask = () => {
    setPlannedTasks([...plannedTasks, '']);
  };

  const removePlannedTask = (index: number) => {
    if (plannedTasks.length > 1) {
      setPlannedTasks(plannedTasks.filter((_, i) => i !== index));
    }
  };

  const updateActualDelivered = (index: number, value: string) => {
    const newDeliveries = [...actualDelivered];
    newDeliveries[index] = value;
    setActualDelivered(newDeliveries);
  };

  const addActualDelivered = () => {
    setActualDelivered([...actualDelivered, '']);
  };

  const removeActualDelivered = (index: number) => {
    if (actualDelivered.length > 1) {
      setActualDelivered(actualDelivered.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!sprint || !projectId) return;
    
    setSaving(true);
    setError(null);

    try {
      if (isNew) {
        // Preparar dados para criação - armazenar tudo no planned_scope
        const plannedScope = {
          tasks: plannedTasks.filter(task => task.trim() !== ''),
          deliveries: actualDelivered.filter(delivery => delivery.trim() !== '')
        };

        // Criar nova sprint
        const { data, error } = await supabase
          .from('sprints')
          .insert([{
            project_id: projectId,
            sprint_number: sprint.sprint_number,
            week_start_date: sprint.week_start_date,
            week_end_date: sprint.week_end_date,
            status: sprint.status || 'PLANNED',
            planned_scope: plannedScope
          }])
          .select()
          .single();

        if (error) throw error;
        
        // Redirecionar para a edição da sprint recém-criada
        navigate(`/admin/sprints/${data.id}/edit`);
      } else {
        // Preparar dados para atualização - armazenar tudo no planned_scope
        const plannedScope = {
          tasks: plannedTasks.filter(task => task.trim() !== ''),
          deliveries: actualDelivered.filter(delivery => delivery.trim() !== '')
        };

        console.log('🔄 Updating sprint with data:', {
          sprint_number: sprint.sprint_number,
          week_start_date: sprint.week_start_date,
          week_end_date: sprint.week_end_date,
          status: sprint.status,
          planned_scope: plannedScope
        });

        // Atualizar sprint existente
        const { error } = await supabase
          .from('sprints')
          .update({
            sprint_number: sprint.sprint_number,
            week_start_date: sprint.week_start_date,
            week_end_date: sprint.week_end_date,
            status: sprint.status,
            planned_scope: plannedScope
          })
          .eq('id', id);

        console.log('🔄 Update result error:', error);

        if (error) throw error;
      }
    } catch (error: any) {
      setError(`Erro ao ${isNew ? 'criar' : 'salvar'} sprint: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-200 bg-gray-900 min-h-screen">Carregando...</div>;
  if (error) return <div className="p-8 text-red-400 bg-gray-900 min-h-screen">{error}</div>;
  
  // Modo criação: mostrar seletor de projeto primeiro
  if (isNew && !projectId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 py-10">
        <div className="max-w-[1800px] mx-auto px-2 mb-4">
          <button
            onClick={() => navigate('/admin/sprints')}
            className="flex items-center gap-2 text-gray-300 hover:text-primary transition mb-2"
          >
            <ArrowLeft className="w-5 h-5" /> Voltar para Sprints
          </button>
        </div>
        <div className="max-w-2xl mx-auto">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Criar Nova Sprint
              </CardTitle>
              <CardDescription>
                Selecione o projeto para o qual deseja criar uma nova sprint.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Projeto</label>
                <Select onValueChange={(value) => setProjectId(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((proj) => (
                      <SelectItem key={proj.id} value={proj.id}>
                        {proj.name} - {proj.client_display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={() => navigate('/admin/sprints')}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (!sprint || (isNew && !projectId)) return <div className="p-8 text-gray-200 bg-gray-900 min-h-screen">{isNew ? 'Carregando...' : 'Sprint não encontrada.'}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 py-10">
      <div className="max-w-[1800px] mx-auto px-2 mb-4">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-300 hover:text-primary transition mb-2"
        >
          <ArrowLeft className="w-5 h-5" /> Voltar para o Dashboard
        </button>
      </div>
      <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row gap-8">
        {/* Sidebar hierárquica menor */}
        <aside className="hidden md:flex flex-col gap-4 w-56 p-4 bg-gray-800 rounded-xl border border-gray-700 shadow-lg min-h-[600px] text-sm">
          <div className="mb-2">
            <span className="text-xs text-gray-400">Hierarquia</span>
          </div>
          {client && (
            <a href={`/admin/clients/${client.id}/edit`} className="flex items-center gap-2 text-blue-300 hover:underline">
              <User className="w-4 h-4" /> Cliente: {client.name}
            </a>
          )}
          {project && (
            <a href={`/admin/projects/${project.id}/edit`} className="flex items-center gap-2 text-purple-300 hover:underline">
              <FolderOpen className="w-4 h-4" /> Projeto: {project.name}
            </a>
          )}
          {roadmap && (
            <a href={`/admin/roadmaps/${roadmap.id}/edit`} className="flex items-center gap-2 text-pink-300 hover:underline">
              <MapPin className="w-4 h-4" /> Roadmap: {roadmap.title}
            </a>
          )}
          <div className="flex items-center gap-2 text-green-300 mt-2">
            <PlayCircle className="w-4 h-4" /> Sprint
          </div>
          <div className="pl-4 border-l-2 border-green-700 ml-2">
            <label className="block text-xs font-medium mb-1 text-gray-400">Selecionar outra Sprint</label>
            <Select value={sprint.id} onValueChange={val => window.location.href = `/admin/sprints/${val}/edit`}>
              <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-gray-100">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {allSprints.map(sp => (
                  <SelectItem key={sp.id} value={sp.id}>Sprint {sp.sprint_number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {reports.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-2 text-red-300"><FileText className="w-4 h-4" /> Relatórios</div>
              <ul className="pl-4 border-l-2 border-red-700 ml-2 mt-1 space-y-1">
                {reports.map(r => (
                  <li key={r.id}>
                    <a href={`/admin/reports/${r.id}/edit`} className="hover:underline text-red-200">{r.title}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
        {/* Formulário e preview maiores */}
        <main className="flex-1 flex flex-col md:flex-row gap-8">
          <section className="flex-[1.5] bg-gray-900 rounded-xl border border-gray-700 shadow-lg p-12 min-w-[500px]">
            <h1 className="text-2xl font-bold mb-6 text-green-200 flex items-center gap-2"><PlayCircle className="w-6 h-6" /> Editar Sprint</h1>
            <form className="space-y-5" onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Número</label>
                <input name="sprint_number" type="number" value={sprint.sprint_number || ''} onChange={handleChange} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100" required />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 text-gray-300">Data início</label>
                  <input type="date" name="week_start_date" value={sprint.week_start_date ? sprint.week_start_date.substring(0,10) : ''} onChange={handleChange} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 text-gray-300">Data fim</label>
                  <input type="date" name="week_end_date" value={sprint.week_end_date ? sprint.week_end_date.substring(0,10) : ''} onChange={handleChange} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Status</label>
                <Select value={sprint.status || ''} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="PLANNED" className="text-gray-100 hover:bg-gray-700">Planejado</SelectItem>
                    <SelectItem value="IN_PROGRESS" className="text-gray-100 hover:bg-gray-700">Em andamento</SelectItem>
                    <SelectItem value="DONE" className="text-gray-100 hover:bg-gray-700">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Escopo Planejado</label>
                <div className="space-y-2">
                  {plannedTasks.map((task, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={task}
                        onChange={(e) => updatePlannedTask(index, e.target.value)}
                        placeholder="Tarefa planejada"
                        className="flex-1 rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100"
                      />
                      {plannedTasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePlannedTask(index)}
                          className="p-2 rounded bg-red-700 hover:bg-red-800 text-white transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addPlannedTask}
                    className="flex items-center gap-2 px-3 py-2 rounded bg-blue-700 hover:bg-blue-800 text-white font-semibold transition"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Tarefa
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Tarefas Entregues</label>
                <div className="space-y-2">
                  {actualDelivered.map((delivery, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={delivery}
                        onChange={(e) => updateActualDelivered(index, e.target.value)}
                        placeholder="Tarefa entregue"
                        className="flex-1 rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100"
                      />
                      {actualDelivered.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeActualDelivered(index)}
                          className="p-2 rounded bg-red-700 hover:bg-red-800 text-white transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addActualDelivered}
                    className="flex items-center gap-2 px-3 py-2 rounded bg-blue-700 hover:bg-blue-800 text-white font-semibold transition"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Entrega
                  </button>
                </div>
              </div>
              {error && <div className="text-red-400 text-sm">{error}</div>}
              <button type="submit" className="w-full py-2 rounded bg-green-700 hover:bg-green-800 text-white font-semibold transition" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            </form>
          </section>
          {/* Preview do cliente: SprintsView filtrado */}
          <section className="flex-[2.2] bg-gray-950 rounded-xl border border-gray-800 shadow-lg p-12 flex flex-col items-center justify-center min-w-[700px]">
            <h2 className="text-lg font-semibold text-gray-300 mb-4">Preview do Cliente</h2>
            {projectId && <SprintsView projectId={projectId} />}
          </section>
        </main>
      </div>
    </div>
  );
};

export default SprintEditPage;

import React, { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, User, FolderOpen, PlayCircle, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RoadmapView } from '@/components/client/RoadmapView';

const RoadmapEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [allRoadmaps, setAllRoadmaps] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [sprints, setSprints] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);

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

    // Modo edição - buscar roadmap existente
    setLoading(true);
    (async () => {
      const { data, error } = await supabase.from('roadmap_items').select('*').eq('id', id).single();
      if (error) setError('Roadmap não encontrado.');
      else {
        setRoadmap(data);
        setProjectId(data.project_id);
      }
      setLoading(false);
    })();
  }, [id, isNew]);

  // Inicializar roadmap quando projeto é selecionado no modo criação
  useEffect(() => {
    if (isNew && projectId && !roadmap) {
      setRoadmap({
        title: '',
        description: '',
        effort: 1,
        status: 'NOT_STARTED',
        start_date: '',
        end_date: ''
      });
    }
  }, [isNew, projectId, roadmap]);
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      const [{ data: roadmaps }, { data: projectData }, { data: sprintsData }, { data: reportsData }] = await Promise.all([
        supabase.from('roadmap_items').select('id, title').eq('project_id', projectId).order('order_index', { ascending: true }),
        supabase.from('projects').select('id, name, client_display_name').eq('id', projectId).single(),
        supabase.from('sprints').select('id, sprint_number').eq('project_id', projectId).order('sprint_number', { ascending: true }),
        supabase.from('reports').select('id, title').eq('project_id', projectId).order('created_at', { ascending: true })
      ]);
      setAllRoadmaps(roadmaps || []);
      setProject(projectData || null);
      setSprints(sprintsData || []);
      setReports(reportsData || []);
      // Buscar cliente se houver
      if (projectData?.client_display_name) {
        const { data: clientData } = await supabase.from('profiles').select('id, name').ilike('name', `%${projectData.client_display_name}%`).maybeSingle();
        setClient(clientData || null);
      }
    })();
  }, [projectId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!roadmap) return;
    setRoadmap({ ...roadmap, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!roadmap || !projectId) return;
    
    setSaving(true);
    setError(null);

    try {
      if (isNew) {
        // Criar novo roadmap item
        const { data, error } = await supabase
          .from('roadmap_items')
          .insert([{
            title: roadmap.title,
            description: roadmap.description,
            effort: roadmap.effort || 1,
            status: roadmap.status || 'NOT_STARTED',
            start_date: roadmap.start_date,
            end_date: roadmap.end_date,
            project_id: projectId,
            order_index: 0, // Será ajustado depois
            dependency_ids: []
          }])
          .select()
          .single();

        if (error) throw error;
        
        // Redirecionar para a edição do roadmap recém-criado
        navigate(`/admin/roadmaps/${data.id}/edit`);
      } else {
        // Atualizar roadmap existente
        const { error } = await supabase
          .from('roadmap_items')
          .update({
            title: roadmap.title,
            description: roadmap.description,
            effort: roadmap.effort,
            start_date: roadmap.start_date,
            end_date: roadmap.end_date,
            status: roadmap.status
          })
          .eq('id', id);
        
        if (error) throw error;
      }
    } catch (error: any) {
      setError(`Erro ao ${isNew ? 'criar' : 'salvar'} roadmap: ${error.message}`);
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
            onClick={() => navigate('/admin/roadmaps')}
            className="flex items-center gap-2 text-gray-300 hover:text-primary transition mb-2"
          >
            <ArrowLeft className="w-5 h-5" /> Voltar para Roadmaps
          </button>
        </div>
        <div className="max-w-2xl mx-auto">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Criar Novo Roadmap Item
              </CardTitle>
              <CardDescription>
                Selecione o projeto para o qual deseja criar um novo item do roadmap.
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
                  onClick={() => navigate('/admin/roadmaps')}
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
  
  if (!roadmap) return <div className="p-8 text-gray-200 bg-gray-900 min-h-screen">{isNew ? 'Carregando...' : 'Roadmap não encontrado.'}</div>;

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
          <div className="flex items-center gap-2 text-pink-300 mt-2">
            <MapPin className="w-4 h-4" /> Roadmap
          </div>
          {!isNew && allRoadmaps.length > 0 && (
            <div className="pl-4 border-l-2 border-pink-700 ml-2">
              <label className="block text-xs font-medium mb-1 text-gray-400">Selecionar outro Roadmap</label>
              <Select value={roadmap?.id} onValueChange={val => window.location.href = `/admin/roadmaps/${val}/edit`}>
                <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-gray-100">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {allRoadmaps.map(rm => (
                    <SelectItem key={rm.id} value={rm.id}>{rm.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {sprints.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-2 text-green-300"><PlayCircle className="w-4 h-4" /> Sprints</div>
              <ul className="pl-4 border-l-2 border-green-700 ml-2 mt-1 space-y-1">
                {sprints.map(s => (
                  <li key={s.id}>
                    <a href={`/admin/sprints/${s.id}/edit`} className="hover:underline text-green-200">Sprint {s.sprint_number}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
            <h1 className="text-2xl font-bold mb-6 text-pink-200 flex items-center gap-2"><MapPin className="w-6 h-6" /> Editar Roadmap</h1>
            <form className="space-y-5" onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Título</label>
                <input name="title" value={roadmap.title || ''} onChange={handleChange} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-600" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Descrição</label>
                <textarea name="description" value={roadmap.description || ''} onChange={handleChange} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-pink-600" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 text-gray-300">Esforço</label>
                  <input type="number" name="effort" value={roadmap.effort || 0} onChange={handleChange} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 text-gray-300">Status</label>
                  <Select value={roadmap.status || ''} onValueChange={(value) => handleChange({ target: { name: 'status', value } })}>
                    <SelectTrigger className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="NOT_STARTED" className="text-gray-100 hover:bg-gray-700">Não iniciado</SelectItem>
                      <SelectItem value="IN_PROGRESS" className="text-gray-100 hover:bg-gray-700">Em andamento</SelectItem>
                      <SelectItem value="DONE" className="text-gray-100 hover:bg-gray-700">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 text-gray-300">Data início</label>
                  <input type="date" name="start_date" value={roadmap.start_date ? roadmap.start_date.substring(0,10) : ''} onChange={handleChange} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 text-gray-300">Data fim</label>
                  <input type="date" name="end_date" value={roadmap.end_date ? roadmap.end_date.substring(0,10) : ''} onChange={handleChange} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100" />
                </div>
              </div>
              {error && <div className="text-red-400 text-sm">{error}</div>}
              <button type="submit" className="w-full py-2 rounded bg-pink-700 hover:bg-pink-800 text-white font-semibold transition" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            </form>
          </section>
          {/* Preview do cliente: RoadmapView */}
          <section className="flex-[2.2] bg-gray-950 rounded-xl border border-gray-800 shadow-lg p-12 flex flex-col items-center justify-center min-w-[700px]">
            <h2 className="text-lg font-semibold text-gray-300 mb-4">Preview do Cliente</h2>
            {projectId && <RoadmapView projectId={projectId} />}
          </section>
        </main>
      </div>
    </div>
  );
};

export default RoadmapEditPage;

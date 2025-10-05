import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BadgeCheck, User, FolderOpen, MapPin, PlayCircle, FileText, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { EvidenciasView } from '@/components/client/EvidenciasView';

const EvidenceEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<any>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [allEvidences, setAllEvidences] = useState<any[]>([]);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [sprints, setSprints] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      // Busca evidência e projectId via report
      const { data: evidenceData, error } = await supabase.from('evidences').select('*').eq('id', id).single();
      if (error || !evidenceData) {
        setError('Evidência não encontrada.');
        setLoading(false);
        return;
      }
      setEvidence(evidenceData);
      // Buscar report para pegar project_id
      if (evidenceData.report_id) {
        const { data: reportData } = await supabase.from('reports').select('project_id').eq('id', evidenceData.report_id).single();
        setProjectId(reportData?.project_id || null);
      } else {
        setProjectId(null);
      }
      setLoading(false);
    })();
  }, [id]);

  // Buscar todas as evidências, roadmap, projeto, cliente, sprints, reports para hierarquia
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      const [{ data: evidencesData }, { data: roadmapData }, { data: projectData }, { data: sprintsData }, { data: reportsData }] = await Promise.all([
        (supabase.from('evidences') as any).select('id, name').eq('project_id', projectId).order('created_at', { ascending: true }),
        supabase.from('roadmap_items').select('id, title').eq('project_id', projectId).order('order_index', { ascending: true }),
        supabase.from('projects').select('id, name, client_display_name').eq('id', projectId).single(),
        supabase.from('sprints').select('id, sprint_number').eq('project_id', projectId).order('sprint_number', { ascending: true }),
        supabase.from('reports').select('id, title').eq('project_id', projectId).order('created_at', { ascending: true })
      ]);
      setAllEvidences(evidencesData || []);
      setRoadmap(roadmapData?.[0] || null);
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
    if (!evidence) return;
    setEvidence({ ...evidence, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const { error } = await supabase.from('evidences').update({
      name: evidence.name,
      description: evidence.description,
      url: evidence.url,
      type: evidence.type,
      status: evidence.status
    }).eq('id', id);
    if (error) setError('Erro ao salvar alterações.');
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-gray-200 bg-gray-900 min-h-screen">Carregando...</div>;
  if (error) return <div className="p-8 text-red-400 bg-gray-900 min-h-screen">{error}</div>;
  if (!evidence) return <div className="p-8 text-gray-200 bg-gray-900 min-h-screen">Evidência não encontrada.</div>;

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
          {sprints.length > 0 && (
            <div className="flex items-center gap-2 text-green-300 mt-2"><PlayCircle className="w-4 h-4" /> Sprints</div>
          )}
          {sprints.length > 0 && (
            <ul className="pl-4 border-l-2 border-green-700 ml-2 mt-1 space-y-1">
              {sprints.map(sp => (
                <li key={sp.id}>
                  <a href={`/admin/sprints/${sp.id}/edit`} className="hover:underline text-green-200">Sprint {sp.sprint_number}</a>
                </li>
              ))}
            </ul>
          )}
          {reports.length > 0 && (
            <div className="flex items-center gap-2 text-red-300 mt-2"><FileText className="w-4 h-4" /> Relatórios</div>
          )}
          {reports.length > 0 && (
            <ul className="pl-4 border-l-2 border-red-700 ml-2 mt-1 space-y-1">
              {reports.map(r => (
                <li key={r.id}>
                  <a href={`/admin/reports/${r.id}/edit`} className="hover:underline text-red-200">{r.title}</a>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-2 text-yellow-300 mt-2">
            <BadgeCheck className="w-4 h-4" /> Evidência
          </div>
          <div className="pl-4 border-l-2 border-yellow-700 ml-2">
            <label className="block text-xs font-medium mb-1 text-gray-400">Selecionar outra Evidência</label>
            <Select value={evidence.id} onValueChange={val => window.location.href = `/admin/evidences/${val}/edit`}>
              <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-gray-100">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {allEvidences.map(ev => (
                  <SelectItem key={ev.id} value={ev.id}>{ev.name || `Evidência ${ev.id}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </aside>
        {/* Formulário e preview maiores */}
        <main className="flex-1 flex flex-col md:flex-row gap-8">
          <section className="flex-[1.5] bg-gray-900 rounded-xl border border-gray-700 shadow-lg p-12 min-w-[500px]">
            <h1 className="text-2xl font-bold mb-6 text-yellow-200 flex items-center gap-2"><BadgeCheck className="w-6 h-6" /> Editar Evidência</h1>
            <form className="space-y-5" onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Nome</label>
                <input name="name" value={evidence.name || ''} onChange={handleChange} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Descrição</label>
                <textarea name="description" value={evidence.description || ''} onChange={handleChange} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100 min-h-[80px]" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">URL</label>
                <input name="url" value={evidence.url || ''} onChange={handleChange} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Tipo</label>
                <input name="type" value={evidence.type || ''} onChange={handleChange} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Status</label>
                <input name="status" value={evidence.status || ''} onChange={handleChange} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100" />
              </div>
              {error && <div className="text-red-400 text-sm">{error}</div>}
              <button type="submit" className="w-full py-2 rounded bg-yellow-700 hover:bg-yellow-800 text-white font-semibold transition" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            </form>
          </section>
          {/* Preview do cliente: EvidenciasView filtrando só a evidência em edição */}
          <section className="flex-[2.2] bg-gray-950 rounded-xl border border-gray-800 shadow-lg p-12 flex flex-col items-center justify-center min-w-[700px]">
            <h2 className="text-lg font-semibold text-gray-300 mb-4">Preview do Cliente</h2>
            {projectId && (
              <div className="w-full">
                <EvidenciasView projectId={projectId} />
                <style>{`
                  /* Esconde todas as evidências exceto a atual */
                  [data-evidence-id] { display: none; }
                  [data-evidence-id='${evidence.id}'] { display: block; }
                `}</style>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default EvidenceEditPage;

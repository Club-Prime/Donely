import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FolderOpen, User, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RoadmapView } from '@/components/client/RoadmapView';


const ProjectEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      // Buscar projeto atual
      const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
      if (error) setError('Projeto não encontrado.');
      else setProject(data);
      setLoading(false);
    })();
  }, [id]);

  // Buscar todos os projetos e clientes para navegação
  useEffect(() => {
    (async () => {
      const [{ data: projectsData }, { data: clientsData }] = await Promise.all([
        supabase.from('projects').select('id, name, client_display_name').order('name'),
        supabase.from('profiles').select('id, name').eq('role', 'CLIENT')
      ]);
      setAllProjects(projectsData || []);
      setClients(clientsData || []);
    })();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!project) return;
    setProject({ ...project, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const { error } = await supabase.from('projects').update({
      name: project.name,
      description: project.description,
      status: project.status,
      client_display_name: project.client_display_name,
      start_date: project.start_date,
      end_date_target: project.end_date_target
    }).eq('id', id);
    if (error) setError('Erro ao salvar alterações.');
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-gray-200 bg-gray-900 min-h-screen">Carregando...</div>;
  if (error) return <div className="p-8 text-red-400 bg-gray-900 min-h-screen">{error}</div>;
  if (!project) return <div className="p-8 text-gray-200 bg-gray-900 min-h-screen">Projeto não encontrado.</div>;

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
        {/* Sidebar hierárquica: Clientes > Projetos */}
        <aside className="hidden md:flex flex-col gap-4 w-56 p-4 bg-gray-800 rounded-xl border border-gray-700 shadow-lg min-h-[600px] text-sm">
          <div className="mb-2">
            <span className="text-xs text-gray-400">Clientes</span>
          </div>
          {clients.map(client => (
            <div key={client.id}>
              <div className="flex items-center gap-2 text-blue-300">
                <User className="w-4 h-4" /> {client.name}
              </div>
              <ul className="pl-4 border-l-2 border-blue-700 ml-2 mt-1 space-y-1">
                {allProjects.filter(p => p.client_display_name === client.name).map(p => (
                  <li key={p.id}>
                    <a
                      href={`/admin/projects/${p.id}/edit`}
                      className={`hover:underline text-purple-200 ${p.id === id ? 'font-bold underline' : ''}`}
                    >
                      {p.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>
        {/* Formulário e preview maiores */}
        <main className="flex-1 flex flex-col md:flex-row gap-8">
          <section className="flex-[1.5] bg-gray-900 rounded-xl border border-gray-700 shadow-lg p-12 min-w-[500px]">
            <h1 className="text-2xl font-bold mb-6 text-purple-200 flex items-center gap-2"><FolderOpen className="w-6 h-6" /> Editar Projeto</h1>
            <form className="space-y-5" onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Nome</label>
                <input name="name" value={project.name || ''} onChange={handleChange} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-600" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Descrição</label>
                <textarea name="description" value={project.description || ''} onChange={handleChange} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-purple-600" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 text-gray-300">Status</label>
                  <input name="status" value={project.status || ''} onChange={handleChange} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 text-gray-300">Cliente</label>
                  <input name="client_display_name" value={project.client_display_name || ''} onChange={handleChange} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100" />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 text-gray-300">Data início</label>
                  <input type="date" name="start_date" value={project.start_date ? project.start_date.substring(0,10) : ''} onChange={handleChange} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 text-gray-300">Data fim</label>
                  <input type="date" name="end_date_target" value={project.end_date_target ? project.end_date_target.substring(0,10) : ''} onChange={handleChange} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100" />
                </div>
              </div>
              {error && <div className="text-red-400 text-sm">{error}</div>}
              <button type="submit" className="w-full py-2 rounded bg-purple-700 hover:bg-purple-800 text-white font-semibold transition" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            </form>
          </section>
          {/* Preview do cliente: RoadmapView do projeto */}
          <section className="flex-[2.2] bg-gray-950 rounded-xl border border-gray-800 shadow-lg p-12 flex flex-col items-center justify-center min-w-[700px]">
            <h2 className="text-lg font-semibold text-gray-300 mb-4">Preview do Cliente</h2>
            {project.id && <RoadmapView projectId={project.id} />}
          </section>
        </main>
      </div>
    </div>
  );
};

export default ProjectEditPage;

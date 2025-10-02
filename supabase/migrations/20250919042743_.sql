-- Create sample project data with generated UUIDs

-- Insert sample project (using fixed UUID)
INSERT INTO public.projects (id, name, slug, description, client_display_name, status, progress_percent, start_date, end_date_target) 
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Sistema de Gestão Empresarial', 
  'sistema-gestao-empresarial',
  'Desenvolvimento de sistema completo para gestão de processos empresariais com módulos de vendas, estoque e relatórios.',
  'Empresa Demo Ltda',
  'ACTIVE',
  35,
  '2024-01-15',
  '2024-06-30'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample roadmap items (using generated UUIDs but with ON CONFLICT)
INSERT INTO public.roadmap_items (project_id, title, description, status, effort, order_index, start_date, end_date) 
SELECT 
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  title,
  description,
  status::roadmap_status,
  effort,
  order_index,
  start_date::date,
  end_date::date
FROM (VALUES 
  ('Análise e Levantamento de Requisitos', 'Definição completa dos requisitos funcionais e não funcionais do sistema.', 'DONE', 3, 1, '2024-01-15', '2024-01-29'),
  ('Desenvolvimento do Módulo de Autenticação', 'Implementação do sistema de login, cadastro e controle de acesso.', 'DONE', 5, 2, '2024-01-30', '2024-02-19'),
  ('Dashboard Administrativo', 'Criação do painel de controle para administradores do sistema.', 'IN_PROGRESS', 4, 3, '2024-02-20', '2024-03-15'),
  ('Módulo de Vendas', 'Sistema completo de gestão de vendas, pedidos e clientes.', 'NOT_STARTED', 6, 4, '2024-03-16', '2024-04-30'),
  ('Integração com APIs Externas', 'Conectores para sistemas de pagamento e serviços de terceiros.', 'NOT_STARTED', 4, 5, '2024-05-01', '2024-05-31')
) AS v(title, description, status, effort, order_index, start_date, end_date)
WHERE NOT EXISTS (
  SELECT 1 FROM public.roadmap_items r WHERE r.project_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' AND r.title = v.title
);

-- Insert sample sprints
INSERT INTO public.sprints (project_id, sprint_number, week_start_date, week_end_date, status, planned_scope)
SELECT 
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  sprint_number,
  week_start_date::date,
  week_end_date::date,
  status::sprint_status,
  planned_scope::jsonb
FROM (VALUES 
  (1, '2024-01-15', '2024-01-21', 'DONE', '{"tasks": ["Setup inicial do projeto", "Configuração do ambiente"], "goals": "Preparar infraestrutura base"}'),
  (2, '2024-01-22', '2024-01-28', 'DONE', '{"tasks": ["Análise de requisitos", "Documentação técnica"], "goals": "Definir escopo detalhado"}'),
  (3, '2024-02-26', '2024-03-03', 'IN_PROGRESS', '{"tasks": ["Dashboard admin - componentes base", "Implementar autenticação"], "goals": "Finalizar módulo administrativo"}')
) AS v(sprint_number, week_start_date, week_end_date, status, planned_scope)
WHERE NOT EXISTS (
  SELECT 1 FROM public.sprints s WHERE s.project_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' AND s.sprint_number = v.sprint_number
);

-- Create helper functions for user setup
CREATE OR REPLACE FUNCTION public.setup_admin_user(_user_id uuid, _email text, _name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update admin profile
  INSERT INTO public.profiles (user_id, name, email, username, role)
  VALUES (_user_id, _name, _email, 'admin', 'ADMIN')
  ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = 'ADMIN',
    is_active = true;
  
  -- Log the admin creation
  INSERT INTO public.audit_logs (entity, action, entity_id, after_data)
  VALUES (
    'profiles',
    'ADMIN_SETUP',
    _user_id,
    jsonb_build_object(
      'user_id', _user_id,
      'email', _email,
      'name', _name,
      'role', 'ADMIN'
    )
  );
END;
$$;

-- Create function for demo client setup
CREATE OR REPLACE FUNCTION public.setup_demo_client(_user_id uuid, _email text, _name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update client profile
  INSERT INTO public.profiles (user_id, name, email, username, role)
  VALUES (_user_id, _name, _email, SPLIT_PART(_email, '@', 1), 'CLIENT')
  ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = 'CLIENT',
    is_active = true;
  
  -- Give access to demo project
  INSERT INTO public.client_project_access (user_id, project_id, is_active)
  VALUES (_user_id, 'f47ac10b-58cc-4372-a567-0e02b2c3d479', true)
  ON CONFLICT (user_id, project_id) DO UPDATE SET
    is_active = true;
  
  -- Log the client setup
  INSERT INTO public.audit_logs (entity, action, entity_id, after_data)
  VALUES (
    'profiles',
    'CLIENT_SETUP',
    _user_id,
    jsonb_build_object(
      'user_id', _user_id,
      'email', _email,
      'name', _name,
      'role', 'CLIENT',
      'project_id', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    )
  );
END;
$$;;

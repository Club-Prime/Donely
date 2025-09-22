-- Create sample project data and admin setup (FIXED UUIDs)

-- Insert sample project
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

-- Insert sample roadmap items
INSERT INTO public.roadmap_items (id, project_id, title, description, status, effort, order_index, start_date, end_date) VALUES
(
  'a1b2c3d4-e5f6-4890-1234-567890abcdef',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Análise e Levantamento de Requisitos',
  'Definição completa dos requisitos funcionais e não funcionais do sistema.',
  'DONE',
  3,
  1,
  '2024-01-15',
  '2024-01-29'
),
(
  'b2c3d4e5-a6b7-4901-2345-678901bcdefab',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Desenvolvimento do Módulo de Autenticação',
  'Implementação do sistema de login, cadastro e controle de acesso.',
  'DONE',
  5,
  2,
  '2024-01-30',
  '2024-02-19'
),
(
  'c3d4e5f6-b7c8-4012-3456-789012cdefab',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Dashboard Administrativo',
  'Criação do painel de controle para administradores do sistema.',
  'IN_PROGRESS',
  4,
  3,
  '2024-02-20',
  '2024-03-15'
),
(
  'd4e5f6a7-c8d9-4123-4567-890123defabc',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Módulo de Vendas',
  'Sistema completo de gestão de vendas, pedidos e clientes.',
  'NOT_STARTED',
  6,
  4,
  '2024-03-16',
  '2024-04-30'
),
(
  'e5f6a7b8-d9e0-4234-5678-901234efabcd',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Integração com APIs Externas',
  'Conectores para sistemas de pagamento e serviços de terceiros.',
  'NOT_STARTED',
  4,
  5,
  '2024-05-01',
  '2024-05-31'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample sprints
INSERT INTO public.sprints (id, project_id, sprint_number, week_start_date, week_end_date, status, planned_scope) VALUES
(
  '11111111-2222-4333-8444-555555555555',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  1,
  '2024-01-15',
  '2024-01-21',
  'DONE',
  '{"tasks": ["Setup inicial do projeto", "Configuração do ambiente"], "goals": "Preparar infraestrutura base"}'::jsonb
),
(
  '22222222-3333-4444-8555-666666666666',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  2,
  '2024-01-22',
  '2024-01-28',
  'DONE',
  '{"tasks": ["Análise de requisitos", "Documentação técnica"], "goals": "Definir escopo detalhado"}'::jsonb
),
(
  '33333333-4444-4555-8666-777777777777',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  3,
  '2024-02-26',
  '2024-03-03',
  'IN_PROGRESS',
  '{"tasks": ["Dashboard admin - componentes base", "Implementar autenticação"], "goals": "Finalizar módulo administrativo"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

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
$$;
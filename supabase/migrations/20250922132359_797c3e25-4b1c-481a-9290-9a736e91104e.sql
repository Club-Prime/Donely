-- Criar sprints de exemplo para facilitar a criação de relatórios

-- Primeiro, vamos garantir que temos pelo menos um projeto demo
INSERT INTO public.projects (id, name, slug, description, status, progress_percent)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'Projeto Demo',
  'projeto-demo',
  'Projeto de demonstração para testes do sistema',
  'ACTIVE',
  25
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  progress_percent = EXCLUDED.progress_percent;

-- Criar sprints de exemplo para o projeto demo
INSERT INTO public.sprints (id, project_id, sprint_number, week_start_date, week_end_date, status, planned_scope)
VALUES 
  (
    gen_random_uuid(),
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
    1,
    '2025-01-06',
    '2025-01-12',
    'DONE',
    '{"tasks": ["Setup inicial", "Configuração do projeto", "Primeiro MVP"]}'::jsonb
  ),
  (
    gen_random_uuid(),
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
    2,
    '2025-01-13',
    '2025-01-19',
    'IN_PROGRESS',
    '{"tasks": ["Desenvolvimento de funcionalidades", "Testes unitários", "Documentação"]}'::jsonb
  ),
  (
    gen_random_uuid(),
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
    3,
    '2025-01-20',
    '2025-01-26',
    'PLANNED',
    '{"tasks": ["Integração com APIs", "Testes de integração", "Deploy"]}'::jsonb
  )
ON CONFLICT DO NOTHING;
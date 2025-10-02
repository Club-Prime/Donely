# Guia de Deploy – Donely (DigitalOcean ## 4) DigitalOcean App Platform – Deploy

### Opção A: Via App Spec (recomendado)
1. Use o arquivo `.do/app.yaml` incluído no projeto:
   ```bash
   # Via doctl CLI
   doctl apps create --spec .do/app.yaml
   
   # Ou atualize app existente
   doctl apps update <APP_ID> --spec .do/app.yaml
   ```

2. Ajuste as variáveis no App Spec se necessário:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

### Opção B: Via Console Web
1. No painel do DigitalOcean: Create → Apps → GitHub → selecione o repositório
2. Configure como **Static Site** (não Web Service):
   - **Type**: Static Site
   - **Source Directory**: / (root)
   - **Build Command**: `npm ci && npm run build`
   - **Output Directory**: `dist`
3. Environment Variables (scope BUILD_TIME):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. **Routes**: O DigitalOcean configura automaticamente SPA routing

### Considerações importantes
- Use **Static Site** em vez de Web Service para melhor performance
- As variáveis `VITE_*` devem ter scope `BUILD_TIME` para serem incluídas no bundle
- O SPA routing é configurado automaticamente pelo DigitalOcean para static sites
- Build produz arquivos em `dist/` que são servidos diretamente
- Redeploys automáticos funcionam via webhook do GitHub)

Este documento descreve os passos para levar o Donely para produção usando DigitalOcean App Platform para o frontend e Supabase (Auth, DB, Storage e Edge Functions) no backend.

## 1) Pré-requisitos
- Conta no DigitalOcean, com acesso ao App Platform
- Repositório Git do projeto (GitHub/GitLab)
- Projeto Supabase provisionado
- Node.js 20+ (para builds)
- (Opcional) doctl CLI para deploy automatizado

## 2) Variáveis de Ambiente
As variáveis usadas no frontend (Vite) devem começar com `VITE_`.

Obrigatórias (Frontend):
- `VITE_SUPABASE_URL` → URL do seu projeto Supabase (ex.: https://XYZ.supabase.co)
- `VITE_SUPABASE_PUBLISHABLE_KEY` → Chave pública (anon) do Supabase

Somente em ambiente de servidor (NUNCA no cliente):
- `SUPABASE_SERVICE_ROLE_KEY` → Chave service_role (apenas para funções/server). Não exponha ao navegador.

Observações importantes:
- O arquivo `.env` está ignorado no Git por padrão (`.gitignore`). Configure as variáveis no App Spec ou painel do DigitalOcean.
- O arquivo `src/integrations/supabase/client.ts` já foi ajustado para ler `import.meta.env.VITE_*`.
- As variáveis `VITE_*` devem ter scope `BUILD_TIME` no DigitalOcean para serem incluídas no bundle.

## 3) Supabase – Configuração
1. Migrações: aplique as migrações do diretório `supabase/migrations` no seu projeto Supabase. Você pode usar a CLI do Supabase ou aplicar SQLs diretamente pelo painel.
2. Auth → URL de redirecionamento: adicione a URL de produção (e pré-visualização) em Authentication → URL Configuration
   - Exemplo: https://seuapp.vercel.app
   - E a URL de preview: https://seuapp-git-branch-user.vercel.app (ou apenas o domínio principal com wildcard, se aplicável)
3. Storage: garanta que o bucket para evidências exista e que as policies/cors estejam corretas (ver migração `20250922_create_storage_bucket_evidences.sql`).
4. Policies (RLS): confira que as tabelas possuem permissões adequadas para `anon`/`authenticated` e que operações administrativas não ficam expostas via cliente.

### Edge Functions (operações privilegiadas)
- Configure a CLI: `supabase login` e `supabase link --project-ref <id>`
- Defina secrets das funções: `supabase secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...`
- Faça deploy: `supabase functions deploy update-password health-check`
- O frontend invoca via `supabase.functions.invoke('update-password', ...)` com Bearer token do usuário ADMIN.

## 4) Render – Deploy (Static Site)
1. Conecte o repositório na Render e crie um serviço do tipo Static Site.
2. Configure em “Build & Deploy”:
   - Build Command: `npm ci && npm run build`
   - Publish Directory: `dist`
3. Em “Environment”, configure:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Regras de SPA (rewrites): adicione uma regra `/* -> /index.html` (Action: Rewrite). Se usar blueprint, o arquivo `render.yaml` já contém essa regra.
5. Faça “Clear build cache & deploy” para forçar rebuild com as envs corretas.

## 5) Operações administrativas (service_role)
Nunca utilize a `service_role` no navegador. Para ações privilegiadas (alteração de senha, etc.):
- Utilize Supabase Edge Functions com validação de role (ADMIN) e secrets configurados nas funções.
- O frontend chama essas funções com o token do usuário autenticado.

## 6) Validações pós-deploy
- Login e logout (clientes/admin)
- Acesso a páginas protegidas e redirecionamentos
- Listagens (projetos, sprints, evidências)
- Upload e acesso ao Storage
- Policies (403 esperado quando não autorizado)

## 7) Troubleshooting

### Problemas comuns no DigitalOcean
- **Build failed**: Verifique se as envs `VITE_*` têm scope `BUILD_TIME`
- **App crash ao iniciar**: Confirme que `$PORT` está sendo usado no run command
- **404 em rotas SPA**: O Vite preview server já trata SPA routing automaticamente
- **Variáveis não definidas**: Use `BUILD_TIME` scope para envs que afetam o bundle

### Problemas gerais
- **401/403**: Verifique `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` e RLS policies
- **Upload falha**: Valide bucket, CORS e permissões de Storage  
- **Tela branca**: Falta das envs `VITE_*` durante build ou erro no bundle

### Comandos úteis DigitalOcean
```bash
# Listar apps
doctl apps list

# Ver logs da app
doctl apps logs <APP_ID> --follow

# Redeploy forçado
doctl apps create-deployment <APP_ID>

# Ver spec atual
doctl apps get <APP_ID> --format yaml
```

## 8) Scripts úteis
- Desenvolvimento: `npm run dev`
- Build: `npm run build`
- Preview local do build: `npm run preview`

## 9) Observações de segurança
- Nunca commitar `.env` com chaves reais
- Não expor `service_role` no cliente
- Revise regularmente RLS e as rotas/funcões privilegiadas

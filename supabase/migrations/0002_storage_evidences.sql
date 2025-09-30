-- 0002_storage_evidences.sql
-- Cria bucket e policies para evidences
--
-- IMPORTANTE: Este script precisa ser executado como Owner no Supabase SQL Editor
-- (botão "Run as owner"). Alterações na tabela storage.objects e criação de
-- policies no schema storage exigem privilégio de owner; caso contrário você verá
-- o erro: 42501: must be owner of table objects.

-- Bucket idempotente
insert into storage.buckets (id, name, public)
values ('evidences', 'evidences', true)
on conflict (id) do nothing;

-- RLS no storage.objects
alter table storage.objects enable row level security;

-- Leitura pública
drop policy if exists "Public can read evidences objects" on storage.objects;
create policy "Public can read evidences objects"
on storage.objects
for select
to public
using (bucket_id = 'evidences');

-- Admins podem gerenciar
drop policy if exists "Admins can manage evidences objects" on storage.objects;
create policy "Admins can manage evidences objects"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'evidences' and exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'ADMIN'
  )
)
with check (
  bucket_id = 'evidences' and exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'ADMIN'
  )
);

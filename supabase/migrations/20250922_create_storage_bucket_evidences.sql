-- Create storage bucket for evidences and policies
-- Note: Requires supabase/storage extension enabled in your project

-- Create bucket if not exists
insert into storage.buckets (id, name, public)
values ('evidences', 'evidences', true)
on conflict (id) do nothing;

-- Ensure RLS is enabled (idempotent)
alter table storage.objects enable row level security;

-- Allow public read on objects in evidences bucket
drop policy if exists "Public can read evidences objects" on storage.objects;
create policy "Public can read evidences objects"
on storage.objects
for select
to public
using (bucket_id = 'evidences');

-- Allow admins to upload/update/delete in evidences bucket
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

-- Optionally, allow service role or authenticated users with admin role to insert
-- If you want to restrict inserts to any authenticated user, change the policy accordingly.

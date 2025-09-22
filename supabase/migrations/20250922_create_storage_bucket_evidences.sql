-- Create storage bucket for evidences and policies
-- Note: Requires supabase/storage extension enabled in your project

-- Create bucket if not exists
insert into storage.buckets (id, name, public)
values ('evidences', 'evidences', true)
on conflict (id) do nothing;

-- Allow public read on objects in evidences bucket
create policy if not exists "Public can read evidences objects"
  on storage.objects for select
  using (bucket_id = 'evidences');

-- Allow admins to upload/delete in evidences bucket
create policy if not exists "Admins can manage evidences objects"
  on storage.objects for all
  using (
    bucket_id = 'evidences' and (
      exists (
        select 1 from public.profiles p
        where p.user_id = auth.uid() and p.role = 'ADMIN'
      )
    )
  );

-- Optionally, allow service role or authenticated users with admin role to insert
-- If you want to restrict inserts to any authenticated user, change the policy accordingly.

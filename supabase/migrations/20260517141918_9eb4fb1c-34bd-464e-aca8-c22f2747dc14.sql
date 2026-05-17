insert into storage.buckets (id, name, public) values ('weekly-uploads', 'weekly-uploads', false) on conflict (id) do nothing;

create policy "Authenticated users can upload to own folder"
on storage.objects for insert to authenticated
with check (bucket_id = 'weekly-uploads' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Authenticated users can read own uploads"
on storage.objects for select to authenticated
using (bucket_id = 'weekly-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
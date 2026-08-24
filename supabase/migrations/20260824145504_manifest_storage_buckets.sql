-- Buckets públicos para audios y portadas del panel de Música (Manifiesta)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('manifest-audio', 'manifest-audio', true, 52428800, array['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/m4a','audio/mp4','audio/aac','audio/ogg']),
  ('manifest-covers', 'manifest-covers', true, 8388608, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Lectura pública (streaming/portadas visibles sin login)
drop policy if exists "public read manifest audio" on storage.objects;
create policy "public read manifest audio" on storage.objects
  for select to public
  using (bucket_id in ('manifest-audio', 'manifest-covers'));

-- Escritura sólo para administradores autenticados
drop policy if exists "admin insert manifest audio" on storage.objects;
create policy "admin insert manifest audio" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('manifest-audio', 'manifest-covers') and public.has_role(auth.uid(), 'admin'));

drop policy if exists "admin update manifest audio" on storage.objects;
create policy "admin update manifest audio" on storage.objects
  for update to authenticated
  using (bucket_id in ('manifest-audio', 'manifest-covers') and public.has_role(auth.uid(), 'admin'));

drop policy if exists "admin delete manifest audio" on storage.objects;
create policy "admin delete manifest audio" on storage.objects
  for delete to authenticated
  using (bucket_id in ('manifest-audio', 'manifest-covers') and public.has_role(auth.uid(), 'admin'));

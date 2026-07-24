
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS photo_url text;

CREATE POLICY "own family photos read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'family-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own family photos insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'family-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own family photos update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'family-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own family photos delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'family-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

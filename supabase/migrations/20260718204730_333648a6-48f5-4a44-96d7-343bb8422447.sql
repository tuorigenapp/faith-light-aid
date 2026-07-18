
CREATE POLICY "auth read manifest audios" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'manifest-audios');
CREATE POLICY "admin insert manifest audios" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'manifest-audios' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update manifest audios" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'manifest-audios' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete manifest audios" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'manifest-audios' AND public.has_role(auth.uid(), 'admin'));

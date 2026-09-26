CREATE POLICY "receipts own read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-receipts' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "receipts own insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "covers read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'content-covers');
CREATE POLICY "covers admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'content-covers' AND public.has_role(auth.uid(), 'admin'));
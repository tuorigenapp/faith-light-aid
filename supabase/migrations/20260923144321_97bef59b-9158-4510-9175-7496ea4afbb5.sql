DROP POLICY "community own media read" ON storage.objects;
CREATE POLICY "community uploaders read own files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='community-media' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE UNIQUE INDEX community_one_bot_topic_per_day ON public.community_posts(topic, ((created_at AT TIME ZONE 'UTC')::date)) WHERE is_bot;
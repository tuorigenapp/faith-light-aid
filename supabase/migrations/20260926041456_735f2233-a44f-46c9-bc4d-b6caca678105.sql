DROP POLICY IF EXISTS "read audios by plan" ON public.manifest_audios;
CREATE POLICY "read audios by plan" ON public.manifest_audios FOR SELECT TO authenticated
USING (
  manifest_audios.day_index <= 3
  OR EXISTS (
    SELECT 1 FROM public.manifest_categories c
    WHERE c.id = manifest_audios.category_id
      AND (c.required_plan = 'explorador'
        OR EXISTS (SELECT 1 FROM public.subscriptions s
          WHERE s.user_id = auth.uid() AND s.status = ANY (ARRAY['active','trialing'])
            AND s.plan = ANY (ARRAY['camino','annual','monthly','premium'])))
  )
);
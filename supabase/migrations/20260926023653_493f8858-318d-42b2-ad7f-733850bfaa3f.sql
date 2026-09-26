CREATE TABLE public.content_overrides (
  key text PRIMARY KEY,
  scope text NOT NULL,
  title text,
  cover_url text,
  is_hidden boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.content_overrides TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.content_overrides TO authenticated;
GRANT ALL ON public.content_overrides TO service_role;
ALTER TABLE public.content_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "overrides read" ON public.content_overrides FOR SELECT USING (true);
CREATE POLICY "overrides admin write" ON public.content_overrides FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.custom_caminos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text,
  notes text,
  cover_url text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_published boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.custom_caminos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.custom_caminos TO authenticated;
GRANT ALL ON public.custom_caminos TO service_role;
ALTER TABLE public.custom_caminos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "caminos read published" ON public.custom_caminos FOR SELECT
  USING (is_published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "caminos admin write" ON public.custom_caminos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
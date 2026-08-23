ALTER TABLE public.library_items ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.library_items ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS library_items_slug_key ON public.library_items (slug) WHERE slug IS NOT NULL;

ALTER TABLE public.manifest_categories ADD COLUMN IF NOT EXISTS group_key text NOT NULL DEFAULT 'abundancia';
ALTER TABLE public.manifest_categories ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE public.manifest_categories ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.manifest_categories ADD COLUMN IF NOT EXISTS pdf_url text;
ALTER TABLE public.manifest_categories ADD COLUMN IF NOT EXISTS required_plan text NOT NULL DEFAULT 'explorador';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS excluded_from_metrics boolean NOT NULL DEFAULT false;

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'marketing';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'soporte';

DROP POLICY IF EXISTS "admins update profiles" ON public.profiles;
CREATE POLICY "admins update profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;
CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins read activity" ON public.daily_activity;
CREATE POLICY "admins read activity" ON public.daily_activity
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
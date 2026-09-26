CREATE TABLE public.promo_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  link_url text,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promo_campaigns TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.promo_campaigns TO authenticated;
GRANT ALL ON public.promo_campaigns TO service_role;
ALTER TABLE public.promo_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed users read active campaigns" ON public.promo_campaigns FOR SELECT TO authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage campaigns" ON public.promo_campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER promo_campaigns_touch BEFORE UPDATE ON public.promo_campaigns FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.manifest_categories ADD COLUMN IF NOT EXISTS audio_only boolean NOT NULL DEFAULT false;
ALTER TABLE public.manifest_categories ADD COLUMN IF NOT EXISTS is_custom boolean NOT NULL DEFAULT false;
ALTER TABLE public.manifest_audios ADD COLUMN IF NOT EXISTS audio_only boolean NOT NULL DEFAULT false;

ALTER TABLE public.content_overrides DROP CONSTRAINT IF EXISTS content_overrides_scope_check;
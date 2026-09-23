CREATE TABLE public.community_settings (key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.community_settings TO service_role;
ALTER TABLE public.community_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.community_settings (key, value) VALUES ('auto_reply', 'true'::jsonb) ON CONFLICT DO NOTHING;
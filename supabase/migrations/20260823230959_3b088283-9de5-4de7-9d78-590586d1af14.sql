ALTER TABLE public.library_items ADD COLUMN IF NOT EXISTS external_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS library_items_external_key_key ON public.library_items(external_key) WHERE external_key IS NOT NULL;

ALTER TABLE public.manifest_categories ADD COLUMN IF NOT EXISTS program_group TEXT NOT NULL DEFAULT 'abundancia';
ALTER TABLE public.manifest_categories ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.manifest_categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.manifest_categories ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.manifest_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.manifest_audios ADD COLUMN IF NOT EXISTS lesson TEXT;
ALTER TABLE public.manifest_audios ADD COLUMN IF NOT EXISTS exercise TEXT;
ALTER TABLE public.manifest_audios ADD COLUMN IF NOT EXISTS quiz JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.manifest_audios ADD COLUMN IF NOT EXISTS word_game JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.manifest_audios ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.manifest_audios ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.manifest_audios ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
UPDATE public.manifest_categories SET program_group='abundancia' WHERE id IN ('dinero','pareja','casa','negocio','trabajo','proposito','abundancia','libre');
INSERT INTO public.manifest_categories (id,title,subtitle,program_group,affirmation_ya_tengo,identity_yo_soy,gratitude_gracias,petition,sort_order) VALUES
('limpieza','Limpieza Espiritual','Programa guiado de 21 días','visualiza','','','','',20),
('identidad','Salto de Identidad','Programa guiado de 21 días','visualiza','','','','',21),
('cristo','Método de Cristo 3·6·9','Programa guiado de 21 días','visualiza','','','','',22),
('nino-interior','Sanar a tu niño o niña interior','Programa guiado de 21 días','programas','','','','',30),
('glowup-mujer','Glow Up: Mujer de alto valor','Programa guiado de 21 días','programas','','','','',31),
('glowup-hombre','Glow Up: Hombre de alto valor','Programa guiado de 21 días','programas','','','','',32),
('magnetico','Vuélvete magnético o magnética','Programa guiado de 21 días','programas','','','','',33),
('permiso-mujer','Deja de pedir permiso para existir (Mujer)','Programa guiado de 21 días','programas','','','','',34),
('permiso-hombre','Deja de pedir permiso para existir (Hombre)','Programa guiado de 21 días','programas','','','','',35)
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, program_group=EXCLUDED.program_group, sort_order=EXCLUDED.sort_order;
INSERT INTO public.manifest_audios (category_id,day_index,title,affirmation,lesson,exercise)
SELECT c.id,d.day,'Día '||d.day||' — '||c.title,'Hoy avanzo con fe, claridad y constancia.','Práctica guiada y coherente con '||c.title||'.','Escribe una acción concreta que aplicarás hoy.'
FROM public.manifest_categories c CROSS JOIN generate_series(1,21) d(day)
WHERE c.id IN ('limpieza','identidad','cristo','nino-interior','glowup-mujer','glowup-hombre','magnetico','permiso-mujer','permiso-hombre')
ON CONFLICT (category_id,day_index) DO NOTHING;

CREATE TABLE public.marketing_lists (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, description TEXT, filter_type TEXT NOT NULL DEFAULT 'custom', created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_lists TO authenticated;
GRANT ALL ON public.marketing_lists TO service_role;
ALTER TABLE public.marketing_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin marketing lists" ON public.marketing_lists FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'marketing')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'marketing'));

CREATE TABLE public.marketing_list_members (
 list_id UUID NOT NULL REFERENCES public.marketing_lists(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(list_id,user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_list_members TO authenticated;
GRANT ALL ON public.marketing_list_members TO service_role;
ALTER TABLE public.marketing_list_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin marketing members" ON public.marketing_list_members FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'marketing')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'marketing'));

CREATE TABLE public.marketing_campaigns (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, channel TEXT NOT NULL CHECK(channel IN ('email','push')), subject TEXT, content TEXT NOT NULL, image_url TEXT, button_text TEXT, button_url TEXT, audience_type TEXT NOT NULL DEFAULT 'all', list_id UUID REFERENCES public.marketing_lists(id) ON DELETE SET NULL, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','scheduled','sending','sent','cancelled')), scheduled_at TIMESTAMPTZ, ends_at TIMESTAMPTZ, sent_count INTEGER NOT NULL DEFAULT 0, click_count INTEGER NOT NULL DEFAULT 0, created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaigns TO authenticated;
GRANT ALL ON public.marketing_campaigns TO service_role;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin marketing campaigns" ON public.marketing_campaigns FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'marketing')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'marketing'));

CREATE TABLE public.marketing_events (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE, user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, event_type TEXT NOT NULL CHECK(event_type IN ('sent','delivered','opened','clicked','failed')), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.marketing_events TO authenticated;
GRANT ALL ON public.marketing_events TO service_role;
ALTER TABLE public.marketing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin marketing events" ON public.marketing_events FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'marketing')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'marketing'));
CREATE INDEX marketing_campaigns_scheduled_idx ON public.marketing_campaigns(status,scheduled_at);
CREATE INDEX marketing_events_campaign_idx ON public.marketing_events(campaign_id,event_type,created_at);
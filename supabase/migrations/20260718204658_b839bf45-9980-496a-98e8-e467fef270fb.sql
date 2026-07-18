
CREATE TABLE public.intake_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stage INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'in_progress',
  genealogy JSONB DEFAULT '{}'::jsonb,
  childhood JSONB DEFAULT '{}'::jsonb,
  ai_summary TEXT,
  ai_plan JSONB,
  primary_focus TEXT,
  closure_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.intake_sessions TO authenticated;
GRANT ALL ON public.intake_sessions TO service_role;
ALTER TABLE public.intake_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own intake" ON public.intake_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER touch_intake BEFORE UPDATE ON public.intake_sessions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.manifest_categories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  color TEXT,
  affirmation_ya_tengo TEXT NOT NULL,
  identity_yo_soy TEXT NOT NULL,
  gratitude_gracias TEXT NOT NULL,
  petition TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.manifest_categories TO anon, authenticated;
GRANT ALL ON public.manifest_categories TO service_role;
ALTER TABLE public.manifest_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read categories" ON public.manifest_categories FOR SELECT USING (true);
CREATE POLICY "admin manage cats" ON public.manifest_categories FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.manifest_audios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL REFERENCES public.manifest_categories(id) ON DELETE CASCADE,
  day_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  affirmation TEXT NOT NULL,
  audio_url TEXT,
  cover_url TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category_id, day_index)
);
GRANT SELECT ON public.manifest_audios TO authenticated;
GRANT ALL ON public.manifest_audios TO service_role;
ALTER TABLE public.manifest_audios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read audios" ON public.manifest_audios FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage audios" ON public.manifest_audios FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.manifest_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audio_id UUID NOT NULL REFERENCES public.manifest_audios(id) ON DELETE CASCADE,
  ya_tengo TEXT,
  yo_soy TEXT,
  gratitud TEXT,
  peticion TEXT,
  played BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, audio_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manifest_entries TO authenticated;
GRANT ALL ON public.manifest_entries TO service_role;
ALTER TABLE public.manifest_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own entries" ON public.manifest_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER touch_entries BEFORE UPDATE ON public.manifest_entries FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.manifest_categories (id, title, subtitle, color, affirmation_ya_tengo, identity_yo_soy, gratitude_gracias, petition, sort_order) VALUES
('dinero', 'Dinero y Prosperidad', 'Multiplica tus ingresos con fe', '#D4AF37', 'Ya tengo $10,000 adicionales entrando a mi cuenta cada mes', 'Yo soy próspero, disciplinado y un excelente administrador', 'Gracias Dios porque has abierto nuevas fuentes de ingresos para mi vida conforme a Tu voluntad', 'Muéstrame Espíritu Santo las oportunidades correctas para multiplicar mis ingresos', 1),
('pareja', 'Pareja y Matrimonio', 'Alinea tu vida con la persona correcta', '#E63980', 'Ya tengo una relación sana, estable y llena de amor', 'Yo soy amado, valioso y emocionalmente saludable', 'Gracias Dios porque estás alineando mi vida con la persona correcta conforme a Tu voluntad', 'Muéstrame Espíritu Santo la persona correcta para esta temporada de mi vida', 2),
('casa', 'Casa Propia', 'La puerta correcta para tu hogar', '#7C6AED', 'Ya tengo la casa ideal para mí y mi familia', 'Yo soy un buen administrador de las bendiciones que recibo', 'Gracias Dios porque has abierto la puerta correcta para mi nuevo hogar', 'Muéstrame Espíritu Santo la casa correcta y el momento correcto', 3),
('negocio', 'Negocio', 'Bendice la obra de tus manos', '#22B573', 'Ya tengo un negocio exitoso, rentable y en crecimiento', 'Yo soy un empresario sabio, creativo y disciplinado', 'Gracias Dios porque bendices la obra de mis manos', 'Muéstrame Espíritu Santo las conexiones y estrategias correctas', 4),
('trabajo', 'Trabajo Ideal', 'La puerta laboral extraordinaria', '#2C7BE5', 'Ya tengo el trabajo ideal para esta etapa de mi vida', 'Yo soy capaz, preparado y valioso', 'Gracias Dios porque has abierto una puerta laboral extraordinaria', 'Muéstrame Espíritu Santo dónde está la oportunidad correcta', 5),
('proposito', 'Propósito y Llamado', 'Dios dirige tus pasos', '#F97316', 'Ya tengo claridad sobre el propósito de mi vida', 'Yo soy llamado, preparado y guiado por Dios', 'Gracias Dios porque diriges cada uno de mis pasos', 'Muéstrame Espíritu Santo el siguiente nivel de mi propósito', 6),
('abundancia', 'Abundancia General', 'Bendecido para bendecir', '#0EA5A0', 'Ya tengo abundancia en todas las áreas de mi vida', 'Yo soy bendecido para bendecir a otros', 'Gracias Dios porque Tu favor me acompaña diariamente', 'Muéstrame Espíritu Santo las puertas que has preparado para mí', 7),
('libre', 'Petición Libre', 'Tu petición personal', '#64748B', 'Ya tengo aquello que le he pedido a Dios en fe', 'Yo soy hijo de Dios y camino en Su voluntad', 'Gracias Dios porque escuchas cada una de mis oraciones', 'Muéstrame Espíritu Santo Tu voluntad para esta petición', 8);

INSERT INTO public.manifest_audios (category_id, day_index, title, affirmation)
SELECT c.id, d.day, 'Día ' || d.day || ' — ' || c.title, c.affirmation_ya_tengo
FROM public.manifest_categories c
CROSS JOIN generate_series(1, 21) AS d(day);

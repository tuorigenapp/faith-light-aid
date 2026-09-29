-- 1) Cerebro ORÍGEN: documentos PDF cuyo texto alimenta a la IA (fuente confidencial)
CREATE TABLE public.brain_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scope text NOT NULL DEFAULT 'origen',
  scope_ref text,
  title text NOT NULL,
  file_path text,
  content text NOT NULL DEFAULT '',
  chars integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brain_documents TO authenticated;
GRANT ALL ON public.brain_documents TO service_role;
ALTER TABLE public.brain_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brain_docs_admin_all" ON public.brain_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX brain_documents_scope_idx ON public.brain_documents (scope, scope_ref) WHERE is_active;
CREATE TRIGGER brain_documents_updated_at BEFORE UPDATE ON public.brain_documents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2) Consultas creadas desde el panel (la IA arma la estructura)
CREATE TABLE public.custom_consultas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  notes text,
  cover_url text,
  intro text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  system_prompt text NOT NULL DEFAULT '',
  cost_hojas integer NOT NULL DEFAULT 1,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.custom_consultas TO authenticated;
GRANT ALL ON public.custom_consultas TO service_role;
ALTER TABLE public.custom_consultas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custom_consultas_read" ON public.custom_consultas FOR SELECT TO authenticated
  USING (is_published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "custom_consultas_admin" ON public.custom_consultas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER custom_consultas_updated_at BEFORE UPDATE ON public.custom_consultas
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3) Respuestas guardadas de esas consultas
CREATE TABLE public.custom_consulta_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consulta_id uuid NOT NULL REFERENCES public.custom_consultas(id) ON DELETE CASCADE,
  full_name text,
  birthdate date,
  question text,
  answer jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.custom_consulta_results TO authenticated;
GRANT ALL ON public.custom_consulta_results TO service_role;
ALTER TABLE public.custom_consulta_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consulta_results_own_read" ON public.custom_consulta_results FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "consulta_results_own_write" ON public.custom_consulta_results FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4) Campañas emergentes: sección (inicio o comunidad) y días de duración
ALTER TABLE public.promo_campaigns
  ADD COLUMN IF NOT EXISTS placement text NOT NULL DEFAULT 'inicio',
  ADD COLUMN IF NOT EXISTS days integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS shows_per_day integer NOT NULL DEFAULT 1;
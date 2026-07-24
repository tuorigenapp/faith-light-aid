
CREATE TABLE public.ministracion_lecturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  dob DATE,
  question TEXT,
  headline TEXT,
  dictamen TEXT,
  linea_tiempo TEXT,
  senales JSONB,
  ministracion TEXT,
  versiculo TEXT,
  rompe_ciclo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ministracion_lecturas TO authenticated;
GRANT ALL ON public.ministracion_lecturas TO service_role;
ALTER TABLE public.ministracion_lecturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ministracion read" ON public.ministracion_lecturas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own ministracion write" ON public.ministracion_lecturas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ministracion delete" ON public.ministracion_lecturas FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_ministracion_user_created ON public.ministracion_lecturas(user_id, created_at DESC);

CREATE TABLE public.patrones_consultas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  birthdate date,
  question text,
  observation text,
  patterns jsonb,
  reflection text,
  recommendations jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patrones_consultas TO authenticated;
GRANT ALL ON public.patrones_consultas TO service_role;
ALTER TABLE public.patrones_consultas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own patrones consultas" ON public.patrones_consultas FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.hoja_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_email text NOT NULL,
  points integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.hoja_transfers TO authenticated;
GRANT ALL ON public.hoja_transfers TO service_role;
ALTER TABLE public.hoja_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own transfers read" ON public.hoja_transfers FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "own transfers create" ON public.hoja_transfers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND points > 0);

CREATE TABLE public.notification_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notification_prefs TO authenticated;
GRANT ALL ON public.notification_prefs TO service_role;
ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notif prefs" ON public.notification_prefs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
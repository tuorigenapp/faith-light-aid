CREATE TABLE public.stage_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  stage_id integer NOT NULL,
  xp integer NOT NULL DEFAULT 0,
  leaves integer NOT NULL DEFAULT 0,
  insignia text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, stage_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stage_rewards TO authenticated;
GRANT ALL ON public.stage_rewards TO service_role;
ALTER TABLE public.stage_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own stage rewards" ON public.stage_rewards FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.stage_step_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  stage_id integer NOT NULL,
  step_key text NOT NULL,
  kind text NOT NULL DEFAULT 'nota',
  title text,
  response text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, stage_id, step_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stage_step_entries TO authenticated;
GRANT ALL ON public.stage_step_entries TO service_role;
ALTER TABLE public.stage_step_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own stage step entries" ON public.stage_step_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER stage_step_entries_touch BEFORE UPDATE ON public.stage_step_entries FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
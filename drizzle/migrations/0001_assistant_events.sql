CREATE TABLE public.assistant_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  kind text NOT NULL,
  scope_ref text,
  title text,
  question text NOT NULL DEFAULT '',
  keywords text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.assistant_events TO authenticated;
GRANT ALL ON public.assistant_events TO service_role;
ALTER TABLE public.assistant_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin reads assistant events" ON public.assistant_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX assistant_events_created_idx ON public.assistant_events (created_at DESC);
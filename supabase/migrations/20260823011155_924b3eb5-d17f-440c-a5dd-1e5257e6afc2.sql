CREATE TABLE public.wheel_spins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prize_key text NOT NULL,
  prize_label text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX wheel_spins_user_created_idx ON public.wheel_spins (user_id, created_at DESC);

GRANT SELECT, INSERT ON public.wheel_spins TO authenticated;
GRANT ALL ON public.wheel_spins TO service_role;

ALTER TABLE public.wheel_spins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wheel_spins_select_own" ON public.wheel_spins
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "wheel_spins_insert_own" ON public.wheel_spins
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wheel_spins_admin_select" ON public.wheel_spins
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
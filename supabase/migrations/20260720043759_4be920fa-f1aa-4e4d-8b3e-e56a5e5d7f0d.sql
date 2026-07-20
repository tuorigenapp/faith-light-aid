
-- Add gems + display name to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gems integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS display_name text;

-- Family members table (genealogy tree)
CREATE TABLE IF NOT EXISTS public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  relationship text NOT NULL,
  lineage text NOT NULL CHECK (lineage IN ('materno','paterno','propio')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_members TO authenticated;
GRANT ALL ON public.family_members TO service_role;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own family members" ON public.family_members FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Gem transactions ledger
CREATE TABLE IF NOT EXISTS public.gem_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.gem_transactions TO authenticated;
GRANT ALL ON public.gem_transactions TO service_role;
ALTER TABLE public.gem_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own gem tx" ON public.gem_transactions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Appointments (booking with professional)
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('full','limitado')),
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own appointments" ON public.appointments FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RPC to safely award gems (increments profile + logs tx)
CREATE OR REPLACE FUNCTION public.award_gems(_amount integer, _reason text, _meta jsonb DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid; _new integer;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  INSERT INTO public.gem_transactions(user_id, amount, reason, meta) VALUES (_uid, _amount, _reason, _meta);
  UPDATE public.profiles SET gems = COALESCE(gems,0) + _amount WHERE id = _uid RETURNING gems INTO _new;
  RETURN _new;
END; $$;
GRANT EXECUTE ON FUNCTION public.award_gems(integer, text, jsonb) TO authenticated;

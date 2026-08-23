-- 1) PROFILES: block self-granting of rewards/progress columns via trigger guard
CREATE OR REPLACE FUNCTION public.guard_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  NEW.gems := OLD.gems;
  NEW.current_stage := OLD.current_stage;
  NEW.spiritual_level := OLD.spiritual_level;
  NEW.consecutive_days := OLD.consecutive_days;
  NEW.excluded_from_metrics := OLD.excluded_from_metrics;
  NEW.referral_code := OLD.referral_code;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_columns ON public.profiles;
CREATE TRIGGER profiles_guard_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_columns();

-- 2) REFERRALS: users can no longer change status / reward
DROP POLICY IF EXISTS "own referrals update" ON public.referrals;

-- 3) STAGE REWARDS: read-only for users
DROP POLICY IF EXISTS "own stage rewards" ON public.stage_rewards;
CREATE POLICY "own stage rewards read" ON public.stage_rewards
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 4) HOJA TRANSFERS: no client inserts; server function validates + deducts atomically
DROP POLICY IF EXISTS "own transfers create" ON public.hoja_transfers;

CREATE OR REPLACE FUNCTION public.create_hoja_transfer(_to_email text, _hojas integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _points integer;
  _balance integer;
  _id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF _hojas IS NULL OR _hojas < 1 OR _hojas > 500 THEN RAISE EXCEPTION 'invalid amount'; END IF;
  IF _to_email IS NULL OR _to_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN RAISE EXCEPTION 'invalid email'; END IF;
  IF lower(_to_email) = lower(COALESCE((SELECT email FROM public.profiles WHERE id = _uid), '')) THEN
    RAISE EXCEPTION 'cannot transfer to self';
  END IF;

  _points := _hojas * 100;

  PERFORM pg_advisory_xact_lock(hashtext(_uid::text));

  SELECT COALESCE(gems, 0) INTO _balance FROM public.profiles WHERE id = _uid FOR UPDATE;
  IF _balance < _points THEN RAISE EXCEPTION 'insufficient balance'; END IF;

  UPDATE public.profiles SET gems = gems - _points WHERE id = _uid;
  INSERT INTO public.gem_transactions(user_id, amount, reason, meta)
  VALUES (_uid, -_points, 'transfer:' || lower(_to_email), jsonb_build_object('hojas', _hojas));

  INSERT INTO public.hoja_transfers(user_id, to_email, points, status, note)
  VALUES (_uid, lower(_to_email), _points, 'pending', 'Transferencia a ' || lower(_to_email))
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_hoja_transfer(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_hoja_transfer(text, integer) TO authenticated, service_role;

-- 5) SUBSCRIPTIONS: plan/status changes only via privileged server code
DROP POLICY IF EXISTS "users update own sub" ON public.subscriptions;
DROP POLICY IF EXISTS "users insert own sub" ON public.subscriptions;

-- 6) WHEEL SPINS: prizes recorded server-side only
DROP POLICY IF EXISTS "wheel_spins_insert_own" ON public.wheel_spins;

-- 7) MANIFEST AUDIOS: enforce the category's required plan
DROP POLICY IF EXISTS "read audios" ON public.manifest_audios;
CREATE POLICY "read audios by plan" ON public.manifest_audios
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.manifest_categories c
    WHERE c.id = manifest_audios.category_id
      AND (
        c.required_plan = 'explorador'
        OR EXISTS (
          SELECT 1 FROM public.subscriptions s
          WHERE s.user_id = auth.uid()
            AND s.status IN ('active', 'trialing')
            AND s.plan IN ('camino', 'annual', 'monthly', 'premium')
        )
      )
  )
);
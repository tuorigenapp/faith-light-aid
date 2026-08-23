DROP POLICY IF EXISTS "own gem tx" ON public.gem_transactions;
REVOKE INSERT, UPDATE, DELETE ON public.gem_transactions FROM authenticated;
GRANT SELECT ON public.gem_transactions TO authenticated;
CREATE POLICY "users read own gem transactions"
ON public.gem_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.award_gems(_amount integer, _reason text, _meta jsonb DEFAULT NULL::jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _new integer;
  _daily integer := 0;
  _section integer := 0;
  _section_key text;
  _granted integer;
  _day_start timestamptz := date_trunc('day', now());
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF _amount = 0 OR _amount > 5 OR _amount < -200000 THEN RAISE EXCEPTION 'invalid amount'; END IF;
  IF length(trim(_reason)) < 2 OR length(_reason) > 240 THEN RAISE EXCEPTION 'invalid reason'; END IF;

  PERFORM pg_advisory_xact_lock(hashtext(_uid::text));

  IF _amount > 0 THEN
    IF _reason !~ '^leaf:[a-z0-9_]{1,28}:(minor|medium|major)' THEN
      RAISE EXCEPTION 'invalid award reason';
    END IF;
    _section_key := split_part(_reason, ':', 2);
    SELECT COALESCE(sum(amount), 0) INTO _daily
    FROM public.gem_transactions
    WHERE user_id = _uid AND amount > 0 AND created_at >= _day_start;
    SELECT COALESCE(sum(amount), 0) INTO _section
    FROM public.gem_transactions
    WHERE user_id = _uid AND amount > 0 AND created_at >= _day_start
      AND reason LIKE 'leaf:' || _section_key || ':%';
    _granted := LEAST(_amount, GREATEST(0, 33 - _daily), GREATEST(0, 10 - _section));
    IF _granted <= 0 THEN
      SELECT COALESCE(gems, 0) INTO _new FROM public.profiles WHERE id = _uid;
      RETURN _new;
    END IF;
  ELSE
    _granted := _amount;
    IF COALESCE((SELECT gems FROM public.profiles WHERE id = _uid), 0) + _granted < 0 THEN
      RAISE EXCEPTION 'insufficient balance';
    END IF;
  END IF;

  INSERT INTO public.gem_transactions(user_id, amount, reason, meta)
  VALUES (_uid, _granted, _reason, _meta);
  UPDATE public.profiles
  SET gems = COALESCE(gems, 0) + _granted
  WHERE id = _uid
  RETURNING gems INTO _new;
  RETURN _new;
END;
$$;

REVOKE ALL ON FUNCTION public.award_gems(integer, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_gems(integer, text, jsonb) TO authenticated, service_role;
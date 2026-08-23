CREATE OR REPLACE FUNCTION public.award_gems(_amount integer, _reason text, _meta jsonb DEFAULT NULL::jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _new integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'auth required';
  END IF;
  IF _amount = 0 OR _amount > 10 OR _amount < -200000 THEN
    RAISE EXCEPTION 'invalid amount';
  END IF;
  IF length(trim(_reason)) < 2 OR length(_reason) > 240 THEN
    RAISE EXCEPTION 'invalid reason';
  END IF;
  IF _amount < 0 AND COALESCE((SELECT gems FROM public.profiles WHERE id = _uid), 0) + _amount < 0 THEN
    RAISE EXCEPTION 'insufficient balance';
  END IF;
  INSERT INTO public.gem_transactions(user_id, amount, reason, meta)
  VALUES (_uid, _amount, _reason, _meta);
  UPDATE public.profiles
  SET gems = COALESCE(gems, 0) + _amount
  WHERE id = _uid
  RETURNING gems INTO _new;
  RETURN _new;
END;
$$;

REVOKE ALL ON FUNCTION public.award_gems(integer, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_gems(integer, text, jsonb) TO authenticated, service_role;
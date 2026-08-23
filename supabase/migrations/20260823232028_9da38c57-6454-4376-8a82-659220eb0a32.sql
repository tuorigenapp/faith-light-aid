CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    );
$$;

CREATE OR REPLACE FUNCTION public.award_gems(_amount integer, _reason text, _meta jsonb DEFAULT NULL::jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
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
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.community_anonymous_number(_user_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE assigned integer;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Se necesita una persona para asignar un número anónimo.'; END IF;
  LOOP
    SELECT anonymous_number INTO assigned FROM public.community_anonymous_identities WHERE user_id = _user_id;
    IF FOUND THEN RETURN assigned; END IF;
    IF (SELECT count(*) FROM public.community_anonymous_identities WHERE anonymous_number BETWEEN 1 AND 999999) < 999999 THEN
      assigned := 1 + floor(random() * 999999)::integer;
    ELSE
      SELECT greatest(999999, coalesce(max(anonymous_number), 999999)) + 1 INTO assigned FROM public.community_anonymous_identities;
    END IF;
    INSERT INTO public.community_anonymous_identities (user_id, anonymous_number)
      VALUES (_user_id, assigned) ON CONFLICT DO NOTHING;
    IF FOUND THEN RETURN assigned; END IF;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.community_anonymous_number(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.community_anonymous_number(uuid) TO service_role;

DO $$
DECLARE person record; candidate integer; assigned boolean;
BEGIN
  FOR person IN SELECT user_id FROM public.community_anonymous_identities WHERE anonymous_number > 999999 OR anonymous_number < 1 LOOP
    assigned := false;
    WHILE NOT assigned LOOP
      candidate := 1 + floor(random() * 999999)::integer;
      BEGIN
        UPDATE public.community_anonymous_identities SET anonymous_number = candidate WHERE user_id = person.user_id;
        assigned := true;
      EXCEPTION WHEN unique_violation THEN
        NULL;
      END;
    END LOOP;
    UPDATE public.community_posts SET author_name = 'Alma Anónima #' || candidate WHERE is_anonymous AND user_id = person.user_id;
    UPDATE public.community_replies SET author_name = 'Alma Anónima #' || candidate WHERE is_anonymous AND user_id = person.user_id;
  END LOOP;
END;
$$;
CREATE TABLE public.community_anonymous_identities (
  user_id uuid PRIMARY KEY,
  anonymous_number integer NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.community_anonymous_identities TO service_role;
ALTER TABLE public.community_anonymous_identities ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER community_anonymous_identities_updated_at BEFORE UPDATE ON public.community_anonymous_identities FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.community_anonymous_number(_user_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE assigned integer;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Se necesita una persona para asignar un número anónimo.'; END IF;
  LOOP
    SELECT anonymous_number INTO assigned FROM public.community_anonymous_identities WHERE user_id = _user_id;
    IF FOUND THEN RETURN assigned; END IF;
    assigned := 100000 + floor(random() * 999900000)::integer;
    INSERT INTO public.community_anonymous_identities (user_id, anonymous_number)
      VALUES (_user_id, assigned) ON CONFLICT DO NOTHING;
    IF FOUND THEN RETURN assigned; END IF;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.community_anonymous_number(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.community_anonymous_number(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.community_anonymous_name_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_anonymous AND NEW.user_id IS NOT NULL THEN
    NEW.author_name := 'Alma Anónima #' || public.community_anonymous_number(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.community_anonymous_name_guard() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER community_post_anonymous_name BEFORE INSERT OR UPDATE ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.community_anonymous_name_guard();
CREATE TRIGGER community_reply_anonymous_name BEFORE INSERT OR UPDATE ON public.community_replies FOR EACH ROW EXECUTE FUNCTION public.community_anonymous_name_guard();
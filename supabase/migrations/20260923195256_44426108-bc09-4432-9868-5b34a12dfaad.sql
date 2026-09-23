ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS author_kind text NOT NULL DEFAULT 'user';
ALTER TABLE public.community_replies ADD COLUMN IF NOT EXISTS author_kind text NOT NULL DEFAULT 'user';

ALTER TABLE public.community_posts DISABLE TRIGGER community_post_guard;
ALTER TABLE public.community_replies DISABLE TRIGGER community_reply_guard;
UPDATE public.community_posts SET author_kind = 'ai' WHERE is_bot AND author_kind = 'user';
UPDATE public.community_replies SET author_kind = 'ai' WHERE is_bot AND author_kind = 'user';
ALTER TABLE public.community_posts ENABLE TRIGGER community_post_guard;
ALTER TABLE public.community_replies ENABLE TRIGGER community_reply_guard;

ALTER TABLE public.community_suspensions
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'temporal',
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS target_type text,
  ADD COLUMN IF NOT EXISTS target_id uuid,
  ADD COLUMN IF NOT EXISTS target_excerpt text,
  ADD COLUMN IF NOT EXISTS admin_note text,
  ADD COLUMN IF NOT EXISTS user_message text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_level smallint NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.guard_profile_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  NEW.verified_level := OLD.verified_level;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.community_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('role', true) <> 'service_role' THEN
    IF EXISTS (SELECT 1 FROM public.community_suspensions WHERE user_id = auth.uid() AND (expires_at IS NULL OR expires_at > now())) THEN
      RAISE EXCEPTION 'Tu participación en la comunidad está suspendida.';
    END IF;
    IF TG_TABLE_NAME = 'community_posts' THEN
      IF NOT public.has_role(auth.uid(), 'admin') AND (
        (TG_OP = 'INSERT' AND (NEW.poll_options IS NOT NULL OR NEW.poll_answer_index IS NOT NULL)) OR
        (TG_OP = 'UPDATE' AND (NEW.poll_options IS DISTINCT FROM OLD.poll_options OR NEW.poll_answer_index IS DISTINCT FROM OLD.poll_answer_index))
      ) THEN
        RAISE EXCEPTION 'Solo la administración puede crear encuestas.';
      END IF;
      NEW.is_bot := false;
      NEW.is_verified := false;
      NEW.source_url := NULL;
      NEW.author_kind := 'user';
    ELSIF TG_TABLE_NAME = 'community_replies' THEN
      NEW.is_bot := false;
      NEW.author_kind := 'user';
    END IF;
  END IF;
  IF TG_TABLE_NAME = 'community_replies' THEN
    IF NEW.parent_reply_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.community_replies r WHERE r.id = NEW.parent_reply_id AND r.post_id = NEW.post_id
    ) THEN
      RAISE EXCEPTION 'La respuesta pertenece a otra conversación.';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.community_reaction_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (SELECT 1 FROM public.community_suspensions WHERE user_id = auth.uid() AND (expires_at IS NULL OR expires_at > now())) THEN
    RAISE EXCEPTION 'Tu participación en la comunidad está suspendida.';
  END IF;
  RETURN NEW;
END;
$function$;
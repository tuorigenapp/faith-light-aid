CREATE OR REPLACE FUNCTION public.community_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF current_setting('role', true) <> 'service_role' THEN
    IF EXISTS (SELECT 1 FROM public.community_suspensions WHERE user_id = auth.uid()) THEN
      RAISE EXCEPTION 'Tu participación en la comunidad está suspendida.';
    END IF;
    IF TG_TABLE_NAME = 'community_posts' THEN
      NEW.is_bot := false;
      NEW.is_verified := false;
      NEW.source_url := NULL;
    ELSIF TG_TABLE_NAME = 'community_replies' THEN
      NEW.is_bot := false;
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
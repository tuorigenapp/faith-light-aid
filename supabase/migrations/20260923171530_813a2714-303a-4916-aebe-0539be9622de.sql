CREATE TABLE public.community_blocks (
  user_id uuid NOT NULL,
  topic text NOT NULL CHECK (topic IN ('general','familia','pareja','ansiedad','fe','logros')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic)
);
GRANT SELECT, INSERT, DELETE ON public.community_blocks TO authenticated;
GRANT ALL ON public.community_blocks TO service_role;
ALTER TABLE public.community_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manage own community blocks" ON public.community_blocks FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.community_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
BEGIN
  IF current_setting('role', true) <> 'service_role' THEN
    IF EXISTS (SELECT 1 FROM public.community_suspensions WHERE user_id = auth.uid()) THEN
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
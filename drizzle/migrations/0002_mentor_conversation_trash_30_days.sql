ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS conversations_trash_idx ON public.conversations (user_id, deleted_at) WHERE deleted_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.guard_mentor_conversation_trash()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.deleted_at IS NOT NULL THEN
    NEW.deleted_at := now();
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.deleted_at IS NOT NULL AND OLD.deleted_at <= now() - interval '30 days' THEN
      RAISE EXCEPTION 'conversation_recovery_expired';
    END IF;
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      NEW.deleted_at := now();
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NOT NULL THEN
      NEW.deleted_at := OLD.deleted_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER mentor_conversation_trash_guard BEFORE INSERT OR UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.guard_mentor_conversation_trash();

CREATE POLICY "mentor recovery window" ON public.conversations AS RESTRICTIVE FOR ALL TO authenticated
USING (deleted_at IS NULL OR deleted_at > now() - interval '30 days')
WITH CHECK (deleted_at IS NULL OR deleted_at > now() - interval '30 days');
CREATE POLICY "mentor messages recovery window" ON public.messages AS RESTRICTIVE FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "mentor messages active conversation" ON public.messages AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid() AND c.deleted_at IS NULL));

CREATE OR REPLACE FUNCTION public.list_mentor_conversations()
RETURNS TABLE (id uuid, title text, created_at timestamptz, updated_at timestamptz, deleted_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid := auth.uid();
BEGIN
  IF owner_id IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
  DELETE FROM public.conversations c WHERE c.user_id = owner_id AND c.deleted_at <= now() - interval '30 days';
  RETURN QUERY SELECT c.id, c.title, c.created_at, c.updated_at, c.deleted_at FROM public.conversations c
    WHERE c.user_id = owner_id AND (c.deleted_at IS NULL OR c.deleted_at > now() - interval '30 days')
    ORDER BY c.updated_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.list_mentor_conversations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_mentor_conversations() TO authenticated;

CREATE OR REPLACE FUNCTION public.trash_mentor_conversation(conversation_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations c SET deleted_at = now() WHERE c.id = conversation_id AND c.user_id = auth.uid() AND c.deleted_at IS NULL;
  RETURN FOUND;
END;
$$;
CREATE OR REPLACE FUNCTION public.restore_mentor_conversation(conversation_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations c SET deleted_at = NULL WHERE c.id = conversation_id AND c.user_id = auth.uid()
    AND c.deleted_at IS NOT NULL AND c.deleted_at > now() - interval '30 days';
  RETURN FOUND;
END;
$$;
CREATE OR REPLACE FUNCTION public.delete_mentor_conversation(conversation_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  DELETE FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid() AND c.deleted_at IS NOT NULL;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.trash_mentor_conversation(uuid), public.restore_mentor_conversation(uuid), public.delete_mentor_conversation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.trash_mentor_conversation(uuid), public.restore_mentor_conversation(uuid), public.delete_mentor_conversation(uuid) TO authenticated;
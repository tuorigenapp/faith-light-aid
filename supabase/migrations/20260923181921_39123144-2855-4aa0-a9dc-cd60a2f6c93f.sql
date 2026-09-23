ALTER TABLE public.community_posts DISABLE TRIGGER community_post_guard;
UPDATE public.community_posts SET poll_options = NULL, poll_answer_index = NULL, body = 'Comparte en las respuestas tu experiencia, tus ideas o el método que te ayudó.' WHERE bot_kind = 'cover' AND poll_options IS NOT NULL;
UPDATE public.community_posts SET poll_options = NULL, poll_answer_index = NULL WHERE image_path IS NOT NULL AND poll_options IS NOT NULL;
ALTER TABLE public.community_posts ENABLE TRIGGER community_post_guard;
ALTER TABLE public.community_posts ADD CONSTRAINT community_polls_without_cover CHECK (poll_options IS NULL OR (image_path IS NULL AND bot_kind IS DISTINCT FROM 'cover'));
CREATE TABLE public.community_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('post','reply','reaction')),
  bucket text NOT NULL CHECK (bucket IN ('feed','mine','comments','following')),
  source_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  UNIQUE (user_id, event_type, source_id, bucket)
);
GRANT SELECT, UPDATE ON public.community_notifications TO authenticated;
GRANT ALL ON public.community_notifications TO service_role;
ALTER TABLE public.community_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own community notifications" ON public.community_notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "mark own community notifications read" ON public.community_notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX community_notifications_unread_idx ON public.community_notifications (user_id, bucket, created_at DESC) WHERE read_at IS NULL;
CREATE OR REPLACE FUNCTION public.community_notify_activity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  owner_id uuid;
  thread_owner uuid;
  parent_owner uuid;
  thread_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'community_posts' THEN
    IF NEW.is_bot OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'admin') THEN
      INSERT INTO public.community_notifications (user_id, post_id, event_type, bucket, source_id)
      SELECT p.id, NEW.id, 'post', CASE WHEN EXISTS (SELECT 1 FROM public.community_follows f WHERE f.user_id = p.id AND f.topic = NEW.topic) THEN 'following' ELSE 'feed' END, NEW.id
      FROM public.profiles p
      WHERE p.id IS DISTINCT FROM NEW.user_id
        AND NOT EXISTS (SELECT 1 FROM public.community_blocks b WHERE b.user_id = p.id AND b.topic = NEW.topic)
      ON CONFLICT DO NOTHING;
    END IF;
  ELSIF TG_TABLE_NAME = 'community_replies' THEN
    SELECT p.user_id INTO thread_owner FROM public.community_posts p WHERE p.id = NEW.post_id;
    IF thread_owner IS NOT NULL AND thread_owner IS DISTINCT FROM NEW.user_id THEN
      INSERT INTO public.community_notifications (user_id, post_id, event_type, bucket, source_id)
      VALUES (thread_owner, NEW.post_id, 'reply', 'mine', NEW.id) ON CONFLICT DO NOTHING;
    END IF;
    IF NEW.parent_reply_id IS NOT NULL THEN
      SELECT r.user_id INTO parent_owner FROM public.community_replies r WHERE r.id = NEW.parent_reply_id;
      IF parent_owner IS NOT NULL AND parent_owner IS DISTINCT FROM NEW.user_id THEN
        INSERT INTO public.community_notifications (user_id, post_id, event_type, bucket, source_id)
        VALUES (parent_owner, NEW.post_id, 'reply', 'comments', NEW.id) ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'community_reactions' THEN
    IF NEW.target_type = 'post' THEN
      SELECT p.user_id, p.id INTO owner_id, thread_id FROM public.community_posts p WHERE p.id = NEW.target_id;
      IF owner_id IS NOT NULL AND owner_id IS DISTINCT FROM NEW.user_id THEN
        INSERT INTO public.community_notifications (user_id, post_id, event_type, bucket, source_id)
        VALUES (owner_id, thread_id, 'reaction', 'mine', NEW.id) ON CONFLICT DO NOTHING;
      END IF;
    ELSIF NEW.target_type = 'reply' THEN
      SELECT r.user_id, r.post_id INTO owner_id, thread_id FROM public.community_replies r WHERE r.id = NEW.target_id;
      IF owner_id IS NOT NULL AND owner_id IS DISTINCT FROM NEW.user_id THEN
        INSERT INTO public.community_notifications (user_id, post_id, event_type, bucket, source_id)
        VALUES (owner_id, thread_id, 'reaction', 'comments', NEW.id) ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
CREATE TRIGGER community_notify_post AFTER INSERT ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.community_notify_activity();
CREATE TRIGGER community_notify_reply AFTER INSERT ON public.community_replies FOR EACH ROW EXECUTE FUNCTION public.community_notify_activity();
CREATE TRIGGER community_notify_reaction AFTER INSERT ON public.community_reactions FOR EACH ROW EXECUTE FUNCTION public.community_notify_activity();
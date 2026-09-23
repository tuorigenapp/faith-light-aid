CREATE OR REPLACE FUNCTION public.community_notify_activity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE owner_id uuid; thread_owner uuid; thread_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'community_posts' THEN
    IF NEW.is_bot OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'admin') THEN
      INSERT INTO public.community_notifications (user_id, post_id, event_type, bucket, source_id)
      SELECT p.id, NEW.id, 'post', CASE WHEN EXISTS (SELECT 1 FROM public.community_follows f WHERE f.user_id = p.id AND f.topic = NEW.topic) THEN 'following' ELSE 'feed' END, NEW.id
      FROM public.profiles p WHERE p.id IS DISTINCT FROM NEW.user_id
      AND NOT EXISTS (SELECT 1 FROM public.community_blocks b WHERE b.user_id = p.id AND b.topic = NEW.topic)
      ON CONFLICT DO NOTHING;
    END IF;
  ELSIF TG_TABLE_NAME = 'community_replies' THEN
    SELECT p.user_id INTO thread_owner FROM public.community_posts p WHERE p.id = NEW.post_id;
    IF thread_owner IS NOT NULL AND thread_owner IS DISTINCT FROM NEW.user_id THEN
      INSERT INTO public.community_notifications (user_id, post_id, event_type, bucket, source_id)
      VALUES (thread_owner, NEW.post_id, 'reply', 'mine', NEW.id) ON CONFLICT DO NOTHING;
    END IF;
    INSERT INTO public.community_notifications (user_id, post_id, event_type, bucket, source_id)
    SELECT DISTINCT r.user_id, NEW.post_id, 'reply', 'comments', NEW.id
    FROM public.community_replies r
    WHERE r.post_id = NEW.post_id AND r.user_id IS NOT NULL
    AND r.user_id IS DISTINCT FROM NEW.user_id AND r.user_id IS DISTINCT FROM thread_owner
    ON CONFLICT DO NOTHING;
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
REVOKE EXECUTE ON FUNCTION public.community_notify_activity() FROM PUBLIC, anon, authenticated;
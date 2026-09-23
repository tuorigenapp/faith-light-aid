ALTER TABLE public.community_posts ADD COLUMN bot_kind text, ADD COLUMN bot_slot smallint;
ALTER TABLE public.community_posts ADD CONSTRAINT community_bot_kind_valid CHECK (bot_kind IS NULL OR bot_kind IN ('cover','poll'));
ALTER TABLE public.community_posts ADD CONSTRAINT community_bot_slot_valid CHECK (bot_slot IS NULL OR bot_slot BETWEEN 0 AND 2);
DROP INDEX IF EXISTS public.community_one_bot_topic_per_day;
CREATE UNIQUE INDEX community_bot_topic_slot_kind_day ON public.community_posts (topic, ((created_at AT TIME ZONE 'America/Santo_Domingo')::date), bot_slot, bot_kind) WHERE is_bot AND bot_kind IS NOT NULL AND bot_slot IS NOT NULL;
DROP POLICY IF EXISTS "cast own vote" ON public.community_poll_votes;
CREATE POLICY "cast own vote" ON public.community_poll_votes FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid() AND choice_index >= 0 AND EXISTS (SELECT 1 FROM public.community_posts p WHERE p.id=post_id AND jsonb_typeof(p.poll_options)='array' AND jsonb_array_length(p.poll_options) BETWEEN 2 AND 6 AND choice_index < jsonb_array_length(p.poll_options)));
ALTER TABLE public.community_posts ADD CONSTRAINT community_post_body_length CHECK (char_length(body) <= 10000);
ALTER TABLE public.community_replies ADD CONSTRAINT community_reply_body_length CHECK (char_length(body) <= 10000);
ALTER TABLE public.community_posts ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.community_replies ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.community_posts ADD CONSTRAINT community_post_bot_author CHECK ((is_bot AND user_id IS NULL) OR (NOT is_bot AND user_id IS NOT NULL));
ALTER TABLE public.community_replies ADD CONSTRAINT community_reply_bot_author CHECK ((is_bot AND user_id IS NULL) OR (NOT is_bot AND user_id IS NOT NULL));
UPDATE public.community_replies SET user_id=NULL WHERE is_bot;
UPDATE public.community_posts SET user_id=NULL WHERE is_bot;
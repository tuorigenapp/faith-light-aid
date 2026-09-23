ALTER TABLE public.community_posts ADD COLUMN poll_answer_index integer;
REVOKE SELECT (poll_answer_index) ON public.community_posts FROM authenticated;
CREATE TABLE public.community_poll_votes (post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE, user_id uuid NOT NULL, choice_index integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(post_id,user_id));
GRANT SELECT, INSERT ON public.community_poll_votes TO authenticated;
GRANT ALL ON public.community_poll_votes TO service_role;
ALTER TABLE public.community_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own vote" ON public.community_poll_votes FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY "cast own vote" ON public.community_poll_votes FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid() AND choice_index >= 0 AND choice_index < 4 AND EXISTS (SELECT 1 FROM public.community_posts p WHERE p.id=post_id AND p.poll_options IS NOT NULL));
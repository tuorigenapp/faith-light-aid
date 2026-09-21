CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT 'Anónimo',
  topic TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT ALL ON public.community_posts TO service_role;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read posts" ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert own post" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own post" ON public.community_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own post" ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.community_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT 'Anónimo',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_replies TO authenticated;
GRANT ALL ON public.community_replies TO service_role;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read replies" ON public.community_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert own reply" ON public.community_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own reply" ON public.community_replies FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own reply" ON public.community_replies FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.community_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post','reply')),
  target_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id, emoji)
);
GRANT SELECT, INSERT, DELETE ON public.community_reactions TO authenticated;
GRANT ALL ON public.community_reactions TO service_role;
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read reactions" ON public.community_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert own reaction" ON public.community_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own reaction" ON public.community_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX community_replies_post_idx ON public.community_replies(post_id);
CREATE INDEX community_reactions_target_idx ON public.community_reactions(target_type, target_id);

CREATE TRIGGER community_posts_updated_at BEFORE UPDATE ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER community_replies_updated_at BEFORE UPDATE ON public.community_replies
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
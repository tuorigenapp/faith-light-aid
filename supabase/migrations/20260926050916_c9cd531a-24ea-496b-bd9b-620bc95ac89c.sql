ALTER TABLE public.manifest_categories ADD COLUMN IF NOT EXISTS design text NOT NULL DEFAULT 'musica';
UPDATE public.manifest_categories SET design = 'audio' WHERE audio_only = true;

CREATE TABLE public.audio_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audio_id uuid,
  source text NOT NULL DEFAULT 'ruleta',
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz
);
GRANT SELECT ON public.audio_unlocks TO authenticated;
GRANT ALL ON public.audio_unlocks TO service_role;
ALTER TABLE public.audio_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own unlocks read" ON public.audio_unlocks FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.claim_audio_unlock(_audio_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.audio_unlocks WHERE user_id = auth.uid() AND audio_id = _audio_id) THEN RETURN true; END IF;
  SELECT id INTO uid FROM public.audio_unlocks WHERE user_id = auth.uid() AND audio_id IS NULL ORDER BY created_at LIMIT 1;
  IF uid IS NULL THEN RETURN false; END IF;
  UPDATE public.audio_unlocks SET audio_id = _audio_id, used_at = now() WHERE id = uid;
  RETURN true;
END $$;
REVOKE EXECUTE ON FUNCTION public.claim_audio_unlock(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_audio_unlock(uuid) TO authenticated;

CREATE POLICY "read unlocked audio" ON public.manifest_audios FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.audio_unlocks u WHERE u.user_id = auth.uid() AND u.audio_id = manifest_audios.id));
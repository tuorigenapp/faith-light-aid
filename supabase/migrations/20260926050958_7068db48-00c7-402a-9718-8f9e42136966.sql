DROP FUNCTION public.claim_audio_unlock(uuid);
DROP FUNCTION app_internal.claim_audio_unlock(uuid);
CREATE OR REPLACE FUNCTION app_internal.claim_audio_unlock(_category_id uuid, _day_index integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid; aid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT id INTO aid FROM public.manifest_audios WHERE category_id = _category_id AND day_index = _day_index LIMIT 1;
  IF aid IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.audio_unlocks WHERE user_id = auth.uid() AND audio_id = aid) THEN RETURN true; END IF;
  SELECT id INTO uid FROM public.audio_unlocks WHERE user_id = auth.uid() AND audio_id IS NULL ORDER BY created_at LIMIT 1;
  IF uid IS NULL THEN RETURN false; END IF;
  UPDATE public.audio_unlocks SET audio_id = aid, used_at = now() WHERE id = uid;
  RETURN true;
END $$;
REVOKE EXECUTE ON FUNCTION app_internal.claim_audio_unlock(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_internal.claim_audio_unlock(uuid, integer) TO authenticated;
CREATE OR REPLACE FUNCTION public.claim_audio_unlock(_category_id uuid, _day_index integer)
RETURNS boolean LANGUAGE sql SET search_path = public AS $$ SELECT app_internal.claim_audio_unlock(_category_id, _day_index) $$;
GRANT EXECUTE ON FUNCTION public.claim_audio_unlock(uuid, integer) TO authenticated;
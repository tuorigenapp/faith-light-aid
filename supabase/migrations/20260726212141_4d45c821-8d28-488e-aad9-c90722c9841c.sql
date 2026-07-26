ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS intention text,
  ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS content_pref text,
  ADD COLUMN IF NOT EXISTS profile_completed_at timestamptz;
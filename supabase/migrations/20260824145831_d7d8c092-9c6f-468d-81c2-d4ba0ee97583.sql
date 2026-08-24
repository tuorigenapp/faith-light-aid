ALTER TABLE public.marketing_campaigns
  ADD COLUMN IF NOT EXISTS max_per_day integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS sent_today integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
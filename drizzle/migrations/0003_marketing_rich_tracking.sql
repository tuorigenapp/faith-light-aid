ALTER TABLE public.marketing_campaigns
  ADD COLUMN IF NOT EXISTS push_style text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS push_icon text,
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'marketing',
  ADD COLUMN IF NOT EXISTS source_campaign_id uuid,
  ADD COLUMN IF NOT EXISTS open_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS template_id text,
  ADD COLUMN IF NOT EXISTS ai_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS discount_label text;
CREATE INDEX IF NOT EXISTS marketing_events_campaign_type_idx ON public.marketing_events (campaign_id, event_type);
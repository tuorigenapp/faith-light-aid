CREATE TABLE public.grace_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  from_plan text,
  days integer NOT NULL DEFAULT 7,
  status text NOT NULL DEFAULT 'requested',
  reason text NOT NULL DEFAULT '',
  admin_note text,
  starts_at timestamptz,
  ends_at timestamptz,
  purge_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.grace_periods TO authenticated;
GRANT UPDATE, DELETE ON public.grace_periods TO authenticated;
GRANT ALL ON public.grace_periods TO service_role;
ALTER TABLE public.grace_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grace read own or admin" ON public.grace_periods FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "grace request own" ON public.grace_periods FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "grace admin update" ON public.grace_periods FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "grace admin delete" ON public.grace_periods FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.grace_periods_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.days NOT IN (7, 14) THEN RAISE EXCEPTION 'days must be 7 or 14'; END IF;
  IF TG_OP = 'INSERT' AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := 'requested'; NEW.starts_at := NULL; NEW.ends_at := NULL; NEW.purge_at := NULL;
  END IF;
  IF NEW.status = 'active' AND NEW.starts_at IS NULL THEN
    NEW.starts_at := now();
  END IF;
  IF NEW.status = 'active' THEN
    NEW.ends_at := NEW.starts_at + make_interval(days => NEW.days);
    NEW.purge_at := NEW.ends_at + interval '30 days';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER grace_periods_guard BEFORE INSERT OR UPDATE ON public.grace_periods FOR EACH ROW EXECUTE FUNCTION public.grace_periods_guard();

CREATE TABLE public.plan_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  from_plan text,
  to_plan text NOT NULL,
  direction text NOT NULL DEFAULT 'up',
  note text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_change_requests TO authenticated;
GRANT ALL ON public.plan_change_requests TO service_role;
ALTER TABLE public.plan_change_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan change read" ON public.plan_change_requests FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "plan change insert" ON public.plan_change_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "plan change admin update" ON public.plan_change_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "plan change admin delete" ON public.plan_change_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quiz_date date NOT NULL DEFAULT current_date,
  level integer NOT NULL DEFAULT 1,
  question_id text NOT NULL,
  answer text NOT NULL,
  correct boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'app',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.quiz_answers TO authenticated;
GRANT ALL ON public.quiz_answers TO service_role;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz read own or admin" ON public.quiz_answers FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "quiz insert own" ON public.quiz_answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX quiz_answers_user_idx ON public.quiz_answers (user_id, quiz_date);

ALTER TABLE public.cancellation_surveys ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'final';
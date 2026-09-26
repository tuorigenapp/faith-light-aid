-- 1) Compras con comprobante
CREATE TABLE public.purchase_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  pack_id text NOT NULL,
  hojas integer NOT NULL CHECK (hojas > 0),
  usd numeric(10,2) NOT NULL CHECK (usd >= 0),
  method text NOT NULL DEFAULT 'transferencia',
  receipt_path text,
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','aprobada','rechazada','revision')),
  admin_note text,
  user_message text,
  appeal_message text,
  reviewed_by uuid REFERENCES auth.users,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.purchase_requests TO authenticated;
GRANT ALL ON public.purchase_requests TO service_role;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own purchases read" ON public.purchase_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own purchases insert" ON public.purchase_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pendiente');
CREATE POLICY "purchases update" ON public.purchase_requests FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER purchase_requests_updated_at BEFORE UPDATE ON public.purchase_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX purchase_requests_status_idx ON public.purchase_requests (status, created_at DESC);

-- Evita que una persona cambie el estado o el saldo de su propia compra
CREATE OR REPLACE FUNCTION public.purchase_request_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('role', true) <> 'service_role' AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
    NEW.hojas := OLD.hojas;
    NEW.usd := OLD.usd;
    NEW.admin_note := OLD.admin_note;
    NEW.user_message := OLD.user_message;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.reviewed_at := OLD.reviewed_at;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER purchase_requests_guard BEFORE UPDATE ON public.purchase_requests
  FOR EACH ROW EXECUTE FUNCTION public.purchase_request_guard();

-- 2) Transferencias de hojas: revisión y apelación
ALTER TABLE public.hoja_transfers
  ADD COLUMN IF NOT EXISTS admin_note text,
  ADD COLUMN IF NOT EXISTS user_message text,
  ADD COLUMN IF NOT EXISTS appeal_message text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();
CREATE TRIGGER hoja_transfers_updated_at BEFORE UPDATE ON public.hoja_transfers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "admin reads transfers" ON public.hoja_transfers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own transfer appeal" ON public.hoja_transfers FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.hoja_transfer_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('role', true) <> 'service_role' AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
    NEW.points := OLD.points;
    NEW.to_email := OLD.to_email;
    NEW.admin_note := OLD.admin_note;
    NEW.user_message := OLD.user_message;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.reviewed_at := OLD.reviewed_at;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER hoja_transfers_guard BEFORE UPDATE ON public.hoja_transfers
  FOR EACH ROW EXECUTE FUNCTION public.hoja_transfer_guard();

-- 3) Avisos de ORÍGEN (chat de solo lectura)
CREATE TABLE public.origen_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'sistema' CHECK (kind IN ('sistema','diario','compra','transferencia','comunidad','logro')),
  title text NOT NULL,
  body text NOT NULL,
  link text,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.origen_notifications TO authenticated;
GRANT ALL ON public.origen_notifications TO service_role;
ALTER TABLE public.origen_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notices read" ON public.origen_notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own notices mark read" ON public.origen_notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER origen_notifications_updated_at BEFORE UPDATE ON public.origen_notifications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX origen_notifications_user_idx ON public.origen_notifications (user_id, created_at DESC);
CREATE UNIQUE INDEX origen_notifications_daily_unique
  ON public.origen_notifications (user_id, ((created_at AT TIME ZONE 'UTC')::date))
  WHERE kind = 'diario';

-- 4) Limpieza espiritual administrable
CREATE TABLE public.limpieza_practices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  duration text NOT NULL DEFAULT '20 min',
  level smallint NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 3),
  objective text NOT NULL DEFAULT '',
  info jsonb NOT NULL DEFAULT '[]'::jsonb,
  materials jsonb NOT NULL DEFAULT '[]'::jsonb,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  scripture text,
  scripture_ref text,
  cover_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.limpieza_practices TO authenticated;
GRANT ALL ON public.limpieza_practices TO service_role;
ALTER TABLE public.limpieza_practices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published practices read" ON public.limpieza_practices FOR SELECT TO authenticated
  USING (is_published OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER limpieza_practices_updated_at BEFORE UPDATE ON public.limpieza_practices
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
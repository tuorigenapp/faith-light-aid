-- Hojas de bienvenida: 3 hojas (300 puntos) para que las consultas y el chat
-- se puedan usar desde el primer día.
ALTER TABLE public.profiles ALTER COLUMN gems SET DEFAULT 300;

INSERT INTO public.gem_transactions (user_id, amount, reason, meta)
SELECT p.id, 300 - COALESCE(p.gems, 0), 'bienvenida:hojas', jsonb_build_object('section','bienvenida')
FROM public.profiles p
WHERE COALESCE(p.gems, 0) < 300
  AND NOT EXISTS (
    SELECT 1 FROM public.gem_transactions t
    WHERE t.user_id = p.id AND t.reason = 'bienvenida:hojas'
  );

UPDATE public.profiles p
SET gems = 300
WHERE COALESCE(p.gems, 0) < 300;

-- El trigger de nuevos usuarios ya crea el perfil; ahora arranca con 3 hojas.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, referral_code, gems)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    UPPER(SUBSTR(REPLACE(NEW.id::text, '-', ''), 1, 8)),
    300)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $function$;
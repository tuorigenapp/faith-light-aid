
CREATE TABLE public.pareja_lecturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  self_name text, self_dob date,
  partner_name text, partner_dob date,
  question text, verdict text, summary text,
  pattern text, advice text, next_step text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pareja_lecturas TO authenticated;
GRANT ALL ON public.pareja_lecturas TO service_role;
ALTER TABLE public.pareja_lecturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own pareja read" ON public.pareja_lecturas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own pareja write" ON public.pareja_lecturas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  invited_email text,
  status text NOT NULL DEFAULT 'pending',
  reward_gems int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own referrals read" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "own referrals write" ON public.referrals FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "own referrals update" ON public.referrals FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE public.daily_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day date NOT NULL UNIQUE,
  question text NOT NULL,
  options jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.daily_reflections TO authenticated, anon;
GRANT ALL ON public.daily_reflections TO service_role;
ALTER TABLE public.daily_reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read reflections" ON public.daily_reflections FOR SELECT USING (true);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- Seed with jsonb_build_array to avoid quoting issues
INSERT INTO public.daily_reflections (day, question, options) VALUES
(CURRENT_DATE + 0, '¿Qué emoción sentiste con más fuerza hoy?', jsonb_build_array(
  jsonb_build_object('key','paz','label','Paz','response','Qué bello. La paz es la señal de un alma que confía. Cultívala hoy con un momento de silencio.'),
  jsonb_build_object('key','ansiedad','label','Ansiedad','response','La ansiedad es tu alma pidiéndote presencia. Respira lento tres veces y vuelve al ahora.'),
  jsonb_build_object('key','tristeza','label','Tristeza','response','La tristeza también sana. Permítete sentirla sin juzgarla. Está limpiando algo antiguo.')
)),
(CURRENT_DATE + 1, '¿Qué patrón de tu familia te gustaría transformar?', jsonb_build_array(
  jsonb_build_object('key','escasez','label','Escasez','response','Reconocerlo ya es empezar a romperlo. Hoy afirma: yo elijo abundancia con conciencia.'),
  jsonb_build_object('key','abandono','label','Abandono','response','Ese dolor no es tuyo, es heredado. Hoy te acompañas tú misma con ternura.'),
  jsonb_build_object('key','gritos','label','Gritos y conflicto','response','La paz también se elige. Hoy responde con voz suave, aunque te cueste.')
)),
(CURRENT_DATE + 2, '¿Qué necesita hoy tu niño interior?', jsonb_build_array(
  jsonb_build_object('key','abrazo','label','Un abrazo','response','Dátelo. Coloca la mano en tu pecho y respira. Estás a salvo.'),
  jsonb_build_object('key','jugar','label','Jugar','response','Regálate 5 minutos de algo que te haga reír. Sanar también es alegría.'),
  jsonb_build_object('key','escuchar','label','Ser escuchado','response','Escribe en tu diario sin filtros. Esa niña o niño necesita voz.')
)),
(CURRENT_DATE + 3, '¿Cómo describes tu relación con Dios hoy?', jsonb_build_array(
  jsonb_build_object('key','cercana','label','Cercana','response','Sigue alimentándola. Un minuto de gratitud multiplica tu conexión.'),
  jsonb_build_object('key','distante','label','Distante','response','Él nunca se fue. Cierra los ojos y di aquí estoy. Es suficiente.'),
  jsonb_build_object('key','confundida','label','Confundida','response','Está bien no entender todo. La fe se vive, no siempre se explica.')
)),
(CURRENT_DATE + 4, '¿A quién necesitas soltar hoy?', jsonb_build_array(
  jsonb_build_object('key','expareja','label','Una ex pareja','response','Soltar no es olvidar, es liberarte. Bendícele en silencio y suelta.'),
  jsonb_build_object('key','familiar','label','Un familiar','response','Puedes amar de lejos. Poner límites también es sanar el linaje.'),
  jsonb_build_object('key','yo','label','A ti misma del pasado','response','Perdónate. Aquella versión hizo lo que pudo con lo que sabía.')
)),
(CURRENT_DATE + 5, '¿Qué área quieres fortalecer esta semana?', jsonb_build_array(
  jsonb_build_object('key','amor','label','Amor propio','response','Empieza mirándote al espejo y diciendo tu nombre con ternura.'),
  jsonb_build_object('key','prosperidad','label','Prosperidad','response','La abundancia empieza en la gratitud por lo que ya tienes.'),
  jsonb_build_object('key','fe','label','Fe','response','Ábrele espacio. Cinco minutos diarios de silencio cambian todo.')
)),
(CURRENT_DATE + 6, '¿Qué te robó energía hoy?', jsonb_build_array(
  jsonb_build_object('key','noticias','label','Noticias','response','Cuida tu mente. Elige con qué la alimentas.'),
  jsonb_build_object('key','discusion','label','Una discusión','response','No siempre hay que ganar. A veces la paz es el trofeo.'),
  jsonb_build_object('key','redes','label','Redes sociales','response','Regálate 24 horas sin scroll. Tu alma respirará.')
)),
(CURRENT_DATE + 7, '¿Qué mereces recordarte hoy?', jsonb_build_array(
  jsonb_build_object('key','suficiente','label','Soy suficiente','response','Sí lo eres. Aún antes de lograr nada más.'),
  jsonb_build_object('key','amada','label','Soy amada','response','Por Él, siempre. Y hoy también por ti misma.'),
  jsonb_build_object('key','capaz','label','Soy capaz','response','Lo que has sobrevivido ya lo demuestra.')
)),
(CURRENT_DATE + 8, '¿Qué hábito quieres soltar?', jsonb_build_array(
  jsonb_build_object('key','quejarme','label','Quejarme','response','La queja repite el dolor. La gratitud lo transforma.'),
  jsonb_build_object('key','comparar','label','Compararme','response','Tu camino es único. Nadie más puede caminarlo.'),
  jsonb_build_object('key','postergar','label','Postergar','response','Un paso pequeño hoy vale más que un plan perfecto mañana.')
)),
(CURRENT_DATE + 9, '¿Qué te trae paz al instante?', jsonb_build_array(
  jsonb_build_object('key','musica','label','La música','response','Pon tu canción favorita y respira con ella.'),
  jsonb_build_object('key','naturaleza','label','La naturaleza','response','Sal 10 minutos. Camina descalza si puedes.'),
  jsonb_build_object('key','oracion','label','La oración','response','Aunque sea una frase. Él escucha todo.')
)),
(CURRENT_DATE + 10, '¿Qué le dirías a la persona que fuiste hace 5 años?', jsonb_build_array(
  jsonb_build_object('key','aguanta','label','Aguanta, vale la pena','response','Y valió. Mira lo lejos que has llegado.'),
  jsonb_build_object('key','perdon','label','Te perdono','response','Ese perdón es el más sanador de todos.'),
  jsonb_build_object('key','gracias','label','Gracias','response','Ella construyó a quien eres hoy.')
)),
(CURRENT_DATE + 11, '¿Qué te dijeron de niña que aún cargas?', jsonb_build_array(
  jsonb_build_object('key','nosirves','label','Que no sirvo','response','Mentira heredada. Hoy la sueltas. Tú sirves y mucho.'),
  jsonb_build_object('key','debil','label','Que soy débil','response','La sensibilidad es fuerza. No la escondas más.'),
  jsonb_build_object('key','exagerada','label','Que exagero','response','Sentir profundo es un don. Nunca te disculpes por eso.')
)),
(CURRENT_DATE + 12, '¿Cuál es tu mayor deseo del corazón hoy?', jsonb_build_array(
  jsonb_build_object('key','paz','label','Paz interior','response','Ya está en camino. Solo bájale al ruido.'),
  jsonb_build_object('key','amor','label','Amor sano','response','Empieza contigo. El resto llega en resonancia.'),
  jsonb_build_object('key','proposito','label','Encontrar mi propósito','response','Está donde tu corazón se enciende. Búscalo ahí.')
)),
(CURRENT_DATE + 13, '¿Cómo estás hoy, de verdad?', jsonb_build_array(
  jsonb_build_object('key','cansada','label','Cansada','response','Descansa sin culpa. El descanso también es obediencia.'),
  jsonb_build_object('key','esperanzada','label','Esperanzada','response','Sostén esa luz. Es tu brújula.'),
  jsonb_build_object('key','perdida','label','Un poco perdida','response','Está bien. Perderse a veces es como el alma encuentra un nuevo camino.')
))
ON CONFLICT (day) DO NOTHING;

UPDATE public.profiles
SET referral_code = UPPER(SUBSTR(REPLACE(id::text, '-', ''), 1, 8))
WHERE referral_code IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, referral_code)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    UPPER(SUBSTR(REPLACE(NEW.id::text, '-', ''), 1, 8)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $function$;

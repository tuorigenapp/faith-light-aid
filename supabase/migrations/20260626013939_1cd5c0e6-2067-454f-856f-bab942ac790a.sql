ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS day_index INTEGER,
  ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'suave',
  ADD COLUMN IF NOT EXISTS image_key TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.stages
  ADD COLUMN IF NOT EXISTS focus_area TEXT,
  ADD COLUMN IF NOT EXISTS problem_tags TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS deep_explanation TEXT,
  ADD COLUMN IF NOT EXISTS solution_steps JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS recommended_action TEXT,
  ADD COLUMN IF NOT EXISTS image_key TEXT;

CREATE TABLE public.daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  activity_type TEXT NOT NULL,
  reference_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_date, activity_type, reference_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_activity TO authenticated;
GRANT ALL ON public.daily_activity TO service_role;
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own daily activity" ON public.daily_activity FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.daily_devotionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_year INTEGER NOT NULL UNIQUE CHECK (day_of_year BETWEEN 1 AND 366),
  quote TEXT NOT NULL,
  scripture TEXT NOT NULL,
  word TEXT NOT NULL,
  reflection TEXT NOT NULL,
  challenge TEXT NOT NULL,
  image_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.daily_devotionals TO anon, authenticated;
GRANT ALL ON public.daily_devotionals TO service_role;
ALTER TABLE public.daily_devotionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily devotionals readable" ON public.daily_devotionals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "daily devotionals admin" ON public.daily_devotionals FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.daily_devotionals (day_of_year, quote, scripture, word, reflection, challenge, image_key) VALUES
(1,'Dios no termina una obra a mitad; hoy también sigue formando tu corazón.','Filipenses 1:6','Renuevo','Permite que este día sea una nueva oportunidad para respirar, ordenar tus pensamientos y volver al centro: Dios está contigo.','Escribe una cosa que deseas entregar a Dios hoy.','daily'),
(2,'El patrón se rompe contigo cuando decides caminar con verdad.','Juan 8:32','Libertad','Lo que reconoces con humildad puede ser sanado con gracia. No temas mirar tu historia con Dios al lado.','Nombra un patrón que deseas romper y ora por dirección.','journey'),
(3,'La paz no siempre cambia la situación; primero cambia tu interior.','Juan 14:27','Paz','Cuando el alma se agita, vuelve a la presencia. Dios no compite con el ruido; te invita al silencio.','Toma 5 minutos de respiración y oración lenta.','daily'),
(4,'Tu identidad no nace de tu herida, nace de lo que Dios dice de ti.','2 Corintios 5:17','Identidad','No eres lo que perdiste, ni lo que te hicieron, ni lo que temes. En Cristo hay una nueva historia.','Declara en voz alta tres verdades sobre quién eres en Dios.','hero'),
(5,'La fe crece cuando das un paso pequeño con obediencia grande.','Hebreos 11:6','Fe','No necesitas verlo todo para avanzar. A veces Dios solo alumbra el próximo paso.','Da hoy una acción concreta que llevas postergando.','journey'),
(6,'Dios también restaura casas, vínculos y generaciones.','Josué 24:15','Casa','Tu sanidad no se queda en ti: se convierte en luz para los tuyos.','Bendice por nombre a una persona de tu familia.','daily'),
(7,'Cuando oras, tu espíritu recuerda que no está solo.','Romanos 8:37','Victoria','La oración no es una fórmula: es volver al abrazo del Padre con todo lo que eres.','Haz una oración breve antes de abrir otra pantalla.','exercise')
ON CONFLICT (day_of_year) DO UPDATE SET
quote = EXCLUDED.quote,
scripture = EXCLUDED.scripture,
word = EXCLUDED.word,
reflection = EXCLUDED.reflection,
challenge = EXCLUDED.challenge,
image_key = EXCLUDED.image_key;

UPDATE public.exercises SET day_index = 1, difficulty = 'suave', image_key = 'exercise', sort_order = 1 WHERE category = 'gratitud';
UPDATE public.exercises SET day_index = 2, difficulty = 'profundo', image_key = 'exercise', sort_order = 2 WHERE category = 'perdon';
UPDATE public.exercises SET day_index = 3, difficulty = 'profundo', image_key = 'exercise', sort_order = 3 WHERE category = 'sanidad';
UPDATE public.exercises SET day_index = 4, difficulty = 'suave', image_key = 'daily', sort_order = 4 WHERE category = 'identidad';
UPDATE public.exercises SET day_index = 5, difficulty = 'medio', image_key = 'journey', sort_order = 5 WHERE category = 'fe';
UPDATE public.exercises SET day_index = 6, difficulty = 'medio', image_key = 'daily', sort_order = 6 WHERE category = 'familiar';
UPDATE public.exercises SET day_index = 7, difficulty = 'suave', image_key = 'exercise', sort_order = 7 WHERE category = 'pensamientos';
UPDATE public.exercises SET day_index = 1, difficulty = 'suave', image_key = 'hero', sort_order = 8 WHERE category = 'biblia';

INSERT INTO public.exercises (category, title, description, duration_minutes, steps, scripture, day_index, difficulty, image_key, sort_order) VALUES
('ansiedad','Respira con el Salmo 23','Una práctica breve para calmar el sistema emocional y volver a la confianza.',8,'["Siéntate con los pies firmes en el suelo","Inhala diciendo: El Señor es mi pastor","Exhala diciendo: nada me faltará","Repite durante 5 minutos","Escribe qué emoción bajó de intensidad"]'::jsonb,'Salmo 23:1',1,'suave','exercise',9),
('proposito','Mapa de propósito de 7 minutos','Conecta dones, cargas y pasos concretos para discernir dirección.',12,'["Escribe tres dones que otros reconocen en ti","Escribe tres dolores que te mueven a ayudar","Marca una intersección entre don y dolor","Ora por claridad","Define un paso pequeño para esta semana"]'::jsonb,'Juan 16:13',2,'medio','journey',10),
('familia','Carta que no necesariamente enviarás','Procesa un vínculo familiar con verdad, honra y límites.',18,'["Escribe el nombre de la persona","Describe lo que dolió sin adornarlo","Escribe lo que decides soltar","Define un límite sano","Ora entregando la relación a Dios"]'::jsonb,'Romanos 12:18',3,'profundo','daily',11),
('fe','Declaración contra el miedo','Transforma un pensamiento de temor en una confesión de fe.',7,'["Nombra el miedo principal","Busca una promesa bíblica relacionada","Escribe una declaración corta","Repítela tres veces con calma","Haz una acción pequeña en dirección contraria al miedo"]'::jsonb,'2 Timoteo 1:7',4,'suave','hero',12)
ON CONFLICT DO NOTHING;

UPDATE public.stages SET
  focus_area = 'linaje',
  problem_tags = ARRAY['familia','patrones','culpa','origen'],
  deep_explanation = 'Esta etapa ayuda a mirar tu historia familiar sin condena. El objetivo no es culpar a tus padres o ancestros, sino reconocer patrones emocionales, espirituales y de conducta que se repiten para renunciarlos con conciencia y fe.',
  solution_steps = '["Haz una línea sencilla de tu historia familiar","Identifica tres patrones que se repiten","Ora renunciando a lo que no pertenece al diseño de Dios","Elige una respuesta nueva para esta semana"]'::jsonb,
  recommended_action = 'Completa un mapa familiar y escribe en tu diario qué patrón quieres romper primero.',
  image_key = 'journey'
WHERE id = 1;
UPDATE public.stages SET
  focus_area = 'sanidad emocional',
  problem_tags = ARRAY['heridas','rechazo','madre','padre','dolor'],
  deep_explanation = 'Aquí trabajas heridas profundas desde la presencia de Dios. No se trata de negar lo vivido, sino de permitir que el Alfarero toque la memoria, nombre el dolor y restaure la identidad que fue afectada.',
  solution_steps = '["Nombra la herida sin juzgarte","Identifica qué mentira produjo en ti","Preséntala a Dios en oración","Practica perdón como proceso, no como obligación instantánea"]'::jsonb,
  recommended_action = 'Realiza un ejercicio de sanidad o escribe una carta privada de liberación.',
  image_key = 'daily'
WHERE id = 2;
UPDATE public.stages SET
  focus_area = 'reconexión',
  problem_tags = ARRAY['fe','distancia','oracion','desanimo'],
  deep_explanation = 'La reconexión con Dios se cultiva en hábitos pequeños y sinceros. Esta etapa te invita a volver a la oración, la Palabra y la escucha del Espíritu Santo sin religiosidad ni presión.',
  solution_steps = '["Aparta 10 minutos diarios","Ora con palabras simples","Lee un pasaje corto","Pregunta: Espíritu Santo, ¿qué quieres enseñarme hoy?"]'::jsonb,
  recommended_action = 'Inicia una rutina de 7 días: oración breve, lectura y una nota en el diario.',
  image_key = 'hero'
WHERE id = 3;
UPDATE public.stages SET
  focus_area = 'identidad',
  problem_tags = ARRAY['autoestima','rechazo','vergüenza','identidad'],
  deep_explanation = 'Cuando la identidad se rompe, la persona vive desde etiquetas. Esta etapa confronta esas etiquetas con la verdad bíblica: eres amado, restaurado y llamado por Dios.',
  solution_steps = '["Escribe las etiquetas que has cargado","Busca una verdad bíblica que las contradiga","Declara esa verdad cada mañana","Actúa como alguien que ya fue restaurado"]'::jsonb,
  recommended_action = 'Practica declaraciones de identidad por 7 días.',
  image_key = 'daily'
WHERE id = 4;
UPDATE public.stages SET
  focus_area = 'disciplina espiritual',
  problem_tags = ARRAY['habitos','constancia','debilidad','crecimiento'],
  deep_explanation = 'El crecimiento espiritual necesita estructura. No para ganar el amor de Dios, sino para permanecer conectado a la fuente que fortalece tu carácter.',
  solution_steps = '["Elige una disciplina: oración, lectura o ayuno","Hazla pequeña y sostenible","Registra tu avance","Celebra la constancia, no la perfección"]'::jsonb,
  recommended_action = 'Activa un hábito espiritual de 10 minutos diarios durante una semana.',
  image_key = 'exercise'
WHERE id = 5;
UPDATE public.stages SET
  focus_area = 'restauración familiar',
  problem_tags = ARRAY['familia','hogar','relaciones','perdon'],
  deep_explanation = 'La restauración familiar empieza en un corazón dispuesto. A veces implica reconciliación; otras veces límites sanos. En ambos casos, Dios te guía a ser luz sin permitir destrucción.',
  solution_steps = '["Ora por tu casa por nombre","Distingue perdón de reconciliación inmediata","Define un acto de honra seguro","Establece un límite donde sea necesario"]'::jsonb,
  recommended_action = 'Bendice tu hogar y escribe un límite sano que necesitas respetar.',
  image_key = 'daily'
WHERE id = 6;
UPDATE public.stages SET
  focus_area = 'propósito',
  problem_tags = ARRAY['proposito','llamado','direccion','confusion'],
  deep_explanation = 'El propósito se descubre caminando con Dios. Esta etapa te ayuda a unir historia, dones, carga espiritual y obediencia práctica para discernir próximos pasos.',
  solution_steps = '["Identifica dones y cargas","Ora por dirección","Pide consejo sabio","Da un primer paso medible"]'::jsonb,
  recommended_action = 'Crea tu mapa de propósito y define una acción de 7 días.',
  image_key = 'journey'
WHERE id = 7;
UPDATE public.stages SET
  focus_area = 'vida transformada',
  problem_tags = ARRAY['testimonio','frutos','servicio','constancia'],
  deep_explanation = 'La transformación se confirma en frutos. Esta etapa integra lo aprendido para que tu vida se convierta en testimonio, servicio y una nueva manera de responder.',
  solution_steps = '["Escribe tu testimonio antes y después","Elige una forma de servir","Mantén tus hábitos base","Comparte esperanza con alguien"]'::jsonb,
  recommended_action = 'Escribe tu testimonio y compártelo con una persona de confianza.',
  image_key = 'hero'
WHERE id = 8;
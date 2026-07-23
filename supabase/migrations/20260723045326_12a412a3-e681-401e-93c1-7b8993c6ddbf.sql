
CREATE TABLE IF NOT EXISTS public.daily_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day date NOT NULL UNIQUE,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_key text NOT NULL,
  explanation text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.daily_quizzes TO authenticated, anon;
GRANT ALL ON public.daily_quizzes TO service_role;
ALTER TABLE public.daily_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quizzes readable" ON public.daily_quizzes FOR SELECT USING (true);

INSERT INTO public.daily_quizzes (day, question, options, correct_key, explanation) VALUES
(CURRENT_DATE + 0, '¿Qué es un patrón ancestral?', '[{"key":"a","label":"Una casualidad familiar"},{"key":"b","label":"Una repetición emocional que se hereda"},{"key":"c","label":"Un castigo divino"}]', 'b', 'Es una repetición emocional y de comportamiento que pasa de generación en generación hasta que alguien la ve y la sana.'),
(CURRENT_DATE + 1, 'El primer paso para sanar un patrón es…', '[{"key":"a","label":"Reconocerlo con honestidad"},{"key":"b","label":"Culpar a los padres"},{"key":"c","label":"Olvidarlo"}]', 'a', 'Sin conciencia no hay cambio. Reconocer el patrón te devuelve el poder de elegir distinto.'),
(CURRENT_DATE + 2, 'Cuando repites una relación difícil, suele significar…', '[{"key":"a","label":"Mala suerte"},{"key":"b","label":"Que tu sistema busca sanar algo antiguo"},{"key":"c","label":"Que estás rota"}]', 'b', 'Repetimos lo que no hemos sanado. Cada relación es una oportunidad para ver el patrón y elegir amor consciente.'),
(CURRENT_DATE + 3, 'La gratitud, dentro del proceso ORIGEN, sirve para…', '[{"key":"a","label":"Bajar la vibración"},{"key":"b","label":"Abrir el corazón y transmutar la carga"},{"key":"c","label":"Distraerte del dolor"}]', 'b', 'La gratitud reordena tu energía y disuelve resistencia. Es una llave real para transmutar dolor.'),
(CURRENT_DATE + 4, '¿Qué son las Gemas de Sanación?', '[{"key":"a","label":"Un puntaje sin propósito"},{"key":"b","label":"Reconocimiento de tu compromiso diario"},{"key":"c","label":"Monedas para comprar contenido"}]', 'b', 'Cada gema representa un acto real de sanación: agradecer, reflexionar, reconocer un familiar, avanzar en tu camino.'),
(CURRENT_DATE + 5, 'Perdonar a un ancestro significa…', '[{"key":"a","label":"Justificar lo que hizo"},{"key":"b","label":"Soltar la carga que llevo por él o ella"},{"key":"c","label":"Olvidar todo"}]', 'b', 'Perdonar es liberarte. No aprueba el daño; te devuelve la paz que te pertenece.'),
(CURRENT_DATE + 6, 'El método 3-6-9 se practica…', '[{"key":"a","label":"Una sola vez"},{"key":"b","label":"Con constancia diaria"},{"key":"c","label":"Solo en luna llena"}]', 'b', 'Su fuerza está en la repetición consciente: 3 veces mañana, 6 tarde, 9 noche.'),
(CURRENT_DATE + 7, 'La infancia es importante en tu camino porque…', '[{"key":"a","label":"Marca creencias inconscientes"},{"key":"b","label":"Ya no importa"},{"key":"c","label":"Solo si fue traumática"}]', 'a', 'En la infancia se instalan las creencias base sobre el amor, el dinero y tu valor. Verlas es el inicio de reescribirlas.'),
(CURRENT_DATE + 8, 'Cuando aparece resistencia a hacer un ejercicio, significa…', '[{"key":"a","label":"Que no sirve"},{"key":"b","label":"Que estás tocando algo importante"},{"key":"c","label":"Que debes rendirte"}]', 'b', 'La resistencia suele señalar el lugar exacto donde vive la sanación. Respira y avanza suave.'),
(CURRENT_DATE + 9, 'Tu Árbol Genealógico en ORIGEN sirve para…', '[{"key":"a","label":"Presumir familia"},{"key":"b","label":"Ver el linaje y romper cadenas"},{"key":"c","label":"Registrar contactos"}]', 'b', 'Cada familiar que reconoces te ayuda a entender de dónde vienen tus patrones y a liberarlos con amor.'),
(CURRENT_DATE + 10, 'Prosperidad, en este camino, es sobre todo…', '[{"key":"a","label":"Merecer y recibir con paz"},{"key":"b","label":"Tener más que otros"},{"key":"c","label":"Suerte"}]', 'a', 'La prosperidad real es interior: coherencia entre lo que quieres, lo que crees y lo que te permites recibir.'),
(CURRENT_DATE + 11, 'Si sientes un vacío sin motivo aparente, suele venir de…', '[{"key":"a","label":"Tu personalidad"},{"key":"b","label":"Una emoción heredada no expresada"},{"key":"c","label":"El clima"}]', 'b', 'Muchas emociones que sentimos no son nuestras; son ecos ancestrales pidiendo ser vistos y liberados.'),
(CURRENT_DATE + 12, 'La constancia diaria te da…', '[{"key":"a","label":"Resultados profundos y sostenibles"},{"key":"b","label":"Cansancio"},{"key":"c","label":"Nada especial"}]', 'a', 'Sanar no es un evento, es una práctica. Un poco cada día mueve montañas internas.'),
(CURRENT_DATE + 13, 'Un mantra o afirmación funciona cuando…', '[{"key":"a","label":"Lo repites sin sentir"},{"key":"b","label":"Lo sientes en el cuerpo"},{"key":"c","label":"Lo escribes una vez"}]', 'b', 'La palabra crea cuando la sostiene la emoción. Siente lo que declaras.'),
(CURRENT_DATE + 14, 'El propósito de tu Camino ORIGEN es…', '[{"key":"a","label":"Ser perfecto"},{"key":"b","label":"Reconciliarte contigo y tu historia"},{"key":"c","label":"Complacer a otros"}]', 'b', 'Sanar no es dejar de sentir: es reconciliarte con lo vivido y elegir cómo continuar.'),
(CURRENT_DATE + 15, 'La reflexión diaria te ayuda a…', '[{"key":"a","label":"Perder tiempo"},{"key":"b","label":"Escucharte y elegir consciente"},{"key":"c","label":"Distraerte"}]', 'b', 'Un minuto de reflexión honesta cambia el resto del día. Es tu brújula interior.'),
(CURRENT_DATE + 16, 'Cuando alguien te hiere, sanar implica…', '[{"key":"a","label":"Reprimir el dolor"},{"key":"b","label":"Sentir, comprender y soltar"},{"key":"c","label":"Devolver el daño"}]', 'b', 'Sentir sin evadir, comprender el aprendizaje y soltar. Ese es el orden que libera.'),
(CURRENT_DATE + 17, 'Tu diario en ORIGEN sirve para…', '[{"key":"a","label":"Sacar lo interno y verte con claridad"},{"key":"b","label":"Quejarte sin propósito"},{"key":"c","label":"Nada, es opcional"}]', 'a', 'Escribir lo hace visible; visible lo hace transformable. Tu diario es tu espejo íntimo.'),
(CURRENT_DATE + 18, 'La abundancia se bloquea, sobre todo, por…', '[{"key":"a","label":"Falta de dinero"},{"key":"b","label":"Creencias heredadas de escasez"},{"key":"c","label":"Falta de trabajo"}]', 'b', 'Detrás de un bloqueo económico casi siempre hay una historia familiar que grita "no es para mí". Verla la disuelve.'),
(CURRENT_DATE + 19, 'Un patrón se rompe cuando…', '[{"key":"a","label":"Lo ignoras"},{"key":"b","label":"Lo reconoces, sientes y eliges distinto"},{"key":"c","label":"Otro lo rompe por ti"}]', 'b', 'Reconocer + sentir + acción nueva = cadena rota. Nadie puede hacerlo por ti, y eso es tu poder.'),
(CURRENT_DATE + 20, 'El mejor momento para empezar es…', '[{"key":"a","label":"Mañana"},{"key":"b","label":"Cuando estés lista"},{"key":"c","label":"Hoy, imperfectamente"}]', 'c', 'La sanación no espera perfección. Empieza hoy, un paso, y el camino te sostiene.')
ON CONFLICT (day) DO NOTHING;

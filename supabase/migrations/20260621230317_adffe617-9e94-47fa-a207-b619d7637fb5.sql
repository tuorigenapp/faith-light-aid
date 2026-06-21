
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  country TEXT,
  age INTEGER,
  avatar_url TEXT,
  bio TEXT,
  current_stage INTEGER NOT NULL DEFAULT 1,
  spiritual_level TEXT NOT NULL DEFAULT 'inicial',
  consecutive_days INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "admins read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile and default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  ai_messages_used INTEGER NOT NULL DEFAULT 0,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own sub" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own sub" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own sub" ON public.subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins all subs" ON public.subscriptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER subs_touch BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nueva conversación',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own conversations" ON public.conversations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER conv_touch BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX msg_conv_idx ON public.messages(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages" ON public.messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Journal
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('oracion','gratitud','reflexion','testimonio','meta')),
  title TEXT,
  content TEXT NOT NULL,
  mood TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own journal" ON public.journal_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER journal_touch BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Diagnostic
CREATE TABLE public.diagnostic_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  scores JSONB NOT NULL,
  level TEXT NOT NULL,
  strengths TEXT[],
  weaknesses TEXT[],
  risks TEXT[],
  recommended_plan TEXT,
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostic_results TO authenticated;
GRANT ALL ON public.diagnostic_results TO service_role;
ALTER TABLE public.diagnostic_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own diagnostics" ON public.diagnostic_results FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Stages catalog
CREATE TABLE public.stages (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  scripture TEXT,
  scripture_reference TEXT,
  reflection TEXT,
  prayer TEXT,
  tasks JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stages TO authenticated, anon;
GRANT ALL ON public.stages TO service_role;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stages public read" ON public.stages FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "stages admin write" ON public.stages FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.stages (id, title, subtitle, description, scripture, scripture_reference, reflection, prayer, tasks) VALUES
(1,'Reconociendo el origen de los patrones','Genealogía espiritual','Identifica los patrones generacionales y el linaje espiritual que han influido en tu vida. Tu historia no comienza contigo, comienza en tu linaje.','Antes que te formase en el vientre te conocí.','Jeremías 1:5','Muchas personas dudan de la palabra de Dios porque desconocen su identidad ancestral. Pregúntate: ¿qué patrones se repiten en mi familia? ¿Hay ciclos de dolor, escasez, ruptura, miedo o adicción que han pasado de generación en generación? Reconocer es el primer paso para romper.','Padre, en el nombre de Jesús, te pido revelación sobre mi linaje. Muéstrame todo pacto, palabra o decreto que aún tenga acceso legal sobre mi vida. Yo renuncio hoy a todo lo que no viene de Ti, y declaro que conmigo se rompe el patrón.','["Escribe 3 patrones que has visto repetirse en tu familia","Identifica una palabra que tus ancestros declararon sobre tu linaje","Realiza la oración de liberación ancestral"]'::jsonb),
(2,'Sanidad emocional','Sanando el linaje femenino y masculino','Lleva al Alfarero las heridas maternales y paternales. Permite que Dios restaure la vasija rota.','¿No podré yo hacer de vosotros como este alfarero?','Jeremías 18:6','El Alfarero no desecha la vasija rota: la rehace. Pídele a Dios que sane las heridas de rechazo, abandono, abuso o ausencia que llevas en tu corazón.','Señor, sana las heridas que llevo del padre y de la madre. Lléname de tu amor donde hubo carencia. Restáurame como vasija nueva en tus manos.','["Escribe una carta de perdón a tus padres (no se la entregas)","Identifica 1 herida de rechazo, 1 de abandono, 1 de abuso","Ora la oración de sanidad del linaje"]'::jsonb),
(3,'Reconexión con Dios','Conectar con Dios y la fe','Reaviva tu relación con el Espíritu Santo. La fe es el puente.','Sin fe es imposible agradar a Dios.','Hebreos 11:6','Reconectarse con Dios no es un acto, es una postura diaria de dependencia, intimidad y obediencia.','Espíritu Santo, ven a mí. Sé tú mi mentor, mi consejero, mi mejor amigo. Enséñame a caminar contigo cada día.','["Aparta 15 minutos al día solo para Dios durante 7 días","Lee Salmos 23 cada mañana de esta semana","Escribe qué te ha dicho Dios"]'::jsonb),
(4,'Renovación de identidad','Destrucción de las obras de la carne','Rompe con la vieja identidad. Camina como hijo o hija del Reino.','El que está en Cristo, nueva criatura es.','2 Corintios 5:17','Tu identidad no es lo que te hicieron, es lo que Dios dice de ti.','Padre, declaro que soy nueva criatura. Lo viejo pasó. Recibo mi identidad como hijo/a tuyo/a.','["Escribe 7 declaraciones de identidad bíblica sobre tu vida","Renuncia a una etiqueta que no viene de Dios","Memoriza Romanos 8:37"]'::jsonb),
(5,'Fortalecimiento espiritual','Nuevo nacimiento espiritual','Crece en oración, lectura bíblica y disciplinas espirituales.','Es necesario nacer de nuevo.','Juan 3:3','Después del nacimiento viene el crecimiento. No te quedes en pañales espirituales.','Señor, fortalece mi espíritu. Que mi vida interior crezca más que mis circunstancias.','["Inicia un plan bíblico de 21 días","Ayuna medio día con un propósito específico","Únete a una comunidad de fe"]'::jsonb),
(6,'Restauración familiar','Reconstrucción del altar familiar','Sé el sacerdote o sacerdotisa de tu casa.','Yo y mi casa serviremos a Jehová.','Josué 24:15','Lo que se restaura en ti se proyecta sobre tu casa.','Padre, restaura mi familia. Que mi casa sea altar para Ti.','["Inicia un altar familiar 1 vez por semana","Pide perdón a un familiar a quien hayas herido","Bendice por nombre a tus hijos/familiares"]'::jsonb),
(7,'Propósito y llamado','Dirección o guianza del Espíritu Santo','Descubre el propósito por el cual fuiste enviado.','Cuando venga el Espíritu de verdad, él os guiará.','Juan 16:13','Tu propósito no se inventa, se descubre en intimidad con Dios.','Espíritu Santo, revela el propósito por el cual nací. Dame oídos para oír y pies para caminar en él.','["Escribe los dones que Dios te ha dado","Pide al Espíritu Santo dirección sobre los próximos 90 días","Da un primer paso concreto hacia tu llamado"]'::jsonb),
(8,'Vida transformada','Caminando por fe','Vive la nueva vida en Cristo. Sé testimonio.','Por fe andamos, no por vista.','2 Corintios 5:7','La transformación se demuestra en frutos. Tu vida ahora es testimonio.','Señor, que mi vida sea carta leída por todos los hombres. Úsame para llevar restauración a otros.','["Comparte tu testimonio con 1 persona esta semana","Sirve a alguien en necesidad","Disciplina diaria: oración, palabra, gratitud"]'::jsonb);

-- Stage progress
CREATE TABLE public.stage_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage_id INTEGER NOT NULL REFERENCES public.stages(id),
  status TEXT NOT NULL DEFAULT 'in_progress',
  notes TEXT,
  completed_tasks JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, stage_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stage_progress TO authenticated;
GRANT ALL ON public.stage_progress TO service_role;
ALTER TABLE public.stage_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own stage progress" ON public.stage_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER sp_touch BEFORE UPDATE ON public.stage_progress FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Exercises catalog
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  steps JSONB,
  scripture TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.exercises TO authenticated, anon;
GRANT ALL ON public.exercises TO service_role;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exercises public" ON public.exercises FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "exercises admin" ON public.exercises FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.exercises (category, title, description, duration_minutes, steps, scripture) VALUES
('perdon','Liberación a través del perdón','Ejercicio guiado para perdonar a alguien que te hirió.',15,'["Pide al Espíritu Santo que traiga a tu mente esa persona","Escribe lo que te hizo y cómo te hizo sentir","Declara en voz alta: yo te perdono","Suelta la deuda que sientes que tiene contigo","Bendice a esa persona en oración"]','Mateo 6:14'),
('gratitud','Diario de gratitud diaria','Cultiva un corazón agradecido escribiendo 3 cosas cada día.',5,'["Anota 3 cosas por las que estás agradecido hoy","Escribe el porqué de cada una","Da gracias a Dios en voz alta"]','1 Tesalonicenses 5:18'),
('sanidad','Sanidad de heridas maternales','Lleva al Alfarero la herida con mamá.',20,'["Cierra los ojos y respira profundo","Pide a Jesús que se siente contigo y con tu madre interior","Identifica la herida principal","Permite que Jesús hable a esa niña/o","Recibe sanidad y declara perdón"]','Salmo 27:10'),
('identidad','Declaraciones de identidad','7 declaraciones bíblicas sobre quién eres.',10,'["Soy hijo/a amado/a de Dios","Soy nueva criatura en Cristo","Soy más que vencedor","Soy embajador del Reino","Soy templo del Espíritu Santo","Soy la cabeza y no la cola","Soy bendito/a en todo"]','2 Corintios 5:17'),
('fe','Caminata de fe','Da un paso concreto basado en una promesa.',30,'["Identifica 1 promesa de Dios para tu vida","Pregúntate: ¿qué paso de obediencia requiere?","Da ese paso esta semana","Anota qué pasó"]','Hebreos 11:6'),
('familiar','Bendición sobre la casa','Recorre tu hogar bendiciendo cada habitación.',15,'["Camina por cada habitación","Declara: esta casa pertenece al Señor","Unge con aceite si lo deseas","Ora por cada miembro por nombre"]','Josué 24:15'),
('pensamientos','Cautivar pensamientos','Identifica y reemplaza un pensamiento intrusivo.',10,'["Identifica el pensamiento que te atormenta","Escríbelo","Búscalo a la luz de la palabra","Reemplázalo con una verdad bíblica","Decláralo en voz alta"]','2 Corintios 10:5'),
('biblia','Lectura bíblica guiada','Lectio Divina: lee, medita, ora, contempla.',20,'["Elige un pasaje (ej. Salmo 23)","Léelo despacio 3 veces","Identifica la palabra que te impacta","Medita en ella","Ora a partir de esa palabra"]','Salmo 119:105');

-- Exercise completions
CREATE TABLE public.exercise_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_completions TO authenticated;
GRANT ALL ON public.exercise_completions TO service_role;
ALTER TABLE public.exercise_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own completions" ON public.exercise_completions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Library
CREATE TABLE public.library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('ebook','audio','curso','seminario','devocional','recurso')),
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  resource_url TEXT,
  required_plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.library_items TO authenticated, anon;
GRANT ALL ON public.library_items TO service_role;
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "library public read" ON public.library_items FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "library admin" ON public.library_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.library_items (category, kind, title, description, required_plan) VALUES
('Libro principal','ebook','Reconectando el Espíritu con Dios','Libro completo de Ruth Esther Paredes Sufran. Caminando hacia la revelación del Reino con la guianza del Espíritu Santo.','free'),
('Devocional','devocional','21 días de intimidad con el Espíritu Santo','Devocional diario para cultivar tu relación con el Espíritu Santo.','basico'),
('Curso','curso','Sanidad del linaje','Curso completo de 8 sesiones sobre liberación generacional.','avanzado'),
('Audio','audio','Oraciones de liberación','Set de oraciones guiadas en audio.','basico'),
('Seminario','seminario','Identidad en Cristo','Seminario en video sobre identidad espiritual.','avanzado');

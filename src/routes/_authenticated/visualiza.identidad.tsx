import { thematicPractice } from "@/lib/visualiza-content";
import { SubtopicIcon } from "@/components/visualiza/SubtopicIcon";
import { ManagedImage } from "@/components/ManagedImage";
import { useSessionState } from "@/hooks/use-session-step";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, ArrowRight, Sparkles, Heart, Star, Compass, Target, Zap, Crown,
  Eye, PenLine, Brain, BookOpen, Lock, Check, Play, Info, Clock, Bell,
  Trophy, Bookmark, CheckCircle2, MousePointerClick, Flame, ShieldCheck, Repeat,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getUserPlan } from "@/lib/plan";
import { awardGems } from "@/lib/gems";
import { cn } from "@/lib/utils";
import { WordSearch } from "@/components/WordSearch";
import { StageQuiz } from "@/components/StageQuiz";
import heroImg from "@/assets/explore/identity.jpg";

export const Route = createFileRoute("/_authenticated/visualiza/identidad")({
  head: () => ({ meta: [{ title: "Salto de Identidad — ORÍGEN" }, { name: "description", content: "Reflexiones y acciones para fortalecer tu identidad con fe cristiana en ORÍGEN." }, { property: "og:title", content: "Salto de Identidad — ORÍGEN" }, { property: "og:description", content: "Cultiva hábitos y una identidad firme, un paso a la vez." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: IdentidadPage,
});

type Practice = {
  id: string;
  title: string;
  duration: string;
  level: 1 | 2 | 3;
  Icon: typeof Star;
  color: string;
  bg: string;
  objective: string;
  questions: string[];
  actionPlan: string[];
  info: string[];
  steps: string[];
  affirmations: string[];
  scripture: { text: string; ref: string };
};

const PRACTICES: Practice[] = [
  {
    id: "future-self",
    title: "Future Self (Visualización)",
    duration: "15 min",
    level: 1,
    Icon: Eye,
    color: "#7C5CFF",
    bg: "#EDE7FF",
    objective: "Encontrarte con la versión de ti que ya vive tu meta y traer su energía a hoy.",
    questions: [
      "¿Cómo se ve mi yo futuro dentro de 1 año?",
      "¿Cómo camina, habla y decide?",
      "¿Qué hábitos ya tiene incorporados?",
      "¿Qué mensaje me da hoy?",
    ],
    actionPlan: [
      "Escribir una carta desde mi yo futuro a mi yo de hoy.",
      "Elegir 1 hábito de esa versión y practicarlo esta semana.",
      "Poner una foto o palabra ancla en un lugar visible.",
    ],
    info: [
      "Ideal para claridad de propósito y motivación diaria.",
      "Hazla en un lugar tranquilo con los ojos cerrados.",
      "Duración aproximada: 15 minutos.",
    ],
    steps: [
      "Cierra los ojos y respira 3 veces profundo.",
      "Visualiza tu vida dentro de 1 año exactamente como la deseas.",
      "Observa detalles: tu casa, tu cuerpo, tu paz.",
      "Camina hacia esa versión y abrázala.",
      "Escucha lo que quiere decirte hoy.",
      "Vuelve al presente y anota lo recibido.",
    ],
    affirmations: [
      "Hoy actúo con valentía.",
      "Cada decisión me acerca a mi meta.",
      "Soy constante en mis hábitos.",
      "Aprendo cada día.",
      "Confío en mi capacidad para crecer.",
      "Mi esfuerzo construye mi futuro.",
      "Soy disciplinado.",
      "Mi identidad cambia mediante mis acciones.",
    ],
    scripture: { text: "Porque yo sé los pensamientos que tengo acerca de vosotros, pensamientos de paz, y no de mal, para daros el fin que esperáis.", ref: "Jeremías 29:11" },
  },
  {
    id: "scripting",
    title: "Scripting (Escritura)",
    duration: "15 min",
    level: 1,
    Icon: PenLine,
    color: "#5AA9FF",
    bg: "#DCEBFF",
    objective: "Reescribir tu historia en presente para que tu mente adopte la nueva identidad.",
    questions: [
      "¿Qué historia me cuento sobre mí hoy?",
      "¿Qué historia deseo empezar a contarme?",
      "¿Qué evidencia real ya tengo de esa nueva versión?",
    ],
    actionPlan: [
      "Escribir 1 página como si ya vivieras esa vida.",
      "Leerla en voz alta cada mañana.",
      "Actualizarla cada 7 días.",
    ],
    info: [
      "Se recomienda hacerlo en un cuaderno físico.",
      "Escribe en presente, no en futuro.",
      "Duración aproximada: 15 minutos.",
    ],
    steps: [
      "Elige un área de tu vida a transformar.",
      "Describe tu día ideal en primera persona.",
      "Incluye emociones y detalles sensoriales.",
      "Termina con 3 gracias en presente.",
    ],
    affirmations: [
      "Escribo mi realidad con fe.",
      "Mis palabras crean mi mundo.",
      "Soy la autora de mi historia.",
      "Cada palabra siembra mi futuro.",
    ],
    scripture: { text: "La muerte y la vida están en poder de la lengua.", ref: "Proverbios 18:21" },
  },
  {
    id: "diseno-identidad",
    title: "Diseño de Identidad",
    duration: "20 min",
    level: 2,
    Icon: Crown,
    color: "#F5B441",
    bg: "#FFF3D6",
    objective: "Construir una identidad alineada con la vida que deseas crear.",
    questions: [
      "¿Quién quiero llegar a ser?",
      "¿Cómo actúa esa persona?",
      "¿Qué hábitos tiene?",
      "¿Qué decisiones toma cada día?",
    ],
    actionPlan: [
      "Buscar recursos y referentes de esa versión.",
      "Inscribirte en un aprendizaje relacionado.",
      "Leer 20 minutos diarios sobre el área.",
      "Ver una conferencia relacionada esta semana.",
      "Hablar con un profesional del área.",
      "Organizar tu plan de estudio o práctica.",
    ],
    info: [
      "Práctica clave para transformación profunda.",
      "Combina bien con Future Self y Scripting.",
      "Duración aproximada: 20 minutos.",
    ],
    steps: [
      "Define en 1 frase quién quieres ser.",
      "Lista 5 hábitos innegociables de esa persona.",
      "Elige 1 para comenzar hoy.",
      "Diseña recordatorios y anclas.",
      "Actúa como esa persona por 15 minutos hoy.",
    ],
    affirmations: [
      "Soy la persona que decido ser.",
      "Mis hábitos construyen mi identidad.",
      "Actúo desde mi mejor versión.",
      "Cada día elijo evolucionar.",
    ],
    scripture: { text: "No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento.", ref: "Romanos 12:2" },
  },
  {
    id: "reprogramacion-creencias",
    title: "Reprogramación de Creencias",
    duration: "20 min",
    level: 2,
    Icon: Brain,
    color: "#A78BFA",
    bg: "#EDE7FF",
    objective: "Reemplazar creencias limitantes por convicciones que te empujan hacia adelante.",
    questions: [
      "¿Qué creencia me detiene hoy?",
      "¿De dónde vino?",
      "¿Qué nueva creencia deseo instalar?",
    ],
    actionPlan: [
      "Identificar 3 creencias limitantes.",
      "Reescribir cada una en positivo.",
      "Repetirlas 21 días con evidencia.",
    ],
    info: [
      "Basado en principios de neurociencia y fe.",
      "Recomendado hacerlo con constancia.",
      "Duración aproximada: 20 minutos.",
    ],
    steps: [
      "Escribe la creencia limitante.",
      "Cuestiona su origen y veracidad.",
      "Escribe la nueva creencia empoderadora.",
      "Actúa hoy como si ya fuese cierta.",
    ],
    affirmations: ["Mi mente se renueva cada día.", "Elijo creencias que me construyen.", "Soy capaz de cambiar."],
    scripture: { text: "Todo lo puedo en Cristo que me fortalece.", ref: "Filipenses 4:13" },
  },
  {
    id: "diario-transformacion",
    title: "Diario de Transformación",
    duration: "15 min",
    level: 1,
    Icon: BookOpen,
    color: "#F58BCB",
    bg: "#FFE1F1",
    objective: "Registrar tus avances y aprendizajes diarios para mantener el enfoque.",
    questions: ["¿Qué avancé hoy?", "¿Qué aprendí?", "¿Qué haré mejor mañana?"],
    actionPlan: ["Escribir cada noche 3 líneas.", "Revisar el diario cada domingo.", "Celebrar tus victorias diarias."],
    info: ["Simple y poderoso.", "Ideal para cerrar el día.", "Duración aproximada: 15 minutos."],
    steps: ["Sienta-te con paz.", "Escribe 3 gracias del día.", "Escribe 1 avance y 1 aprendizaje.", "Cierra en oración."],
    affirmations: ["Cada día crezco.", "Mi progreso es real.", "Celebro mis pasos."],
    scripture: { text: "Este es el día que hizo Jehová; nos gozaremos y alegraremos en él.", ref: "Salmo 118:24" },
  },
  {
    id: "visualizacion-guiada",
    title: "Visualización Guiada",
    duration: "15 min",
    level: 1,
    Icon: Sparkles,
    color: "#7C5CFF",
    bg: "#EDE7FF",
    objective: "Entrenar tu mente para ver, sentir y creer tu meta cumplida.",
    questions: ["¿Qué escena representa mi meta?", "¿Qué siento al vivirla?"],
    actionPlan: ["Visualizar 5 minutos al despertar.", "Anclar la emoción con música.", "Actuar coherentemente durante el día."],
    info: ["Fortalece el enfoque y la fe.", "Combina con música suave.", "Duración aproximada: 15 minutos."],
    steps: ["Respira profundo.", "Cierra los ojos.", "Imagina la meta como ya cumplida.", "Siente y agradece.", "Regresa lento."],
    affirmations: ["Veo mi meta cumplida.", "Siento la victoria.", "Camino con fe."],
    scripture: { text: "Es, pues, la fe la certeza de lo que se espera, la convicción de lo que no se ve.", ref: "Hebreos 11:1" },
  },
  {
    id: "construccion-habitos",
    title: "Construcción de Hábitos",
    duration: "20 min",
    level: 2,
    Icon: Repeat,
    color: "#3FBE8F",
    bg: "#DFF6EA",
    objective: "Instalar hábitos diarios que sostengan tu nueva identidad.",
    questions: ["¿Qué hábito me acerca a mi meta?", "¿Cuándo lo haré cada día?"],
    actionPlan: ["Elegir 1 hábito clave.", "Vincularlo a un ancla existente.", "Registrar 21 días seguidos."],
    info: ["21 días para instalar, 90 para consolidar.", "Simple y sostenible.", "Duración aproximada: 20 minutos."],
    steps: ["Define el hábito en 1 frase.", "Elige hora y lugar.", "Ejecuta hoy sin excusas.", "Celebra al terminarlo."],
    affirmations: ["Mis hábitos me sostienen.", "Soy constante.", "Hoy avanzo un paso más."],
    scripture: { text: "El que es fiel en lo muy poco, también en lo más es fiel.", ref: "Lucas 16:10" },
  },
  {
    id: "accion-valiente",
    title: "Acción Valiente",
    duration: "15 min",
    level: 2,
    Icon: Zap,
    color: "#E63980",
    bg: "#FFE1F1",
    objective: "Romper el miedo con una acción concreta hoy mismo.",
    questions: ["¿Qué acción evito por miedo?", "¿Cuál es el primer paso mínimo?"],
    actionPlan: ["Elegir 1 acción incómoda.", "Ejecutarla hoy.", "Registrar lo que aprendiste."],
    info: ["La valentía se entrena.", "Empieza pequeño.", "Duración aproximada: 15 minutos."],
    steps: ["Nombra el miedo.", "Define la acción mínima.", "Ejecútala ahora.", "Celebra el coraje."],
    affirmations: ["Elijo la valentía.", "Actúo pese al miedo.", "Cada paso me hace fuerte."],
    scripture: { text: "Esfuérzate y sé valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo.", ref: "Josué 1:9" },
  },
  {
    id: "mapa-vision",
    title: "Mapa de Visión",
    duration: "20 min",
    level: 1,
    Icon: Target,
    color: "#5AA9FF",
    bg: "#DCEBFF",
    objective: "Diseñar visualmente tu año soñado para mantener la dirección clara.",
    questions: ["¿Qué áreas quiero transformar?", "¿Qué imágenes representan cada una?"],
    actionPlan: ["Crear tu mapa físico o digital.", "Verlo cada mañana.", "Actualizarlo cada 90 días."],
    info: ["Poderoso y creativo.", "Ideal para inicio de año o etapa.", "Duración aproximada: 20 minutos."],
    steps: ["Elige 5-8 áreas de vida.", "Reúne imágenes que las representen.", "Compón tu mapa.", "Colócalo visible."],
    affirmations: ["Veo mi vida clara.", "Diseño mi futuro.", "Cada área florece."],
    scripture: { text: "Escribe la visión, y declárala en tablas, para que corra el que leyere en ella.", ref: "Habacuc 2:2" },
  },
];

const HOME_BULLETS = [
  { label: "Claridad de propósito", Icon: Compass, color: "#7C5CFF", bg: "#EDE7FF" },
  { label: "Nuevos hábitos", Icon: Sparkles, color: "#F58BCB", bg: "#FFE1F1" },
  { label: "Disciplina diaria", Icon: ShieldCheck, color: "#5AA9FF", bg: "#DCEBFF" },
  { label: "Confianza", Icon: Star, color: "#F5B441", bg: "#FFF3D6" },
  { label: "Crecimiento personal", Icon: Crown, color: "#A78BFA", bg: "#EDE7FF" },
  { label: "Acción con propósito", Icon: Flame, color: "#E63980", bg: "#FFE1F1" },
];

const CHECKLIST = [
  "Elegí una práctica",
  "Definí mi identidad",
  "Escribí mis respuestas",
  "Realicé mi visualización",
  "Repetí mis declaraciones",
  "Completé mi acción del día",
  "Registré mi progreso",
];

const QUIZ_ITEMS = [
  { q: "El primer paso para cambiar tu identidad es…", options: ["Esperar motivación", "Actuar como esa persona hoy", "Compararte con otros"], correct: 1, tip: "La identidad se transforma con acciones repetidas, no con motivación pasajera." },
  { q: "¿Qué construye tu nueva identidad?", options: ["Los hábitos diarios", "Los pensamientos aislados", "La suerte"], correct: 0, tip: "Cada hábito repetido es un voto por la persona que eliges ser." },
  { q: "Cuando aparece el miedo lo mejor es…", options: ["Evitar la acción", "Actuar en pequeño y con fe", "Postergar hasta sentir seguridad"], correct: 1, tip: "La valentía se entrena con acciones pequeñas y constantes." },
];

const WORDS = ["IDENTIDAD", "HABITO", "ACCION", "VISION", "FE", "PROPOSITO"];

function IdentidadPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [step, setStep] = useSessionState<1 | 2 | 3>("viz-identidad", 1);
  const [practiceId, setPracticeId] = useState<string>(PRACTICES[2].id);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [dailyAction, setDailyAction] = useState("");
  const [reflection, setReflection] = useState("");
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [affRead, setAffRead] = useState<Set<number>>(new Set());

  const { data: plan } = useQuery({
    queryKey: ["plan-identidad", user?.id],
    enabled: !!user,
    queryFn: async () => (user ? await getUserPlan(user.id) : "explorador"),
  });
  const isPaid = plan === "camino";

  const practice = PRACTICES.find((p) => p.id === practiceId) ?? PRACTICES[0];
  const practiceContent = thematicPractice("Salto de Identidad", practice.title, PRACTICES.indexOf(practice) + 1);

  async function completePractice() {
    if (!user) return;
    if (reflection.trim().length < 10) return toast.error("Escribe al menos una reflexión para completar.");
    await supabase.from("daily_activity").upsert({
      user_id: user.id,
      activity_type: "salto_identidad",
      activity_date: new Date().toISOString().slice(0, 10),
      reference_id: practice.id,
      metadata: { title: practice.title, reflection, answers, dailyAction },
    }, { onConflict: "user_id,activity_date,activity_type,reference_id" });
    await awardGems(50, "identidad_completed", { practice: practice.id });
    toast.success("¡Práctica completada! +50 🍃");
    setReflection("");
    setChecked(new Set());
    setAffRead(new Set());
    qc.invalidateQueries();
  }

  const StepDots = (
    <div className="flex items-center justify-center gap-2 pt-6">
      {[1, 2, 3].map((n) => (
        <div key={n} className={cn("h-1.5 rounded-full transition-all", step === n ? "w-8 bg-primary" : "w-4 bg-border")} />
      ))}
    </div>
  );

  // ============ STEP 1 — HOME ============
  if (step === 1) {
    return (
      <div className="pb-24">
        <section className="relative overflow-hidden rounded-b-[2.5rem] min-h-[92vh]">
          <ManagedImage imageKey="imagen:visualiza:identidad" src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-background dark:from-black/40 dark:via-black/60" />
          <div className="relative px-5 pt-6 pb-8 max-w-2xl mx-auto text-center flex flex-col">
            <Link to="/visualiza" className="inline-flex items-center gap-1 text-xs text-white font-bold self-start drop-shadow">
              <ArrowLeft className="w-3.5 h-3.5" /> Volver
            </Link>
            <div className="pt-40 sm:pt-56" />
            <div className="text-white drop-shadow-lg">
              <p className="text-sm font-semibold">Bienvenido a</p>
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight mt-1">
                Salto de Identidad <Sparkles className="inline w-6 h-6 text-yellow-300" />
              </h1>
            </div>

            <Card className="mt-8 rounded-[1.75rem] p-6 text-center bg-white/95 dark:bg-card/95 backdrop-blur-xl border border-white/60 shadow-soft">
              <div className="inline-flex items-center gap-1.5 text-xs text-primary font-bold">
                <Sparkles className="w-3.5 h-3.5" /> Programa de Transformación Personal
              </div>
              <p className="text-sm text-foreground/75 mt-3 leading-relaxed max-w-md mx-auto">
                Toda transformación comienza cuando decides actuar como la persona que deseas llegar a ser. Aquí aprenderás a fortalecer tu identidad, crear nuevos hábitos y dar pasos reales hacia tus metas.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {HOME_BULLETS.map((b) => (
                  <div key={b.label} className="flex flex-col items-center gap-1.5">
                    <span className="w-14 h-14 rounded-2xl grid place-items-center" style={{ background: b.bg, color: b.color }}>
                      <b.Icon className="w-6 h-6" />
                    </span>
                    <span className="text-[11px] font-semibold leading-tight text-foreground/85 text-center">{b.label}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => setStep(2)}
                className="mt-6 w-full h-14 rounded-full font-bold text-base bg-gradient-to-r from-[#7C5CFF] via-[#B49BFF] to-[#F58BCB] text-white shadow-glow"
              >
                Comenzar <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </Card>
            {StepDots}
          </div>
        </section>
      </div>
    );
  }

  // ============ STEP 2 — CHOOSE PRACTICE ============
  if (step === 2) {
    return (
      <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto min-h-[92vh]">
        <button onClick={() => setStep(1)} className="inline-flex items-center gap-1 text-xs text-primary font-bold">
          <ArrowLeft className="w-3.5 h-3.5" /> Atrás
        </button>
        <div className="text-center mt-3">
          <div className="text-[11px] uppercase tracking-widest text-primary font-bold">Paso 2 de 3 · Elige una práctica</div>
          <h2 className="font-display font-extrabold text-2xl mt-2">Elige una práctica guiada <span>✨</span></h2>
          <p className="text-sm text-muted-foreground mt-2">¿Qué deseas trabajar hoy?</p>
        </div>

        <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/8 p-3 flex items-center gap-2.5 text-primary">
          <MousePointerClick className="w-4 h-4 shrink-0" />
          <p className="text-xs font-semibold">Pulsa la práctica que deseas realizar para continuar.</p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {PRACTICES.map((p) => {
            const locked = !isPaid && p.level > 1;
            return (
              <button
                key={p.id}
                onClick={() => {
                  if (locked) {
                    toast.error("Esta práctica se libera con el plan Camino Origen.");
                    return;
                  }
                  setPracticeId(p.id);
                  setStep(3);
                }}
                className="app-card p-3 text-center rounded-2xl transition-all hover:-translate-y-0.5 active:scale-[.97] relative overflow-hidden border border-border/60"
              >
                <SubtopicIcon title={p.title} category="Salto de Identidad" className="mx-auto mb-2 h-14 w-14 text-3xl" />
                {locked && <Lock className="absolute right-2 top-2 h-4 w-4 text-muted-foreground" />}
                <div className="font-bold text-[12px] leading-tight">{p.title}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{p.duration}</div>
                <div className="text-[10px] text-primary font-bold mt-0.5">Nivel {p.level}</div>
              </button>
            );
          })}
        </div>

        <Card className="mt-5 rounded-[1.5rem] p-4 bg-gradient-to-br from-primary/8 to-accent-pink/8 border border-primary/20">
          <div className="flex items-center gap-2 text-xs text-primary font-bold">
            <Sparkles className="w-4 h-4" /> Práctica recomendada para hoy
          </div>
          <div className="mt-2 font-display font-extrabold text-lg">Diseño de Identidad</div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Define quién quieres ser y luego elige una acción concreta para empezar a actuar como esa persona.</p>
          <Button
            onClick={() => { setPracticeId("diseno-identidad"); setStep(3); }}
            className="mt-3 w-full h-11 rounded-full bg-gradient-to-r from-[#7C5CFF] to-[#F58BCB] text-white font-bold"
          >
            Comenzar práctica
          </Button>
        </Card>

        {StepDots}
      </div>
    );
  }

  // ============ STEP 3 — PRACTICE DETAIL ============
  const infoIcons = [Info, Clock, Bell, ShieldCheck];
  return (
    <div className="pb-32 max-w-3xl mx-auto">
      <section className="relative h-64 sm:h-80 overflow-hidden rounded-b-[2rem]">
        <ManagedImage imageKey="imagen:visualiza:identidad" src={heroImg} alt={practice.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-white/60 dark:to-background/60" />
        <button onClick={() => setStep(2)} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 grid place-items-center shadow-soft">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 grid place-items-center shadow-soft">
          <Heart className="w-4 h-4 text-pink-500" />
        </div>
        <div className="absolute inset-x-0 bottom-4 text-center px-4">
          <div className="text-[11px] uppercase tracking-widest text-primary font-bold">Paso 3 de 3 · Tu práctica</div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl mt-1 drop-shadow-sm">{practice.title}</h2>
        </div>
      </section>

      <div className="px-4 mt-5 space-y-4">
        <Card className="rounded-[1.3rem] p-5 shadow-soft">
          <div className="text-xs font-bold text-primary uppercase tracking-widest">Objetivo</div>
          <p className="text-sm text-foreground/85 mt-2 leading-relaxed">{practice.objective}</p>
          <p className="text-sm text-foreground/85 mt-3 leading-relaxed">{practiceContent.lesson}</p>
        </Card>

        {/* Preguntas guiadas */}
        <Card className="rounded-[1.3rem] p-5 shadow-soft">
          <div className="text-xs font-bold text-primary uppercase tracking-widest">Reflexiona y define</div>
          <div className="mt-3 space-y-3">
            {practice.questions.map((q, i) => (
              <div key={i}>
                <label className="text-sm font-semibold">{q}</label>
                <Input
                  value={answers[`${practice.id}-${i}`] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [`${practice.id}-${i}`]: e.target.value }))}
                  placeholder="Escribe aquí..."
                  className="mt-1.5 rounded-2xl"
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Plan de acción */}
        <Card className="rounded-[1.3rem] p-5 shadow-soft bg-gradient-to-br from-primary/5 to-accent-pink/5">
          <div className="text-xs font-bold text-primary uppercase tracking-widest">Plan de acción sugerido</div>
          <ul className="mt-3 space-y-2">
            {practice.actionPlan.map((line, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground/85 leading-relaxed">{line}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Información */}
        <Card className="rounded-[1.3rem] p-5 shadow-soft">
          <div className="text-xs font-bold text-primary uppercase tracking-widest">Información</div>
          <ul className="mt-3 space-y-2.5">
            {practice.info.map((line, i) => {
              const Ic = infoIcons[i % infoIcons.length];
              return (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="w-6 h-6 rounded-lg bg-primary/12 text-primary grid place-items-center shrink-0 mt-0.5">
                    <Ic className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-foreground/85 leading-relaxed">{line}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Paso a paso — blur from step 3 for free */}
        <Card className="rounded-[1.3rem] p-5 shadow-soft">
          <div className="text-xs font-bold text-primary uppercase tracking-widest">Paso a paso</div>
          <ol className="mt-3 space-y-3 relative">
            {practice.steps.map((s, i) => {
              const locked = !isPaid && i >= 2;
              return (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className={cn("w-7 h-7 rounded-full grid place-items-center shrink-0 font-bold text-xs", locked ? "bg-muted text-muted-foreground" : "bg-primary/12 text-primary")}>
                    {locked ? <Lock className="w-3.5 h-3.5" /> : i + 1}
                  </span>
                  <span className={cn("leading-relaxed text-foreground/85 flex-1", locked && "blur-[3px] select-none")}>{s}</span>
                </li>
              );
            })}
          </ol>
          {!isPaid && (
            <Link to="/membresia" className="block mt-4">
              <div className="rounded-full h-11 grid place-items-center bg-gradient-to-r from-[#7C5CFF] to-[#F58BCB] text-white font-bold text-sm shadow-glow">
                <span className="inline-flex items-center gap-2"><Lock className="w-4 h-4" /> Desbloquear los pasos completos</span>
              </div>
            </Link>
          )}
        </Card>

        {/* Desafío + ejercicio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="rounded-[1.3rem] p-4 shadow-soft bg-brand-soft border-primary/20">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" /> Desafío del día
            </div>
            <p className="text-xs mt-2 text-foreground/85 leading-relaxed">{practiceContent.tasks[1]}</p>
          </Card>
          <Card className="rounded-[1.3rem] p-4 shadow-soft">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-widest">
              <PenLine className="w-3.5 h-3.5" /> Ejercicio del día
            </div>
            <p className="text-xs mt-2 text-foreground/85 leading-relaxed">{`¿Qué paso darás en ${practice.title}?`}</p>
            <Input value={dailyAction} onChange={(e) => setDailyAction(e.target.value)} placeholder="Escribe aquí..." className="mt-2 rounded-xl" />
          </Card>
        </div>

        {/* Sopa de letras */}
        <div>
          <div className="text-center mb-2">
            <h3 className="font-display font-extrabold text-lg">Sopa de letras</h3>
            <p className="text-xs text-muted-foreground">Encuentra las claves de tu nueva identidad.</p>
          </div>
          <WordSearch words={practiceContent.search_words} storageKey={`identidad-${practice.id}`} />
        </div>

        {/* Quiz */}
        <StageQuiz items={practiceContent.quiz.map(q => ({ q: q.question, options: q.options, correct: q.correctIndex, tip: q.explanation }))} storageKey={`identidad-${practice.id}`} />

        {/* AFIRMACIONES */}
        <section className="pt-2">
          <div className="text-center">
            <h3 className="font-display font-extrabold text-xl">Afirmaciones para tu nueva identidad</h3>
            <p className="text-xs text-muted-foreground mt-1">Habla como la persona que estás construyendo.</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {practice.affirmations.map((a, i) => {
              const active = affRead.has(i);
              return (
                <div key={i} className="app-card p-3 rounded-2xl">
                  <p className="text-xs font-semibold leading-snug min-h-[3rem]">{a}</p>
                  <div className="flex items-center justify-between mt-2">
                    <button className="w-8 h-8 rounded-full bg-primary/10 text-primary grid place-items-center">
                      <Play className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                    <button
                      onClick={() => setAffRead((prev) => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; })}
                      className={cn("w-8 h-8 rounded-full grid place-items-center transition", active ? "bg-pink-500 text-white" : "bg-pink-50 text-pink-500")}
                    >
                      <Heart className="w-3.5 h-3.5" fill={active ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <Card className="mt-4 rounded-[1.3rem] p-5 shadow-soft bg-gradient-to-br from-primary/8 to-accent-pink/8 border-primary/20">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <BookOpen className="w-4 h-4" /> Versículo del día
            </div>
            <p className="scripture mt-3 text-sm leading-relaxed">"{practice.scripture.text}"</p>
            <p className="text-xs font-bold text-foreground/70 mt-2">{practice.scripture.ref}</p>
          </Card>
        </section>

        {/* FINALIZAR */}
        <section className="pt-6">
          <div className="text-center">
            <h3 className="font-display font-extrabold text-xl">Completa tu transformación de hoy</h3>
            <p className="text-xs text-muted-foreground mt-1">Tu identidad se fortalece con cada acción.</p>
          </div>

          <div className="mt-4 grid gap-3">
            <Card className="rounded-[1.3rem] p-4 shadow-soft">
              <div className="text-xs font-bold text-primary uppercase tracking-widest">Revisa tu progreso de hoy</div>
              <div className="mt-3 space-y-2.5">
                {practiceContent.tasks.map((line, i) => {
                  const on = checked.has(i);
                  return (
                    <button
                      key={i}
                      onClick={() => setChecked((prev) => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; })}
                      className="flex items-center gap-2.5 w-full text-left"
                    >
                      <span className={cn("w-5 h-5 rounded-full grid place-items-center shrink-0 transition", on ? "bg-primary text-white" : "border-2 border-border")}>
                        {on && <Check className="w-3 h-3" />}
                      </span>
                      <span className={cn("text-sm", on ? "text-foreground" : "text-foreground/80")}>{line}</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="rounded-[1.3rem] p-4 shadow-soft">
              <div className="text-xs font-bold text-primary uppercase tracking-widest">Reflexión final</div>
              <p className="text-xs text-muted-foreground mt-1">¿Qué hice hoy que demuestra que ya estoy convirtiéndome en esa persona?</p>
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value.slice(0, 500))}
                placeholder="Escribe aquí..."
                className="mt-3 min-h-28 rounded-2xl"
              />
              <div className="text-[10px] text-muted-foreground text-right mt-1">{reflection.length}/500</div>
            </Card>

            <Card className="rounded-[1.3rem] p-4 shadow-soft">
              <div className="text-xs font-bold text-primary uppercase tracking-widest">Estadísticas</div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                <Stat Icon={CheckCircle2} label="Días consecutivos" value="12" />
                <Stat Icon={Trophy} label="Acciones" value="27" />
                <Stat Icon={Repeat} label="Hábitos" value="8" />
                <Stat Icon={Bookmark} label="Nivel" value="75%" accent />
                <Stat Icon={Target} label="Objetivos" value="3" />
              </div>
            </Card>

            <Button
              onClick={completePractice}
              className="w-full h-14 rounded-full font-bold text-base bg-gradient-to-r from-[#7C5CFF] via-[#B49BFF] to-[#F58BCB] text-white shadow-glow"
            >
              Completar práctica <Check className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-[11px] text-muted-foreground text-center inline-flex items-center gap-1 justify-center">
              <ShieldCheck className="w-3 h-3" /> Se guardará tu progreso y sumarás experiencia.
            </p>
          </div>
        </section>

        {StepDots}
      </div>
    </div>
  );
}

function Stat({ Icon, label, value, accent }: { Icon: typeof Star; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-2.5 text-center">
      <Icon className={cn("w-4 h-4 mx-auto", accent ? "text-primary" : "text-muted-foreground")} />
      <div className={cn("mt-1 font-display font-extrabold text-sm", accent && "text-primary")}>{value}</div>
      <div className="text-[9px] text-muted-foreground leading-tight mt-0.5">{label}</div>
    </div>
  );
}

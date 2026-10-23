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
  PenLine, BookOpen, Lock, Check, Play, Info, Clock, Bell,
  Trophy, Bookmark, CheckCircle2, MousePointerClick, Flame, ShieldCheck,
  Coins, HeartHandshake, Sun, Leaf, Cross, Music, Download, Printer, Pause,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getUserPlan } from "@/lib/plan";
import { awardGems } from "@/lib/gems";
import { cn } from "@/lib/utils";
import { WordSearch } from "@/components/WordSearch";
import { StageQuiz } from "@/components/StageQuiz";
import heroImg from "@/assets/cristo-hero.jpg";

export const Route = createFileRoute("/_authenticated/visualiza/cristo")({
  head: () => ({ meta: [
    { title: "Método de Cristo 3·6·9 — ORÍGEN" },
    { name: "description", content: "Prácticas de oración, escritura y reflexión cristiana para cuidar tu vida emocional en ORÍGEN." },
    { property: "og:title", content: "Método de Cristo 3·6·9 — ORÍGEN" },
    { property: "og:description", content: "Encuentra prácticas de fe, oración y reflexión en Cristo." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: CristoPage,
});

type Category = "Todas" | "Abundancia" | "Salud" | "Relaciones" | "Propósito";

type Practice = {
  id: string;
  title: string;
  category: Exclude<Category, "Todas">;
  duration: string;
  level: 1 | 2 | 3;
  Icon: typeof Star;
  color: string;
  bg: string;
  intention: string;
  objective: string;
  questions: string[];
  actionPlan: string[];
  info: string[];
  steps: string[];
  affirmations: { time: "Mañana" | "Tarde" | "Noche"; text: string }[];
  scripture: { text: string; ref: string };
};

const PRACTICES: Practice[] = [
  {
    id: "abundancia",
    title: "369 Abundancia Financiera",
    category: "Abundancia",
    duration: "21 min",
    level: 1,
    Icon: Coins,
    color: "#F5B441",
    bg: "#FFF3D6",
    intention: "Yo soy próspero y abundante en Cristo.",
    objective: "Renovar tu relación con el dinero desde la gratitud a Dios y decisiones responsables.",
    questions: [
      "¿Qué significa la abundancia para mí?",
      "¿Qué creencia sobre el dinero quiero soltar?",
      "¿Cómo se ve mi vida en total abundancia?",
    ],
    actionPlan: [
      "Escribir tu intención cada mañana, tarde y noche.",
      "Diezmar o dar algo hoy con fe.",
      "Actuar como alguien que ya recibió lo que pidió.",
    ],
    info: [
      "Ideal para renovar tu relación con el dinero.",
      "Hazlo con la Biblia abierta en tu escritorio.",
      "Duración aproximada: 21 minutos.",
    ],
    steps: [
      "En la mañana, escribe tu intención 3 veces con fe.",
      "En la tarde, escríbela 6 veces con enfoque.",
      "En la noche, escríbela 9 veces agradeciendo como si ya fuera tuya.",
      "Escucha el audio guiado mientras escribes.",
      "Cierra en oración y suelta el resultado a Dios.",
    ],
    affirmations: [
      { time: "Mañana", text: "Yo soy abundante y próspero." },
      { time: "Mañana", text: "Yo soy imán de oportunidades." },
      { time: "Mañana", text: "Yo merezco recibir mucho más." },
      { time: "Tarde", text: "El dinero fluye hacia mí fácilmente." },
      { time: "Tarde", text: "Estoy alineado con la riqueza en todos los niveles." },
      { time: "Tarde", text: "Yo soy digno de todas las bendiciones." },
      { time: "Noche", text: "Agradezco todo lo que ya tengo y lo que está por venir." },
      { time: "Noche", text: "Confío en Dios y pongo mis preocupaciones en sus manos." },
      { time: "Noche", text: "Todo está bien en mi mundo y cada día es mejor." },
    ],
    scripture: { text: "Todo lo puedo en Cristo que me fortalece.", ref: "Filipenses 4:13" },
  },
  {
    id: "amor",
    title: "369 Amor y Relaciones",
    category: "Relaciones",
    duration: "18 min",
    level: 1,
    Icon: HeartHandshake,
    color: "#F58BCB",
    bg: "#FFE1F1",
    intention: "Yo soy amor, doy amor y recibo amor sano.",
    objective: "Abrir tu corazón al amor sano, sanar heridas y atraer vínculos verdaderos.",
    questions: ["¿Qué tipo de amor quiero en mi vida?", "¿Qué necesito perdonar?", "¿Cómo me amo hoy?"],
    actionPlan: [
      "Bendecir a las personas que amas hoy en oración.",
      "Escribir tu intención de amor 3-6-9.",
      "Dar un gesto amoroso concreto a alguien hoy.",
    ],
    info: ["Perfecto para sanar relaciones.", "Combina con música suave.", "Duración: 18 minutos."],
    steps: [
      "En la mañana, escribe tu intención de amor 3 veces.",
      "En la tarde, escríbela 6 veces desde el corazón.",
      "En la noche, escríbela 9 veces agradeciendo.",
      "Escucha el audio y visualiza la relación sana.",
      "Ora entregando a Dios cada vínculo.",
    ],
    affirmations: [
      { time: "Mañana", text: "Yo soy digno de amor sano." },
      { time: "Mañana", text: "Mi corazón está abierto y en paz." },
      { time: "Mañana", text: "Atraigo relaciones que me elevan." },
      { time: "Tarde", text: "Perdono y me perdono con amor." },
      { time: "Tarde", text: "El amor de Dios sana cada herida." },
      { time: "Tarde", text: "Me acepto y me valoro tal como soy." },
      { time: "Noche", text: "Descanso en el amor perfecto de Cristo." },
      { time: "Noche", text: "Agradezco las personas que Dios me envía." },
      { time: "Noche", text: "Cada relación es una bendición en mi vida." },
    ],
    scripture: { text: "Sobre todas las cosas, vestíos de amor, que es el vínculo perfecto.", ref: "Colosenses 3:14" },
  },
  {
    id: "salud",
    title: "369 Salud y Bienestar",
    category: "Salud",
    duration: "20 min",
    level: 1,
    Icon: Leaf,
    color: "#3FBE8F",
    bg: "#DFF6EA",
    intention: "Yo soy salud, vitalidad y vida abundante.",
    objective: "Restaurar tu cuerpo, mente y espíritu con la fuerza sanadora de Cristo.",
    questions: ["¿Qué área de mi salud quiero fortalecer?", "¿Qué hábito nuevo adoptaré hoy?"],
    actionPlan: ["Beber más agua hoy.", "Mover el cuerpo 15 minutos.", "Dormir a tu hora sagrada."],
    info: ["Sanar es también decisión.", "Combina con oración.", "Duración: 20 minutos."],
    steps: [
      "Escribe tu intención de salud 3 veces en la mañana.",
      "Al mediodía, escríbela 6 veces respirando profundo.",
      "En la noche, escríbela 9 veces bendiciendo tu cuerpo.",
      "Ora imponiendo tus manos sobre tu corazón.",
      "Descansa agradeciendo cada célula.",
    ],
    affirmations: [
      { time: "Mañana", text: "Yo soy salud pura." },
      { time: "Mañana", text: "Mi cuerpo se renueva cada día." },
      { time: "Mañana", text: "Camino con energía y fe." },
      { time: "Tarde", text: "Cuido mi salud y busco apoyo cuando lo necesito." },
      { time: "Tarde", text: "Elijo alimentos que me nutren." },
      { time: "Tarde", text: "Respiro paz y vitalidad." },
      { time: "Noche", text: "Descanso en el amor de Cristo." },
      { time: "Noche", text: "Duermo profundamente y me renuevo." },
      { time: "Noche", text: "Agradezco mi cuerpo y su sabiduría." },
    ],
    scripture: { text: "Amado, yo deseo que tú seas prosperado en todas las cosas, y que tengas salud.", ref: "3 Juan 1:2" },
  },
  {
    id: "proposito",
    title: "369 Propósito de Vida",
    category: "Propósito",
    duration: "22 min",
    level: 2,
    Icon: Compass,
    color: "#7C5CFF",
    bg: "#EDE7FF",
    intention: "Yo camino en el propósito perfecto que Dios diseñó para mí.",
    objective: "Descubrir y activar tu llamado con claridad y valentía.",
    questions: ["¿Para qué siento que fui creado?", "¿Qué acción me acerca a mi propósito hoy?"],
    actionPlan: ["Escribir tu misión de vida.", "Elegir 1 paso concreto hoy.", "Compartir tu don con alguien."],
    info: ["Ideal para reencontrar tu norte.", "Hazlo con papel y lápiz.", "Duración: 22 minutos."],
    steps: [
      "En la mañana escribe tu propósito 3 veces.",
      "En la tarde escríbelo 6 veces con enfoque.",
      "En la noche escríbelo 9 veces confiando en Dios.",
      "Da 1 paso real hoy hacia tu meta.",
      "Cierra el día en oración de gratitud.",
    ],
    affirmations: [
      { time: "Mañana", text: "Yo camino en mi propósito." },
      { time: "Mañana", text: "Dios guía mis pasos." },
      { time: "Mañana", text: "Mi don bendice al mundo." },
      { time: "Tarde", text: "Actúo con claridad y fe." },
      { time: "Tarde", text: "Cada paso construye mi destino." },
      { time: "Tarde", text: "Soy valiente para avanzar." },
      { time: "Noche", text: "Agradezco el plan divino." },
      { time: "Noche", text: "Descanso en su tiempo perfecto." },
      { time: "Noche", text: "Mañana avanzo un paso más." },
    ],
    scripture: { text: "Porque yo sé los pensamientos que tengo acerca de vosotros, pensamientos de paz.", ref: "Jeremías 29:11" },
  },
  {
    id: "paz",
    title: "369 Paz Interior",
    category: "Salud",
    duration: "15 min",
    level: 1,
    Icon: Sun,
    color: "#5AA9FF",
    bg: "#DCEBFF",
    intention: "Yo soy paz, soy calma, soy presencia de Dios.",
    objective: "Silenciar el ruido interior y habitar la paz que sobrepasa todo entendimiento.",
    questions: ["¿Qué me está robando la paz?", "¿A qué necesito soltar hoy?"],
    actionPlan: ["Meditar 10 minutos.", "Escribir tu intención de paz 3-6-9.", "Bendecir tu día en oración."],
    info: ["Ideal antes de dormir.", "Combina con respiración.", "Duración: 15 minutos."],
    steps: [
      "Escribe tu intención de paz 3 veces al despertar.",
      "En la tarde, escríbela 6 veces respirando profundo.",
      "En la noche, escríbela 9 veces soltando el día.",
      "Escucha el audio y quédate en silencio 5 minutos.",
      "Duerme en paz.",
    ],
    affirmations: [
      { time: "Mañana", text: "Yo soy paz." },
      { time: "Mañana", text: "Elijo la calma." },
      { time: "Mañana", text: "Confío en Dios." },
      { time: "Tarde", text: "Suelto lo que no controlo." },
      { time: "Tarde", text: "Mi corazón descansa." },
      { time: "Tarde", text: "Respiro presencia divina." },
      { time: "Noche", text: "Todo está en orden." },
      { time: "Noche", text: "Descanso en Cristo." },
      { time: "Noche", text: "Mañana amanece con luz." },
    ],
    scripture: { text: "La paz os dejo, mi paz os doy; no como el mundo la da.", ref: "Juan 14:27" },
  },
  {
    id: "exito",
    title: "369 Éxito y Prosperidad",
    category: "Abundancia",
    duration: "19 min",
    level: 2,
    Icon: Trophy,
    color: "#F5B441",
    bg: "#FFF3D6",
    intention: "Yo soy exitoso en todo lo que emprendo con fe.",
    objective: "Activar tu mente maestra y avanzar con enfoque hacia tus metas.",
    questions: ["¿Cuál es mi próxima meta?", "¿Qué acción daré hoy?"],
    actionPlan: ["Definir tu meta clara.", "Escribir tu intención 3-6-9.", "Ejecutar 1 acción concreta."],
    info: ["Perfecto para emprendedores.", "Combina con visualización.", "Duración: 19 minutos."],
    steps: [
      "Escribe tu meta 3 veces al amanecer.",
      "A media tarde escríbela 6 veces con emoción.",
      "En la noche escríbela 9 veces agradeciendo.",
      "Da hoy 1 acción real hacia esa meta.",
      "Cierra con oración de fe.",
    ],
    affirmations: [
      { time: "Mañana", text: "Yo soy éxito." },
      { time: "Mañana", text: "Cristo abre puertas." },
      { time: "Mañana", text: "Actúo con enfoque." },
      { time: "Tarde", text: "Mi trabajo prospera." },
      { time: "Tarde", text: "Soy imán de bendiciones." },
      { time: "Tarde", text: "Todo colabora para mi bien." },
      { time: "Noche", text: "Agradezco cada victoria." },
      { time: "Noche", text: "Confío en el proceso." },
      { time: "Noche", text: "Mañana avanzo más." },
    ],
    scripture: { text: "Todo lo que hiciere prosperará.", ref: "Salmo 1:3" },
  },
  {
    id: "sanacion",
    title: "369 Sanación Emocional",
    category: "Salud",
    duration: "20 min",
    level: 2,
    Icon: Heart,
    color: "#E63980",
    bg: "#FFE1F1",
    intention: "Yo soy sanado, libre y renovado en Cristo.",
    objective: "Liberar cargas emocionales y abrir espacio a la sanidad divina.",
    questions: ["¿Qué emoción necesito sanar?", "¿A quién necesito perdonar?"],
    actionPlan: ["Escribir la carta que no envías.", "Perdonar en oración.", "Registrar tu progreso."],
    info: ["Puede tocar fibras sensibles.", "Ten pañuelos cerca.", "Duración: 20 minutos."],
    steps: [
      "Escribe tu intención de sanación 3 veces.",
      "En la tarde escríbela 6 veces con lágrimas si vienen.",
      "En la noche escríbela 9 veces agradeciendo.",
      "Ora entregando la carga a Cristo.",
      "Descansa en su amor.",
    ],
    affirmations: [
      { time: "Mañana", text: "Yo soy sanado." },
      { time: "Mañana", text: "Suelto el pasado." },
      { time: "Mañana", text: "Elijo la libertad." },
      { time: "Tarde", text: "Perdono con amor." },
      { time: "Tarde", text: "Mi corazón se restaura." },
      { time: "Tarde", text: "Camino ligero." },
      { time: "Noche", text: "Descanso en su amor." },
      { time: "Noche", text: "Todo está sanando." },
      { time: "Noche", text: "Amanezco nuevo." },
    ],
    scripture: { text: "Él sana a los quebrantados de corazón, y venda sus heridas.", ref: "Salmo 147:3" },
  },
  {
    id: "gratitud",
    title: "369 Gratitud y Plenitud",
    category: "Propósito",
    duration: "15 min",
    level: 1,
    Icon: Sparkles,
    color: "#A78BFA",
    bg: "#EDE7FF",
    intention: "Yo soy gratitud viva, mi vida está llena de bendiciones.",
    objective: "Cultivar gratitud a Dios y reconocer el apoyo que recibes cada día.",
    questions: ["¿Qué agradezco hoy?", "¿Quién me bendice esta semana?"],
    actionPlan: ["Escribir 3 gratitudes al despertar.", "Bendecir tus alimentos.", "Cerrar el día con 3 gracias."],
    info: ["Sencillo y transformador.", "Ideal para cualquier momento.", "Duración: 15 minutos."],
    steps: [
      "En la mañana escribe 3 gratitudes.",
      "A media tarde escribe 6 más.",
      "En la noche escribe 9 más profundas.",
      "Ora agradeciendo todo lo recibido.",
      "Duerme con el corazón lleno.",
    ],
    affirmations: [
      { time: "Mañana", text: "Doy gracias por hoy." },
      { time: "Mañana", text: "Todo es regalo." },
      { time: "Mañana", text: "Mi vida es abundante." },
      { time: "Tarde", text: "Gracias por mi cuerpo." },
      { time: "Tarde", text: "Gracias por los míos." },
      { time: "Tarde", text: "Gracias por el pan." },
      { time: "Noche", text: "Gracias por la paz." },
      { time: "Noche", text: "Gracias por su amor." },
      { time: "Noche", text: "Gracias por mañana." },
    ],
    scripture: { text: "Dad gracias en todo, porque esta es la voluntad de Dios.", ref: "1 Tesalonicenses 5:18" },
  },
  {
    id: "fe",
    title: "369 Fe y Confianza",
    category: "Propósito",
    duration: "18 min",
    level: 2,
    Icon: Cross,
    color: "#7C5CFF",
    bg: "#EDE7FF",
    intention: "Yo soy fe activa, confío en el plan perfecto de Dios.",
    objective: "Fortalecer tu fe cuando el camino se ve incierto.",
    questions: ["¿Dónde flaquea mi fe hoy?", "¿Qué palabra de Dios necesito recordar?"],
    actionPlan: ["Leer 1 salmo.", "Escribir tu intención de fe.", "Actuar en fe hoy."],
    info: ["Perfecto en tiempos difíciles.", "Ten tu Biblia cerca.", "Duración: 18 minutos."],
    steps: [
      "Escribe tu intención de fe 3 veces al amanecer.",
      "En la tarde escríbela 6 veces con voz firme.",
      "En la noche escríbela 9 veces agradeciendo.",
      "Da un paso real en fe hoy.",
      "Ora entregando el resultado.",
    ],
    affirmations: [
      { time: "Mañana", text: "Yo soy fe." },
      { time: "Mañana", text: "Cristo va conmigo." },
      { time: "Mañana", text: "Confío plenamente." },
      { time: "Tarde", text: "Su palabra me sostiene." },
      { time: "Tarde", text: "No temo, Él está aquí." },
      { time: "Tarde", text: "Todo obra para bien." },
      { time: "Noche", text: "Descanso en Él." },
      { time: "Noche", text: "Mi fe crece cada día." },
      { time: "Noche", text: "Mañana veré su gloria." },
    ],
    scripture: { text: "Es, pues, la fe la certeza de lo que se espera.", ref: "Hebreos 11:1" },
  },
];

const HOME_BULLETS = [
  { label: "Alineación espiritual", Icon: Leaf, color: "#7C5CFF", bg: "#EDE7FF" },
  { label: "Claridad mental", Icon: Compass, color: "#5AA9FF", bg: "#DCEBFF" },
  { label: "Oración consciente", Icon: Sparkles, color: "#F58BCB", bg: "#FFE1F1" },
  { label: "Paz interior", Icon: Heart, color: "#E63980", bg: "#FFE1F1" },
  { label: "Fe y confianza", Icon: ShieldCheck, color: "#5AA9FF", bg: "#DCEBFF" },
  { label: "Propósito y dirección", Icon: Target, color: "#F5B441", bg: "#FFF3D6" },
];

const CHECKLIST = [
  "Escribí 3 veces mi intención en la mañana.",
  "Escribí 6 veces mi intención en la tarde.",
  "Escribí 9 veces mi intención en la noche.",
  "Escuché el audio de acompañamiento.",
  "Realicé mi ejercicio del día.",
  "Repetí mis afirmaciones.",
  "Tomé acción hacia mi meta.",
];

const QUIZ_ITEMS = [
  { q: "El método 3·6·9 consiste en…", options: ["Repetir la intención 3, 6 y 9 veces al día", "Meditar solo 3 minutos", "Orar una vez a la semana"], correct: 0, tip: "3 veces mañana, 6 tarde y 9 noche durante 21 días." },
  { q: "El mejor complemento del 3·6·9 es…", options: ["La duda", "La fe y la acción", "La comparación"], correct: 1, tip: "La oración puede acompañar tus acciones; no garantiza resultados ni exige una fe perfecta." },
  { q: "¿Por qué 21 días?", options: ["Es un número al azar", "Instala el hábito y consolida el cambio", "Solo por tradición"], correct: 1, tip: "21 días construyen el hábito espiritual y renuevan tu mente." },
];

const WORDS = ["FE", "CRISTO", "ORACION", "PROPOSITO", "MILAGRO", "GRACIA"];

const CATEGORIES: Category[] = ["Todas", "Abundancia", "Salud", "Relaciones", "Propósito"];

function CristoPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [practiceId, setPracticeId] = useState<string>(PRACTICES[0].id);
  const [category, setCategory] = useState<Category>("Todas");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [dailyAction, setDailyAction] = useState("");
  const [reflection, setReflection] = useState("");
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [affRead, setAffRead] = useState<Set<number>>(new Set());
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [affTab, setAffTab] = useState<"Mañana" | "Tarde" | "Noche">("Mañana");

  const { data: plan } = useQuery({
    queryKey: ["plan-cristo", user?.id],
    enabled: !!user,
    queryFn: async () => (user ? await getUserPlan(user.id) : "explorador"),
  });
  const isPaid = plan === "camino";

  const practice = PRACTICES.find((p) => p.id === practiceId)!;
  const filtered = category === "Todas" ? PRACTICES : PRACTICES.filter((p) => p.category === category);

  async function completePractice() {
    if (!user) return;
    if (reflection.trim().length < 10) return toast.error("Escribe al menos una reflexión para completar.");
    await supabase.from("daily_activity").upsert({
      user_id: user.id,
      activity_type: "cristo_369",
      activity_date: new Date().toISOString().slice(0, 10),
      reference_id: practice.id,
      metadata: { title: practice.title, reflection, answers, dailyAction },
    }, { onConflict: "user_id,activity_date,activity_type,reference_id" });
    await awardGems(50, "cristo_369_completed", { practice: practice.id });
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
          <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-background dark:from-black/40 dark:via-black/60" />
          <div className="relative px-5 pt-6 pb-8 max-w-2xl mx-auto text-center flex flex-col">
            <Link to="/visualiza" className="inline-flex items-center gap-1 text-xs text-white font-bold self-start drop-shadow">
              <ArrowLeft className="w-3.5 h-3.5" /> Volver
            </Link>
            <div className="pt-40 sm:pt-56" />
            <div className="text-white drop-shadow-lg">
              <p className="text-sm font-semibold">Bienvenido a</p>
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight mt-1">
                El Método de Cristo 369 <Cross className="inline w-6 h-6 text-yellow-200" />
              </h1>
            </div>

            <Card className="mt-8 rounded-[1.75rem] p-6 text-center bg-white/95 dark:bg-card/95 backdrop-blur-xl border border-white/60 shadow-soft">
              <div className="inline-flex items-center gap-1.5 text-xs text-primary font-bold">
                <Sparkles className="w-3.5 h-3.5" /> Programa de Oración y Escritura
              </div>
              <p className="text-sm text-foreground/75 mt-3 leading-relaxed max-w-md mx-auto">
                Esta práctica de escritura organiza tu oración en momentos de mañana, tarde y noche. La música acompaña tu reflexión cristiana; los números no tienen poder espiritual ni garantizan resultados.
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
              <p className="text-[11px] text-muted-foreground mt-3 inline-flex items-center gap-1 justify-center">
                <ShieldCheck className="w-3 h-3" /> Recuerda: Tú eres cocreador de tu realidad.
              </p>
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
          <div className="text-[11px] uppercase tracking-widest text-primary font-bold">Paso 2 de 3 · Elige tu práctica</div>
          <h2 className="font-display font-extrabold text-2xl mt-2">Elige tu práctica guiada 369 <span>✨</span></h2>
          <p className="text-sm text-muted-foreground mt-2">¿Qué deseas manifestar hoy?</p>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "px-4 h-9 rounded-full text-xs font-bold shrink-0 transition",
                category === c
                  ? "bg-gradient-to-r from-[#7C5CFF] to-[#F58BCB] text-white shadow-soft"
                  : "bg-secondary text-foreground/70 border border-border"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/8 p-3 flex items-center gap-2.5 text-primary">
          <MousePointerClick className="w-4 h-4 shrink-0" />
          <p className="text-xs font-semibold">Pulsa la práctica que deseas realizar para continuar.</p>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((p) => {
            const locked = !isPaid && p.level > 1;
            return (
              <button
                key={p.id}
                onClick={() => {
                  if (locked) { toast.error("Esta práctica se libera con el plan Camino Origen."); return; }
                  setPracticeId(p.id); setStep(3);
                }}
                className="app-card p-3 text-center rounded-2xl transition-all hover:-translate-y-0.5 active:scale-[.97] relative overflow-hidden border border-border/60"
              >
                <div className="w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-2" style={{ background: p.bg, color: p.color }}>
                  {locked ? <Lock className="w-6 h-6" /> : <p.Icon className="w-6 h-6" />}
                </div>
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
          <div className="mt-2 font-display font-extrabold text-lg">369 Abundancia Financiera</div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Ora por sabiduría y cultiva decisiones responsables desde la gratitud a Dios.</p>
          <Button
            onClick={() => { setPracticeId("abundancia"); setStep(3); }}
            className="mt-3 w-full h-11 rounded-full bg-gradient-to-r from-[#7C5CFF] to-[#F58BCB] text-white font-bold"
          >
            Comenzar práctica recomendada
          </Button>
        </Card>

        {StepDots}
      </div>
    );
  }

  // ============ STEP 3 — PRACTICE DETAIL ============
  const infoIcons = [Info, Clock, Bell, ShieldCheck];
  const affsByTime = practice.affirmations.filter((a) => a.time === affTab);
  const countByTime = (t: "Mañana" | "Tarde" | "Noche") => practice.affirmations.filter((a) => a.time === t).length;

  return (
    <div className="pb-32 max-w-3xl mx-auto">
      <section className="relative overflow-hidden rounded-b-[2rem]">
        <img src={heroImg} alt={practice.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-background/70" />
        <button onClick={() => setStep(2)} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 grid place-items-center shadow-soft z-10">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 grid place-items-center shadow-soft z-10">
          <Heart className="w-4 h-4 text-pink-500" />
        </div>
        <div className="relative pt-24 pb-8 px-4 text-center">
          <div className="text-[11px] uppercase tracking-widest text-white font-bold drop-shadow">Paso 3 de 3</div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl mt-1 drop-shadow-lg text-white">{practice.title}</h2>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 text-primary text-[11px] font-bold shadow-soft">
            <Star className="w-3 h-3" /> Categoría: {practice.category}
          </div>

          <div className="mt-6 flex items-end justify-center gap-3 text-white drop-shadow-lg">
            <div className="font-display font-extrabold text-5xl">3</div>
            <div className="font-display font-extrabold text-6xl text-yellow-200">6</div>
            <div className="font-display font-extrabold text-5xl">9</div>
          </div>
        </div>
      </section>

      <div className="px-4 mt-5 space-y-4">
        {/* ¿Cómo funciona? */}
        <Card className="rounded-[1.3rem] p-5 shadow-soft">
          <div className="text-xs font-bold text-primary uppercase tracking-widest">¿Cómo funciona el método 369?</div>
          <p className="text-sm text-foreground/85 mt-2 leading-relaxed">
            Escribirás tu intención 3 veces en la mañana, 6 veces en la tarde y 9 veces en la noche durante 21 días, acompañado de música alineadora y fe.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { n: 3, t: "Mañana", d: "Activa tu día", c: "#7C5CFF", bg: "#EDE7FF" },
              { n: 6, t: "Tarde", d: "Reafirma tu fe", c: "#F5B441", bg: "#FFF3D6" },
              { n: 9, t: "Noche", d: "Agradece y suelta", c: "#F58BCB", bg: "#FFE1F1" },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl p-3 text-center" style={{ background: x.bg }}>
                <div className="font-display font-extrabold text-3xl" style={{ color: x.c }}>{x.n}</div>
                <div className="text-[11px] font-bold text-foreground/85">{x.t}</div>
                <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{x.d}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Intención + Objetivo */}
        <Card className="rounded-[1.3rem] p-5 shadow-soft bg-gradient-to-br from-primary/8 to-accent-pink/8 border-primary/20">
          <div className="text-xs font-bold text-primary uppercase tracking-widest">Tu intención de hoy</div>
          <p className="scripture mt-2 text-base font-semibold">"{practice.intention}"</p>
          <div className="mt-4 text-xs font-bold text-primary uppercase tracking-widest">Objetivo</div>
          <p className="text-sm text-foreground/85 mt-1.5 leading-relaxed">{practice.objective}</p>
        </Card>

        {/* Descarga guía */}
        <Card className="rounded-[1.3rem] p-5 shadow-soft">
          <div className="text-xs font-bold text-primary uppercase tracking-widest">Descarga e imprime tu guía de hoy</div>
          <p className="text-xs text-muted-foreground mt-1">Tu hoja de ejercicio 369 para hoy.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => toast.info("Descarga disponible con plan Camino Origen.")}
              className="h-11 rounded-2xl bg-secondary text-foreground/85 font-bold text-xs inline-flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Descargar PDF
            </button>
            <button
              onClick={() => window.print()}
              className="h-11 rounded-2xl bg-secondary text-foreground/85 font-bold text-xs inline-flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
          </div>
        </Card>

        {/* Audio */}
        <Card className="rounded-[1.3rem] p-5 shadow-soft">
          <div className="text-xs font-bold text-primary uppercase tracking-widest">Audio de acompañamiento</div>
          <p className="text-xs text-muted-foreground mt-1">Audio guiado para tu práctica 369 de hoy.</p>
          <div className="mt-3 rounded-2xl bg-brand-soft p-3 flex items-center gap-3">
            <button
              onClick={() => setAudioPlaying((v) => !v)}
              className="w-11 h-11 rounded-full grid place-items-center bg-gradient-to-r from-[#7C5CFF] to-[#F58BCB] text-white shadow-soft"
            >
              {audioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <div className="flex-1">
              <div className="text-xs font-bold flex items-center gap-1.5"><Music className="w-3 h-3 text-primary" /> Audio 369 - {practice.title}</div>
              <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={cn("h-full bg-gradient-to-r from-primary to-accent-pink transition-all", audioPlaying ? "w-1/3" : "w-0")} />
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground font-bold">{practice.duration}</div>
          </div>
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

        {/* Información / Materiales */}
        <Card className="rounded-[1.3rem] p-5 shadow-soft">
          <div className="text-xs font-bold text-primary uppercase tracking-widest">Materiales e información</div>
          <ul className="mt-3 space-y-2.5">
            {practice.info.map((line, i) => {
              const Ic = infoIcons[i % infoIcons.length];
              const locked = !isPaid && i >= 2;
              return (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="w-6 h-6 rounded-lg bg-primary/12 text-primary grid place-items-center shrink-0 mt-0.5">
                    {locked ? <Lock className="w-3.5 h-3.5" /> : <Ic className="w-3.5 h-3.5" />}
                  </span>
                  <span className={cn("text-foreground/85 leading-relaxed flex-1", locked && "blur-[3px] select-none")}>{line}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Paso a paso */}
        <Card className="rounded-[1.3rem] p-5 shadow-soft">
          <div className="text-xs font-bold text-primary uppercase tracking-widest">Guía paso a paso del día</div>
          <ol className="mt-3 space-y-3 relative">
            {practice.steps.map((s, i) => {
              const locked = !isPaid && i >= 1;
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
            <p className="text-xs mt-2 text-foreground/85 leading-relaxed">Actúa hoy como la persona que ya tiene eso que deseas.</p>
          </Card>
          <Card className="rounded-[1.3rem] p-4 shadow-soft">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-widest">
              <PenLine className="w-3.5 h-3.5" /> Ejercicio del día
            </div>
            <p className="text-xs mt-2 text-foreground/85 leading-relaxed">¿Qué acción puedo tomar hoy que me acerque a mi meta?</p>
            <Input value={dailyAction} onChange={(e) => setDailyAction(e.target.value)} placeholder="Escribe aquí..." className="mt-2 rounded-xl" />
          </Card>
        </div>

        {/* Sopa de letras */}
        <div>
          <div className="text-center mb-2">
            <h3 className="font-display font-extrabold text-lg">Sopa de letras</h3>
            <p className="text-xs text-muted-foreground">Encuentra las palabras clave del método 369.</p>
          </div>
          <WordSearch words={WORDS} storageKey={`cristo-${practice.id}`} />
        </div>

        {/* Quiz */}
        <StageQuiz items={QUIZ_ITEMS} storageKey={`cristo-${practice.id}`} />

        {/* AFIRMACIONES 369 con tabs Mañana/Tarde/Noche */}
        <section className="pt-2">
          <div className="text-center">
            <h3 className="font-display font-extrabold text-xl">Afirmaciones 369 para ti</h3>
            <p className="text-xs text-muted-foreground mt-1">Repite con fe y siente cada palabra.</p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(["Mañana", "Tarde", "Noche"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setAffTab(t)}
                className={cn(
                  "h-10 rounded-full text-xs font-bold transition",
                  affTab === t
                    ? "bg-gradient-to-r from-[#7C5CFF] to-[#F58BCB] text-white shadow-soft"
                    : "bg-secondary text-foreground/70"
                )}
              >
                {t} ({countByTime(t)})
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-2.5">
            {affsByTime.map((a, i) => {
              const key = `${affTab}-${i}`;
              const idx = practice.affirmations.indexOf(a);
              const active = affRead.has(idx);
              return (
                <div key={key} className="app-card p-3 rounded-2xl flex items-center gap-3">
                  <button className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                    <Play className="w-4 h-4 ml-0.5" />
                  </button>
                  <p className="text-sm font-semibold flex-1 leading-snug">{a.text}</p>
                  <button
                    onClick={() => setAffRead((prev) => { const s = new Set(prev); s.has(idx) ? s.delete(idx) : s.add(idx); return s; })}
                    className={cn("w-9 h-9 rounded-full grid place-items-center shrink-0 transition", active ? "bg-pink-500 text-white" : "bg-pink-50 text-pink-500")}
                  >
                    <Heart className="w-4 h-4" fill={active ? "currentColor" : "none"} />
                  </button>
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

        {/* ¿Por qué funciona? */}
        <Card className="rounded-[1.3rem] p-5 shadow-soft">
          <div className="text-xs font-bold text-primary uppercase tracking-widest">¿Por qué funciona el método 369?</div>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Escribir puede ayudarte a ordenar tus pensamientos. La música puede acompañar tu oración y tu atención; los números no determinan tu destino ni aseguran un resultado.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { n: 3, t: "Activa tu intención y programa tu mente.", Icon: Sun, c: "#7C5CFF", bg: "#EDE7FF" },
              { n: 6, t: "Refuerza tu fe y mantiene el enfoque.", Icon: Flame, c: "#F5B441", bg: "#FFF3D6" },
              { n: 9, t: "Agradece, suelta y permite recibir.", Icon: Sparkles, c: "#F58BCB", bg: "#FFE1F1" },
            ].map((x) => (
              <div key={x.n} className="rounded-2xl p-3 text-center" style={{ background: x.bg }}>
                <div className="font-display font-extrabold text-2xl" style={{ color: x.c }}>{x.n}</div>
                <p className="text-[10px] text-foreground/85 mt-1 leading-tight">{x.t}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Consejos */}
        <Card className="rounded-[1.3rem] p-5 shadow-soft bg-gradient-to-br from-accent-pink/5 to-primary/5">
          <div className="text-xs font-bold text-primary uppercase tracking-widest">Consejos para mejores resultados</div>
          <ul className="mt-3 space-y-2">
            {[
              "Escribe a mano para mayor conexión.",
              "Siente gratitud como si ya fuera tuyo.",
              "Toma acción inspirada cada día.",
              "Confía en el proceso y en el tiempo divino.",
            ].map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground/85 leading-relaxed">{c}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Método 369 de Cristo — quote */}
        <Card className="rounded-[1.3rem] p-5 shadow-soft bg-gradient-to-br from-primary/8 to-accent-pink/8 border-primary/20">
          <div className="text-xs font-bold text-primary uppercase tracking-widest">Método 369 de Cristo</div>
          <p className="text-sm text-foreground/85 mt-2 leading-relaxed">
            Un método inspirado en la enseñanza de Jesús: <span className="scripture">"Pidan, y se les dará; busquen, y encontrarán; llamen, y se les abrirá."</span>
          </p>
          <p className="text-xs font-bold text-foreground/70 mt-2">Mateo 7:7</p>
        </Card>

        {/* FINALIZAR */}
        <section className="pt-6">
          <div className="text-center">
            <h3 className="font-display font-extrabold text-xl">Completa tu práctica de hoy</h3>
            <p className="text-xs text-muted-foreground mt-1">Tu constancia crea tu nueva realidad.</p>
          </div>

          <div className="mt-4 grid gap-3">
            <Card className="rounded-[1.3rem] p-4 shadow-soft">
              <div className="text-xs font-bold text-primary uppercase tracking-widest">Resumen de hoy</div>
              <div className="mt-3 space-y-2.5">
                {CHECKLIST.map((line, i) => {
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
              <p className="text-xs text-muted-foreground mt-1">¿Qué sentí hoy al practicar el método 369?</p>
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value.slice(0, 500))}
                placeholder="Escribe tu reflexión aquí..."
                className="mt-3 min-h-28 rounded-2xl"
              />
              <div className="text-[10px] text-muted-foreground text-right mt-1">{reflection.length}/500</div>
            </Card>

            <Card className="rounded-[1.3rem] p-4 shadow-soft">
              <div className="text-xs font-bold text-primary uppercase tracking-widest">Estadísticas</div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Stat Icon={CheckCircle2} label="Días completados" value="7" />
                <Stat Icon={Trophy} label="Prácticas realizadas" value="14" />
                <Stat Icon={Clock} label="Tiempo total" value="3h 45m" />
                <Stat Icon={Bookmark} label="Nivel de fe" value="85%" accent />
                <Stat Icon={Flame} label="Racha actual" value="7 días" />
                <Stat Icon={Crown} label="Nivel" value={isPaid ? "Camino" : "Explorador"} />
              </div>
            </Card>

            <Button
              onClick={completePractice}
              className="w-full h-14 rounded-full font-bold text-base bg-gradient-to-r from-[#7C5CFF] via-[#B49BFF] to-[#F58BCB] text-white shadow-glow"
            >
              <Check className="w-5 h-5 mr-2" /> Completar práctica
            </Button>
            <p className="text-[11px] text-muted-foreground text-center inline-flex items-center gap-1 justify-center">
              <Sparkles className="w-3 h-3" /> ¡Excelente! Estás creando tu realidad desde la fe.
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

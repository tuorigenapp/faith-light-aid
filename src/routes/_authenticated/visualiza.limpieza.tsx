import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, ArrowRight, Sparkles, Heart, Flower2, HandHeart, ShieldCheck,
  Bath, HeartHandshake, Leaf, BookOpen, Feather, Wind, Lock, Check, Play, Info,
  Clock, Bell, Droplet, Flame, Music2, MousePointerClick, PenLine, BarChart3, Trophy, Bookmark, CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getUserPlan } from "@/lib/plan";
import { awardGems } from "@/lib/gems";
import { cn } from "@/lib/utils";
import heroImg from "@/assets/limpieza-hero.jpg";
import bathImg from "@/assets/limpieza-bath.jpg";

export const Route = createFileRoute("/_authenticated/visualiza/limpieza")({
  head: () => ({ meta: [{ title: "Limpieza Espiritual — Reconectando" }] }),
  component: LimpiezaPage,
});

type Practice = {
  id: string;
  title: string;
  duration: string;
  level: 1 | 2 | 3;
  Icon: typeof Bath;
  color: string;
  bg: string;
  bgImage?: string;
  objective: string;
  info: string[];
  materials: { label: string; Icon: typeof Bath }[];
  steps: string[];
  scripture: { text: string; ref: string };
};

const PRACTICES: Practice[] = [
  {
    id: "bano-renovacion",
    title: "Baño de Renovación",
    duration: "20 min",
    level: 1,
    Icon: Bath,
    color: "#7C5CFF",
    bg: "#EDE7FF",
    bgImage: bathImg,
    objective: "Preparar el corazón para iniciar una nueva etapa mediante oración, reflexión y un momento de tranquilidad.",
    info: [
      "Esta práctica ayuda a liberar cargas emocionales y espirituales.",
      "Ideal para momentos de cambio, decisión o nuevos comienzos.",
      "Duración aproximada: 20 minutos.",
      "Prepárate en un lugar tranquilo sin interrupciones.",
    ],
    materials: [
      { label: "Sal marina", Icon: Droplet },
      { label: "Agua tibia", Icon: Droplet },
      { label: "Flores (opcional)", Icon: Flower2 },
      { label: "Vela LED (opcional)", Icon: Flame },
      { label: "Biblia", Icon: BookOpen },
      { label: "Música instrumental", Icon: Music2 },
    ],
    steps: [
      "Preparar el espacio y ambientar con música suave.",
      "Preparar el agua con sal marina y flores.",
      "Respirar profundamente y soltar tensión.",
      "Leer el versículo bíblico recomendado.",
      "Realizar la oración de entrega y liberación.",
      "Permanecer en silencio y sentir la presencia de Dios.",
      "Dar gracias y cerrar con una afirmación de fe.",
    ],
    scripture: { text: "Si alguno está en Cristo, nueva criatura es; las cosas viejas pasaron; he aquí todas son hechas nuevas.", ref: "2 Corintios 5:17" },
  },
  {
    id: "bano-sal",
    title: "Baño con Sal",
    duration: "15 min",
    level: 1,
    Icon: Droplet,
    color: "#5AA9FF",
    bg: "#DCEBFF",
    objective: "Liberar cargas y limpiar tu campo energético con la ayuda de la sal marina y la oración.",
    info: [
      "Recomendado en días de agotamiento o pesadez emocional.",
      "Se realiza al final del día antes de descansar.",
      "Duración aproximada: 15 minutos.",
    ],
    materials: [
      { label: "Sal marina", Icon: Droplet },
      { label: "Agua tibia", Icon: Droplet },
      { label: "Biblia", Icon: BookOpen },
    ],
    steps: [
      "Prepara agua tibia con sal marina.",
      "Ora pidiendo protección y liberación.",
      "Toma el baño mientras confiesas gratitud.",
      "Cierra con el Salmo 23 leído en voz alta.",
    ],
    scripture: { text: "Purifícame con hisopo, y seré limpio; lávame, y seré más blanco que la nieve.", ref: "Salmo 51:7" },
  },
  {
    id: "bano-hierbas",
    title: "Baño con Hierbas",
    duration: "20 min",
    level: 2,
    Icon: Leaf,
    color: "#3FBE8F",
    bg: "#DFF6EA",
    objective: "Renovar tu energía y armonizar cuerpo y espíritu con la fuerza aromática de las hierbas.",
    info: [
      "Combina romero, ruda y albahaca para renovación.",
      "Ideal cuando sientes bloqueo o estancamiento.",
      "Duración aproximada: 20 minutos.",
    ],
    materials: [
      { label: "Hierbas frescas", Icon: Leaf },
      { label: "Agua caliente", Icon: Droplet },
      { label: "Vela", Icon: Flame },
    ],
    steps: [
      "Prepara la infusión de hierbas.",
      "Deja reposar y enfriar a temperatura tibia.",
      "Ora entregando lo que quieres soltar.",
      "Toma el baño en silencio profundo.",
      "Cierra dando gracias en voz alta.",
    ],
    scripture: { text: "Sáname, oh Jehová, y seré sano; sálvame, y seré salvo.", ref: "Jeremías 17:14" },
  },
  {
    id: "oracion-liberacion",
    title: "Oración de Liberación",
    duration: "15 min",
    level: 1,
    Icon: HandHeart,
    color: "#A78BFA",
    bg: "#EDE7FF",
    objective: "Entregar cargas, dolores y ataduras a Dios en una oración guiada de rendición.",
    info: [
      "Ideal para procesos de duelo, perdón o miedo.",
      "Se sugiere hacerlo temprano en la mañana.",
      "Duración aproximada: 15 minutos.",
    ],
    materials: [
      { label: "Biblia", Icon: BookOpen },
      { label: "Cuaderno", Icon: PenLine },
    ],
    steps: [
      "Escribe lo que quieres entregar.",
      "Lee Salmo 34 y Filipenses 4:6-7.",
      "Ora con tus palabras entregando cada carga.",
      "Rompe la hoja como símbolo de liberación.",
      "Cierra agradeciendo la paz recibida.",
    ],
    scripture: { text: "Echando toda vuestra ansiedad sobre él, porque él tiene cuidado de vosotros.", ref: "1 Pedro 5:7" },
  },
  {
    id: "sanacion-interior",
    title: "Sanación Interior",
    duration: "25 min",
    level: 2,
    Icon: Heart,
    color: "#F58BCB",
    bg: "#FFE1F1",
    objective: "Sanar heridas del pasado con la presencia de Dios y la ayuda del Espíritu Santo.",
    info: [
      "Recomendado en procesos de perdón profundo.",
      "Requiere disponer del tiempo completo sin interrupciones.",
      "Duración aproximada: 25 minutos.",
    ],
    materials: [
      { label: "Biblia", Icon: BookOpen },
      { label: "Música suave", Icon: Music2 },
      { label: "Cuaderno", Icon: PenLine },
    ],
    steps: [
      "Ambienta el espacio con música y luz suave.",
      "Respira profundo y entra en oración.",
      "Recorre con Dios el recuerdo que duele.",
      "Perdona y recibe consuelo.",
      "Escribe la palabra que sentiste de Él.",
    ],
    scripture: { text: "Él sana a los quebrantados de corazón y venda sus heridas.", ref: "Salmo 147:3" },
  },
  {
    id: "gratitud",
    title: "Gratitud",
    duration: "10 min",
    level: 1,
    Icon: HeartHandshake,
    color: "#F5B441",
    bg: "#FFF3D6",
    objective: "Elevar tu frecuencia y abrir tu corazón con una práctica de gratitud consciente.",
    info: [
      "Perfecta para comenzar o cerrar el día.",
      "Aumenta el bienestar emocional y la paz.",
      "Duración aproximada: 10 minutos.",
    ],
    materials: [
      { label: "Cuaderno", Icon: PenLine },
    ],
    steps: [
      "Escribe 5 cosas por las que agradeces hoy.",
      "Lee Salmo 100 en voz alta.",
      "Cierra con oración corta de gratitud.",
    ],
    scripture: { text: "Dad gracias en todo, porque esta es la voluntad de Dios para con vosotros en Cristo Jesús.", ref: "1 Tesalonicenses 5:18" },
  },
  {
    id: "meditacion-biblica",
    title: "Meditación Bíblica",
    duration: "20 min",
    level: 2,
    Icon: BookOpen,
    color: "#7C5CFF",
    bg: "#EDE7FF",
    objective: "Grabar la Palabra en tu corazón mediante meditación pausada y aplicación diaria.",
    info: [
      "Ideal para fortalecer tu identidad en Cristo.",
      "Se recomienda hacerla por la mañana.",
      "Duración aproximada: 20 minutos.",
    ],
    materials: [
      { label: "Biblia", Icon: BookOpen },
      { label: "Cuaderno", Icon: PenLine },
    ],
    steps: [
      "Elige un pasaje breve.",
      "Léelo tres veces en voz alta.",
      "Escribe qué te habla Dios.",
      "Ora devolviéndole esa Palabra.",
    ],
    scripture: { text: "Lámpara es a mis pies tu palabra, y lumbrera a mi camino.", ref: "Salmo 119:105" },
  },
  {
    id: "ayuno-espiritual",
    title: "Ayuno Espiritual",
    duration: "—",
    level: 3,
    Icon: Feather,
    color: "#E63980",
    bg: "#FFE1F1",
    objective: "Consagrar un tiempo especial de oración y ayuno para escuchar la voz de Dios con claridad.",
    info: [
      "Práctica avanzada, requiere preparación previa.",
      "Consulta a un pastor o guía espiritual.",
      "Duración variable según tu convicción.",
    ],
    materials: [
      { label: "Biblia", Icon: BookOpen },
      { label: "Diario de oración", Icon: PenLine },
      { label: "Agua", Icon: Droplet },
    ],
    steps: [
      "Define el tipo y duración del ayuno.",
      "Aparta horarios de oración intencional.",
      "Lee, escribe y reflexiona.",
      "Cierra con acción de gracias y una comida ligera.",
    ],
    scripture: { text: "¿No es más bien el ayuno que yo escogí, desatar las ligaduras de impiedad?", ref: "Isaías 58:6" },
  },
];

const HOME_BULLETS = [
  { label: "Paz interior", Icon: Flower2, color: "#A78BFA", bg: "#EDE7FF" },
  { label: "Perdón", Icon: Heart, color: "#F58BCB", bg: "#FFE1F1" },
  { label: "Renovación espiritual", Icon: Sparkles, color: "#F5B441", bg: "#FFF3D6" },
  { label: "Gratitud", Icon: HandHeart, color: "#7C5CFF", bg: "#EDE7FF" },
  { label: "Fortaleza emocional", Icon: ShieldCheck, color: "#3FBE8F", bg: "#DFF6EA" },
];

const AFFIRMATIONS = [
  "Hoy camino en paz.",
  "Dios fortalece mi corazón.",
  "Libero el pasado con esperanza.",
  "Elijo perdonar.",
  "Mi mente se renueva cada día.",
  "Confío en el propósito que Dios tiene para mí.",
  "Camino con esperanza y valentía.",
  "Mi corazón encuentra descanso en Dios.",
];

const CHECKLIST = [
  "Elegí una práctica",
  "Preparé mi espacio",
  "Realicé la oración",
  "Completé los ejercicios",
  "Repetí las afirmaciones",
  "Escribí mi reflexión",
  "Leí el versículo del día",
];

function LimpiezaPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [practiceId, setPracticeId] = useState<string>(PRACTICES[0].id);
  const { data: extra = [] } = useQuery({
    queryKey: ["limpieza-practices"],
    queryFn: async (): Promise<Practice[]> => {
      const { data } = await supabase
        .from("limpieza_practices")
        .select("slug, title, duration, level, objective, info, materials, steps, scripture, scripture_ref, cover_url")
        .eq("is_published", true)
        .order("sort_order");
      return (data ?? []).map((row) => ({
        id: row.slug,
        title: row.title,
        duration: row.duration ?? "20 min",
        level: (row.level ?? 1) as 1 | 2 | 3,
        Icon: Droplet,
        color: "#7C5CFF",
        bg: "#EDE7FF",
        bgImage: row.cover_url ?? undefined,
        objective: row.objective ?? "",
        info: (row.info as string[] | null) ?? [],
        materials: ((row.materials as string[] | null) ?? []).map((label) => ({ label, Icon: Leaf })),
        steps: (row.steps as string[] | null) ?? [],
        scripture: { text: row.scripture ?? "", ref: row.scripture_ref ?? "" },
      }));
    },
  });
  const allPractices = [...PRACTICES, ...extra];
  const [affirmationsRead, setAffirmationsRead] = useState<Set<number>>(new Set());
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [reflection, setReflection] = useState("");

  const { data: plan } = useQuery({
    queryKey: ["plan-limpieza", user?.id],
    enabled: !!user,
    queryFn: async () => (user ? await getUserPlan(user.id) : "explorador"),
  });
  const isPaid = plan === "camino";

  const practice = allPractices.find((p) => p.id === practiceId) ?? PRACTICES[0];

  async function completePractice() {
    if (!user) return;
    if (reflection.trim().length < 10) return toast.error("Escribe al menos una reflexión para completar.");
    await supabase.from("daily_activity").upsert({
      user_id: user.id,
      activity_type: "limpieza_espiritual",
      activity_date: new Date().toISOString().slice(0, 10),
      reference_id: practice.id,
      metadata: { title: practice.title, reflection },
    }, { onConflict: "user_id,activity_date,activity_type,reference_id" });
    await awardGems(50, "limpieza_completed", { practice: practice.id });
    toast.success("¡Práctica completada! +50 🍃");
    setReflection("");
    setChecked(new Set());
    setAffirmationsRead(new Set());
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
          <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-white/70 to-white dark:from-black/40 dark:via-black/70 dark:to-background" />
          <div className="relative px-5 pt-6 pb-8 max-w-2xl mx-auto text-center flex flex-col">
            <Link to="/visualiza" className="inline-flex items-center gap-1 text-xs text-primary font-bold self-start">
              <ArrowLeft className="w-3.5 h-3.5" /> Volver
            </Link>
            <div className="text-[11px] uppercase tracking-widest text-primary font-bold mt-3">Paso 1 de 3 · Bienvenida</div>
            <div className="pt-56 sm:pt-72" />

            <Card className="rounded-[1.75rem] p-6 text-center bg-white/95 dark:bg-card/95 backdrop-blur-xl border border-white/60 shadow-soft">
              <div className="inline-flex items-center gap-1.5 text-xs text-primary font-bold">
                <Sparkles className="w-3.5 h-3.5" /> Programa de Renovación Espiritual
              </div>
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl mt-2 leading-tight">
                Limpieza <span className="bg-gradient-to-r from-[#7C5CFF] to-[#F58BCB] bg-clip-text text-transparent">Espiritual</span>
              </h1>
              <p className="text-sm text-foreground/70 mt-3 leading-relaxed max-w-md mx-auto">
                Antes de comenzar una nueva transformación, dedica un momento para renovar tu mente, fortalecer tu fe y dejar atrás aquello que ya no deseas cargar.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {HOME_BULLETS.slice(0, 3).map((b) => (
                  <div key={b.label} className="flex flex-col items-center gap-1.5">
                    <span className="w-14 h-14 rounded-2xl grid place-items-center" style={{ background: b.bg, color: b.color }}>
                      <b.Icon className="w-6 h-6" />
                    </span>
                    <span className="text-[11px] font-semibold leading-tight text-foreground/85">{b.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 max-w-[240px] mx-auto">
                {HOME_BULLETS.slice(3).map((b) => (
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
          <h2 className="font-display font-extrabold text-2xl mt-2">Elige una práctica guiada <span>🌿</span></h2>
          <p className="text-sm text-muted-foreground mt-2">¿Qué deseas trabajar hoy?</p>
        </div>

        <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/8 p-3 flex items-center gap-2.5 text-primary">
          <MousePointerClick className="w-4 h-4 shrink-0" />
          <p className="text-xs font-semibold">Pulsa la práctica que deseas realizar para continuar.</p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {allPractices.map((p) => {
            const active = p.id === practiceId;
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
                className={cn(
                  "app-card p-3 text-center rounded-2xl transition-all hover:-translate-y-0.5 active:scale-[.97] relative overflow-hidden",
                  active ? "border-2 border-primary shadow-glow" : "border border-border/60",
                )}
              >
                {active && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-white grid place-items-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
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
          <div className="mt-2 font-display font-extrabold text-lg">Baño de Renovación</div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Ideal para comenzar una nueva etapa dejando atrás cargas emocionales y fortaleciendo tu tiempo de oración.</p>
          <Button
            onClick={() => { setPracticeId("bano-renovacion"); setStep(3); }}
            className="mt-3 w-full h-11 rounded-full bg-gradient-to-r from-[#7C5CFF] to-[#F58BCB] text-white font-bold"
          >
            Realizar práctica recomendada
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
      {/* Hero image */}
      <section className="relative h-64 sm:h-80 overflow-hidden rounded-b-[2rem]">
        <img src={practice.bgImage ?? bathImg} alt={practice.title} className="absolute inset-0 h-full w-full object-cover" />
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
        {/* Objetivo */}
        <Card className="rounded-[1.3rem] p-5 shadow-soft">
          <div className="text-xs font-bold text-primary uppercase tracking-widest">Objetivo</div>
          <p className="text-sm text-foreground/85 mt-2 leading-relaxed">{practice.objective}</p>
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

        {/* Materiales (blur+lock for non-paid, except first 2) */}
        <Card className="rounded-[1.3rem] p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-primary uppercase tracking-widest">Materiales</div>
            {!isPaid && (
              <Link to="/membresia" className="text-[11px] text-primary font-bold inline-flex items-center gap-1">
                Ver lista completa <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {practice.materials.map((m, i) => {
              const locked = !isPaid && i >= 3;
              return (
                <div key={i} className="flex flex-col items-center text-center gap-1.5 relative">
                  <span className={cn("w-12 h-12 rounded-2xl grid place-items-center", locked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
                    {locked ? <Lock className="w-4 h-4" /> : <m.Icon className="w-5 h-5" />}
                  </span>
                  <span className={cn("text-[10px] leading-tight text-foreground/80 font-medium", locked && "blur-[2px] select-none")}>{m.label}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Paso a paso (blur+lock from step 3 onwards for free) */}
        <Card className="rounded-[1.3rem] p-5 shadow-soft">
          <div className="text-xs font-bold text-primary uppercase tracking-widest">Paso a paso</div>
          <ol className="mt-3 space-y-3 relative">
            {practice.steps.map((s, i) => {
              const locked = !isPaid && i >= 3;
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
        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-[1.3rem] p-4 shadow-soft bg-brand-soft border-primary/20">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" /> Desafío del día
            </div>
            <p className="text-xs mt-2 text-foreground/85 leading-relaxed">Hoy intenta practicar 10 minutos sin distracciones para conectar con Dios.</p>
          </Card>
          <Card className="rounded-[1.3rem] p-4 shadow-soft">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-widest">
              <PenLine className="w-3.5 h-3.5" /> Ejercicio del día
            </div>
            <p className="text-xs mt-2 text-foreground/85 leading-relaxed">¿Qué deseo entregar hoy a Dios?</p>
          </Card>
        </div>

        {/* AFIRMACIONES */}
        <section className="pt-4">
          <div className="text-center">
            <h3 className="font-display font-extrabold text-xl">Afirmaciones de Liberación</h3>
            <p className="text-xs text-muted-foreground mt-1">Declara con fe cada verdad sobre tu vida.</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {AFFIRMATIONS.map((a, i) => {
              const active = affirmationsRead.has(i);
              return (
                <div key={i} className="app-card p-3 rounded-2xl">
                  <p className="text-xs font-semibold leading-snug min-h-[3rem]">{a}</p>
                  <div className="flex items-center justify-between mt-2">
                    <button className="w-8 h-8 rounded-full bg-primary/10 text-primary grid place-items-center">
                      <Play className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                    <button
                      onClick={() => setAffirmationsRead((prev) => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; })}
                      className={cn("w-8 h-8 rounded-full grid place-items-center transition", active ? "bg-pink-500 text-white" : "bg-pink-50 text-pink-500")}
                    >
                      <Heart className="w-3.5 h-3.5" fill={active ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Versículo */}
          <Card className="mt-4 rounded-[1.3rem] p-5 shadow-soft bg-gradient-to-br from-primary/8 to-accent-pink/8 border-primary/20">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <BookOpen className="w-4 h-4" /> Versículo del día
            </div>
            <p className="scripture mt-3 text-sm leading-relaxed">"{practice.scripture.text}"</p>
            <p className="text-xs font-bold text-foreground/70 mt-2">{practice.scripture.ref}</p>
          </Card>

          <Button
            onClick={() => toast.success("¡Afirmaciones repetidas!")}
            className="w-full mt-4 h-12 rounded-full font-bold bg-gradient-to-r from-[#7C5CFF] to-[#F58BCB] text-white"
          >
            He repetido mis afirmaciones ✨
          </Button>
        </section>

        {/* FINALIZAR PRÁCTICA */}
        <section className="pt-6">
          <div className="text-center">
            <h3 className="font-display font-extrabold text-xl">Finaliza tu práctica</h3>
            <p className="text-xs text-muted-foreground mt-1">Has completado tu tiempo de renovación de hoy.</p>
          </div>

          <div className="mt-4 grid gap-3">
            <Card className="rounded-[1.3rem] p-4 shadow-soft">
              <div className="text-xs font-bold text-primary uppercase tracking-widest">Revisa lo que has completado hoy</div>
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
              <p className="text-xs text-muted-foreground mt-1">¿Qué cambió en mí después de esta práctica?</p>
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value.slice(0, 500))}
                placeholder="Escribe aquí con libertad..."
                className="mt-3 min-h-28 rounded-2xl"
              />
              <div className="text-[10px] text-muted-foreground text-right mt-1">{reflection.length}/500</div>
            </Card>

            {/* Estadísticas */}
            <Card className="rounded-[1.3rem] p-4 shadow-soft">
              <div className="text-xs font-bold text-primary uppercase tracking-widest">Estadísticas</div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <Stat Icon={CheckCircle2} label="Prácticas" value="12" />
                <Stat Icon={Flame} label="Días" value="7" />
                <Stat Icon={Clock} label="Tiempo" value="3h 45m" />
                <Stat Icon={Bookmark} label="Nivel" value="60%" accent />
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

function Stat({ Icon, label, value, accent }: { Icon: typeof Bath; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-2.5 text-center">
      <Icon className={cn("w-4 h-4 mx-auto", accent ? "text-primary" : "text-muted-foreground")} />
      <div className={cn("mt-1 font-display font-extrabold text-sm", accent && "text-primary")}>{value}</div>
      <div className="text-[9px] text-muted-foreground leading-tight mt-0.5">{label}</div>
    </div>
  );
}

import { createFileRoute, Link, Outlet, useParams, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, Pause, Check, Lock, Sparkles, Heart, Home, Briefcase, Flower2, HeartHandshake, User, Star, DollarSign, Headphones, Music, ClipboardList, MessageCircle, Activity, Waves, ArrowRight, ArrowLeft, Eye, Smile, HandHeart, MousePointerClick } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { getUserPlan } from "@/lib/plan";
import { awardGems } from "@/lib/gems";
import heroAsset from "@/assets/manifest-music-hero.jpg";
import { cn } from "@/lib/utils";
import { WordSearch } from "@/components/WordSearch";
import { StageQuiz, type QuizItem } from "@/components/StageQuiz";

export const Route = createFileRoute("/_authenticated/visualiza/$categoryId")({
  head: () => ({ meta: [{ title: "Manifestar con Música — Reconectando" }] }),
  component: CategoryPage,
});

const DAY_TITLES = [
  "Conecta con la Abundancia", "Gratitud que Atrae", "Mente de Prosperidad", "Visualiza tu Vida Ideal",
  "Confío en el Plan Divino", "Yo Soy Capaz", "Abro Caminos", "Recibo con Alegría",
  "Fe que Mueve Montañas", "Suelto para Recibir", "Palabra que Crea", "Camino en Fe",
  "Mi Corazón se Alinea", "Milagros en lo Cotidiano", "Provisión Constante", "Vivo mi Promesa",
  "Puertas Abiertas", "Espíritu que Guía", "Cosecha Anticipada", "Todo Conspira a Favor",
  "Ya es Mío, Gracias Dios",
];

const DAY_DURATION = ["11:42","10:58","12:15","11:33","10:47","11:29","10:31","11:08","12:02","10:44","11:19","10:52","11:37","10:26","11:55","12:08","10:39","11:14","10:58","11:41","12:21"];

const INCLUDES = [
  { Icon: Headphones, label: "21 días de playlists guiadas" },
  { Icon: Heart, label: "Afirmaciones y visualizaciones diarias" },
  { Icon: ClipboardList, label: "Ejercicios de manifestación" },
  { Icon: MessageCircle, label: "Mensajes de fe y motivación" },
  { Icon: Activity, label: "Elevación de tu frecuencia y enfoque" },
  { Icon: Sparkles, label: "Transformación interior y resultados" },
];

const AREAS = [
  { id: "dinero", label: "Dinero y\nProsperidad", desc: "Atrae abundancia y libertad financiera.", Icon: DollarSign, color: "#F5B441", bg: "#FFF3D6" },
  { id: "pareja", label: "Pareja y\nAmor", desc: "Alinea tu corazón con un amor sano.", Icon: Heart, color: "#F58BCB", bg: "#FFE1F1" },
  { id: "casa", label: "Casa\nPropia", desc: "Visualiza tu hogar ideal y hazlo realidad.", Icon: Home, color: "#A78BFA", bg: "#EDE7FF" },
  { id: "negocio", label: "Negocio y\nÉxito", desc: "Impulsa tu emprendimiento y multiplica.", Icon: Briefcase, color: "#5AA9FF", bg: "#DCEBFF" },
  { id: "libre", label: "Paz\nInterior", desc: "Encuentra calma, equilibrio y bienestar.", Icon: Flower2, color: "#B49BFF", bg: "#EDE7FF" },
  { id: "abundancia", label: "Salud y\nBienestar", desc: "Cuida tu cuerpo, mente y espíritu.", Icon: HeartHandshake, color: "#3FBE8F", bg: "#DFF6EA" },
  { id: "trabajo", label: "Crecimiento\nPersonal", desc: "Desarrolla tu mejor versión día a día.", Icon: User, color: "#7C5CFF", bg: "#E7DEFF" },
  { id: "proposito", label: "Propósito y\nMisión", desc: "Descubre tu llamado y vive con sentido.", Icon: Star, color: "#F5B441", bg: "#FFF3D6" },
];

const AFFIRMATIONS = [
  { text: "Estoy alineado con la abundancia infinita del Universo.", Icon: Sparkles, color: "#F5B441", bg: "#FFF3D6" },
  { text: "El dinero llega a mi vida de manera fácil, rápida y constante.", Icon: Heart, color: "#F58BCB", bg: "#FFE1F1" },
  { text: "Merezco vivir en libertad financiera y ayudar a otros con alegría.", Icon: Flower2, color: "#3FBE8F", bg: "#DFF6EA" },
  { text: "Confío en Dios y sé que Él provee todo lo que necesito.", Icon: HandHeart, color: "#A78BFA", bg: "#EDE7FF" },
];

const EX_HINTS = [
  { label: "Visualiza", sub: "Tu vida ideal", Icon: Eye },
  { label: "Siente", sub: "La emoción", Icon: Waves },
  { label: "Agradece", sub: "Ya es tuyo", Icon: Smile },
  { label: "Confía", sub: "Todo fluye", Icon: Sparkles },
];

const MANIFEST_WORDS = ["FE", "GRATITUD", "ABUNDANCIA", "MILAGRO", "CREO", "LUZ", "PAZ", "AMOR"];

const MANIFEST_QUIZ: QuizItem[] = [
  {
    q: "¿Cuál es el primer paso para manifestar con música?",
    options: ["Repetir mecánicamente", "Sentir la emoción como si ya fuera real", "Escuchar sin atención"],
    correct: 1,
    tip: "Manifestar no es solo pedir: es vibrar en la frecuencia de lo que ya recibiste.",
  },
  {
    q: "¿Qué acompaña a la fe verdadera?",
    options: ["La duda constante", "La acción alineada", "La prisa"],
    correct: 1,
    tip: "Fe sin acción es deseo; fe con acción es creación.",
  },
  {
    q: "¿Qué actitud eleva tu frecuencia más rápido?",
    options: ["La queja", "La gratitud", "La comparación"],
    correct: 1,
    tip: "La gratitud multiplica lo que ya tienes y abre paso a lo que viene.",
  },
];

function CategoryPage() {
  const { categoryId } = useParams({ from: "/_authenticated/visualiza/$categoryId" });
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isDayRoute = /^\/visualiza\/[^/]+\/[^/]+$/.test(pathname);
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [exercise, setExercise] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  if (isDayRoute) return <Outlet />;

  const { data } = useQuery({
    queryKey: ["cat-full", categoryId, user?.id],
    queryFn: async () => {
      const [cat, audios, entries, plan] = await Promise.all([
        supabase.from("manifest_categories").select("*").eq("id", categoryId).maybeSingle(),
        supabase.from("manifest_audios").select("*").eq("category_id", categoryId).order("day_index"),
        user ? supabase.from("manifest_entries").select("audio_id, completed, played").eq("user_id", user.id) : Promise.resolve({ data: [] as any[] }),
        user ? getUserPlan(user.id) : Promise.resolve("explorador" as const),
      ]);
      return { cat: cat.data, audios: audios.data ?? [], entries: new Map((entries.data ?? []).map((e: any) => [e.audio_id, e])), plan };
    },
  });

  const c = data?.cat;
  const isPaid = data?.plan === "camino";
  const playing = data?.audios.find((a: any) => a.id === playingId);

  function toggle(a: any, dayIndex: number) {
    if (!isPaid && dayIndex > 1) {
      toast.error("Este día se libera con el plan Camino Origen.");
      return;
    }
    if (playingId === a.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    setPlayingId(a.id);
    setTimeout(() => audioRef.current?.play().catch(() => {}), 50);
  }

  async function completeExercise() {
    if (!user) return;
    if (exercise.trim().length < 10) return toast.error("Escribe al menos una intención para completar el día.");
    const day1 = data?.audios[0];
    if (!day1) return;
    await supabase.from("manifest_entries").upsert({
      user_id: user.id, audio_id: day1.id, played: true, completed: true, peticion: exercise,
    }, { onConflict: "user_id,audio_id" });
    await awardGems(40, "manifest_exercise", { category: categoryId });
    toast.success("¡Tarea completada! +40 🍃");
    setExercise("");
    qc.invalidateQueries();
  }

  if (!c) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

  const doneCount = data?.audios.filter((a: any) => data.entries.get(a.id)?.completed).length ?? 0;
  const selectedArea = AREAS.find((a) => a.id === categoryId);

  const StepDots = (
    <div className="flex items-center justify-center gap-2 pt-4">
      {[1, 2, 3].map((n) => (
        <div key={n} className={cn("h-1.5 rounded-full transition-all", step === n ? "w-8 bg-primary" : "w-4 bg-border")} />
      ))}
    </div>
  );

  // ============ STEP 1 — HOME ============
  if (step === 1) {
    return (
      <div className="pb-24">
        <section className="relative overflow-hidden rounded-b-[2.5rem] min-h-[92vh] flex flex-col">
          <img src={heroAsset} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/70 to-white dark:from-black/40 dark:via-black/70 dark:to-background" />
          <div className="relative px-5 pt-6 pb-8 max-w-2xl mx-auto text-center flex-1 flex flex-col">
            <Link to="/visualiza" className="inline-flex items-center gap-1 text-xs text-primary font-bold mb-3 self-start">
              <ArrowLeft className="w-3.5 h-3.5" /> Volver
            </Link>
            <div className="text-xs uppercase tracking-widest text-primary font-bold">Paso 1 de 3 · Bienvenida</div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl mt-2 tracking-tight leading-tight">
              Manifestar con Música <span className="inline-block">🎵</span>
            </h1>
            <p className="text-sm text-foreground/70 mt-3 max-w-md mx-auto leading-relaxed">
              La música tiene el poder de reprogramar tu mente, elevar tu vibración y alinearte con la vida que deseas.
            </p>

            <div className="mt-auto pt-56 sm:pt-72" />

            <Card className="rounded-[1.5rem] p-5 text-left bg-white/95 dark:bg-card/95 backdrop-blur-xl border border-white/60 shadow-soft">
              <div className="font-display font-bold text-base mb-3">Este programa incluye:</div>
              <ul className="space-y-2.5">
                {INCLUDES.map((it, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0" style={{ background: "#EDE7FF", color: "#7C5CFF" }}>
                      <it.Icon className="w-4 h-4" />
                    </span>
                    <span className="text-foreground/85">{it.label}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <div className="mt-4 rounded-2xl p-4 bg-pink-50 dark:bg-pink-500/10 border border-pink-200/60">
              <Heart className="w-5 h-5 mx-auto text-pink-500" fill="currentColor" />
              <p className="scripture mt-2 text-sm text-foreground/80">"Todo lo que pidas en oración, creyendo, lo recibirás."</p>
              <p className="text-xs font-bold text-foreground/70 mt-1">Mateo 21:22</p>
            </div>

            <Button
              onClick={() => setStep(2)}
              className="mt-6 w-full h-14 rounded-full font-bold text-base bg-gradient-to-r from-[#7C5CFF] via-[#B49BFF] to-[#F58BCB] text-white shadow-glow"
            >
              <Music className="w-5 h-5 mr-2" /> Empezar a Manifestar
            </Button>
            {StepDots}
          </div>
        </section>
      </div>
    );
  }

  // ============ STEP 2 — CHOOSE AREA ============
  if (step === 2) {
    return (
      <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto min-h-[92vh] flex flex-col">
        <button onClick={() => setStep(1)} className="inline-flex items-center gap-1 text-xs text-primary font-bold self-start">
          <ArrowLeft className="w-3.5 h-3.5" /> Atrás
        </button>
        <div className="text-center mt-3">
          <div className="text-xs uppercase tracking-widest text-primary font-bold">Paso 2 de 3 · Elige un área</div>
          <h2 className="font-display font-extrabold text-2xl mt-2">¿Qué deseas manifestar? <span>✨</span></h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Elige el área de tu vida en la que quieres enfocarte durante estos 21 días.
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/8 p-3 flex items-center gap-2.5 text-primary">
          <MousePointerClick className="w-4 h-4 shrink-0" />
          <p className="text-xs font-semibold">Pulsa la categoría que deseas trabajar para continuar.</p>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {AREAS.map((a) => {
            const active = a.id === categoryId;
            return (
              <button
                key={a.id}
                onClick={() => {
                  if (a.id !== categoryId) {
                    navigate({ to: "/visualiza/$categoryId", params: { categoryId: a.id } });
                  }
                  setStep(3);
                }}
                className={cn(
                  "app-card p-4 text-center rounded-2xl transition-all hover:-translate-y-0.5 active:scale-[.97]",
                  active ? "border-2 border-primary shadow-glow" : "border border-border/60",
                )}
              >
                <div className="w-12 h-12 rounded-2xl grid place-items-center mx-auto mb-2" style={{ background: a.bg, color: a.color }}>
                  <a.Icon className="w-5 h-5" />
                </div>
                <div className="font-bold text-[13px] leading-tight whitespace-pre-line">{a.label}</div>
                <div className="text-[10px] text-muted-foreground mt-1.5 leading-snug">{a.desc}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl bg-pink-50 dark:bg-pink-500/10 border border-pink-200/60 p-3.5 flex items-start gap-2.5">
          <Heart className="w-4 h-4 text-pink-500 mt-0.5 shrink-0" fill="currentColor" />
          <p className="text-xs text-foreground/80 leading-relaxed">Puedes cambiar de enfoque cuando lo desees. Lo importante es tu compromiso contigo.</p>
        </div>

        {StepDots}
      </div>
    );
  }

  // ============ STEP 3 — SELECTED CATEGORY (playlist + affirmations + wordsearch + quiz + exercise) ============
  return (
    <div className="pb-32">
      <div className="px-4 pt-6 max-w-3xl mx-auto">
        <button onClick={() => setStep(2)} className="inline-flex items-center gap-1 text-xs text-primary font-bold">
          <ArrowLeft className="w-3.5 h-3.5" /> Cambiar categoría
        </button>
        <div className="text-center mt-3">
          <div className="text-xs uppercase tracking-widest text-primary font-bold">Paso 3 de 3 · Tu lección</div>
          <h2 className="font-display font-extrabold text-2xl mt-2 leading-tight">
            {selectedArea?.label.replace("\n", " ") ?? c.title} <span>💗</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Escucha, siente y practica. Todo en un solo lugar.
          </p>
        </div>
      </div>

      {/* Playlist */}
      <section className="px-4 mt-6 max-w-3xl mx-auto">
        <Card className="rounded-[1.5rem] p-4 shadow-soft border border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl grid place-items-center shrink-0 shadow-glow" style={{ background: `linear-gradient(135deg, ${c.color ?? "#7C5CFF"}, ${c.color ?? "#7C5CFF"}CC)` }}>
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-extrabold text-base leading-tight truncate">Playlist 21 días 🎵</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{c.title} · Manifiesta con música guiada.</p>
            </div>
          </div>
        </Card>

        <div className="mt-3 rounded-[1.5rem] overflow-hidden border border-border/60 bg-card">
          {data?.audios.map((a: any) => {
            const day = a.day_index as number;
            const locked = !isPaid && day > 1;
            const title = DAY_TITLES[day - 1] ?? a.title;
            const dur = DAY_DURATION[day - 1] ?? "11:00";
            const active = playingId === a.id;
            return (
              <button
                key={a.id}
                onClick={() => toggle(a, day)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border/40 last:border-b-0 transition-colors",
                  active ? "bg-primary/10" : "hover:bg-muted/40",
                )}
              >
                <div className="w-12 shrink-0">
                  <div className={cn("text-[11px] font-bold uppercase tracking-wide", active ? "text-primary" : "text-muted-foreground")}>Día {day}</div>
                </div>
                <div className={cn("flex-1 min-w-0", locked && "blur-[3px] select-none")}>
                  <div className="font-semibold text-sm truncate">{title}</div>
                </div>
                <div className={cn("text-xs text-muted-foreground tabular-nums", locked && "blur-[2px]")}>{dur}</div>
                <div
                  className="w-9 h-9 rounded-full grid place-items-center shrink-0 shadow-sm"
                  style={{ background: locked ? "#94A3B822" : (c.color ?? "#7C5CFF"), color: locked ? "#64748B" : "white" }}
                >
                  {locked ? <Lock className="w-4 h-4" /> : active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </div>
              </button>
            );
          })}
        </div>

        {playing && (
          <Card className="mt-3 rounded-[1.3rem] p-3 flex items-center gap-3 shadow-soft border border-border/60">
            <div className="w-12 h-12 rounded-lg shrink-0" style={{ background: `linear-gradient(135deg, ${c.color ?? "#7C5CFF"}, ${c.color ?? "#7C5CFF"}CC)` }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">Día {playing.day_index} — {DAY_TITLES[playing.day_index - 1]}</div>
              <div className="h-1 bg-muted rounded-full mt-1.5 overflow-hidden">
                <div className="h-full transition-all" style={{ width: `${duration ? (progress / duration) * 100 : 5}%`, background: c.color ?? "#7C5CFF" }} />
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 flex justify-between tabular-nums">
                <span>{fmt(progress)}</span><span>{DAY_DURATION[playing.day_index - 1]}</span>
              </div>
            </div>
            <button onClick={() => { audioRef.current?.pause(); setPlayingId(null); }} className="w-11 h-11 rounded-full grid place-items-center shrink-0 shadow-glow" style={{ background: c.color ?? "#7C5CFF", color: "white" }}>
              <Pause className="w-5 h-5" />
            </button>
            <audio
              ref={audioRef}
              src={playing.audio_url ?? undefined}
              onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onEnded={() => setPlayingId(null)}
            />
          </Card>
        )}

        {!isPaid && (
          <Card className="mt-3 rounded-2xl p-4 bg-gradient-to-br from-primary/10 to-pink-100/50 dark:to-pink-500/10 border border-primary/30">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold">Desbloquea los 21 días</p>
                <p className="text-xs text-muted-foreground mt-1">Con el plan Camino Origen accedes a toda la playlist, ejercicios, PDF imprimible y el resto de programas.</p>
                <Link to="/membresia"><Button size="sm" className="mt-3 rounded-full h-9 bg-primary">Ver planes <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
              </div>
            </div>
          </Card>
        )}
      </section>

      {/* Afirmaciones */}
      <section className="px-4 mt-10 max-w-3xl mx-auto">
        <div className="text-center">
          <h2 className="font-display font-extrabold text-xl">Afirmaciones del día <span>💗</span></h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Repite estas afirmaciones con fe y convicción.</p>
        </div>
        <div className="mt-5 flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-2 no-scrollbar">
          {AFFIRMATIONS.map((af, i) => (
            <Card key={i} className="snap-center shrink-0 w-[62%] sm:w-[45%] max-w-[220px] rounded-2xl p-4 text-center shadow-soft border border-border/60" style={{ background: af.bg }}>
              <div className="w-10 h-10 rounded-2xl bg-white/70 grid place-items-center mx-auto" style={{ color: af.color }}>
                <af.Icon className="w-5 h-5" fill={af.Icon === Heart ? "currentColor" : "none"} />
              </div>
              <p className="text-[13px] leading-relaxed mt-3 text-foreground/85 font-medium">{af.text}</p>
              <div className="mt-3 flex items-center justify-center gap-4">
                <button className="w-8 h-8 rounded-full grid place-items-center" style={{ color: af.color }}><Play className="w-4 h-4 ml-0.5" /></button>
                <button className="w-8 h-8 rounded-full grid place-items-center" style={{ color: af.color }}><Heart className="w-4 h-4" /></button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Sopa de letras */}
      <section className="px-4 mt-10 max-w-3xl mx-auto">
        <div className="text-center mb-4">
          <h2 className="font-display font-extrabold text-xl">Sopa de letras de la lección <span>🔎</span></h2>
          <p className="text-sm text-muted-foreground mt-2">Encuentra las palabras que activan tu manifestación.</p>
        </div>
        <WordSearch words={MANIFEST_WORDS} storageKey={`manifest-${categoryId}`} gemsReward={40} />
      </section>

      {/* Preguntas / Quiz */}
      <section className="px-4 mt-10 max-w-3xl mx-auto">
        <div className="text-center mb-4">
          <h2 className="font-display font-extrabold text-xl">Preguntas de la lección <span>🧠</span></h2>
          <p className="text-sm text-muted-foreground mt-2">Responde desde el corazón. Cada acierto suma hojas.</p>
        </div>
        <StageQuiz items={MANIFEST_QUIZ} storageKey={`manifest-${categoryId}`} gemsPerCorrect={15} />
      </section>

      {/* Ejercicio + finalizar */}
      <section className="px-4 mt-10 max-w-3xl mx-auto">
        <Card className="rounded-[1.5rem] p-5 shadow-soft border border-border/60">
          <div className="text-center">
            <h2 className="font-display font-extrabold text-xl">Ejercicio de Manifestación <span>✍️</span></h2>
            <p className="text-sm text-muted-foreground mt-2">Reflexiona y escribe con intención.</p>
          </div>
          <label className="block text-sm font-semibold mt-5 mb-2">¿Qué deseas manifestar en tu vida y por qué es importante para ti?</label>
          <div className="relative">
            <Textarea
              value={exercise}
              onChange={(e) => setExercise(e.target.value.slice(0, 1000))}
              placeholder="Escribe aquí con libertad..."
              className="min-h-32 rounded-2xl resize-none pr-16"
            />
            <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground tabular-nums">{exercise.length}/1000</span>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {EX_HINTS.map((h, i) => (
              <div key={i} className="rounded-2xl border border-border/60 py-3 text-center bg-muted/30">
                <h.Icon className="w-4 h-4 mx-auto text-primary" />
                <div className="text-[11px] font-bold mt-1">{h.label}</div>
                <div className="text-[9px] text-muted-foreground">{h.sub}</div>
              </div>
            ))}
          </div>
          <Button
            onClick={completeExercise}
            className="mt-5 w-full h-14 rounded-full font-bold text-base bg-gradient-to-r from-[#7C5CFF] via-[#B49BFF] to-[#F58BCB] text-white shadow-glow"
          >
            <Check className="w-5 h-5 mr-2" /> Finalizar tarea del día
          </Button>
          {doneCount > 0 && (
            <p className="text-center text-xs text-muted-foreground mt-3">Has completado <b className="text-primary">{doneCount}</b> de 21 días.</p>
          )}
        </Card>

        {StepDots}
      </section>
    </div>
  );
}

function fmt(s: number) {
  if (!isFinite(s)) return "00:00";
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

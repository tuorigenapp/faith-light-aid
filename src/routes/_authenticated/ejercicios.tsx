import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Check, Clock, Dumbbell, Lock, Sparkles, X, ArrowRight, HelpCircle, Brain } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DuolingoPath, type PathNode } from "@/components/DuolingoPath";
import { WordSearch } from "@/components/WordSearch";
import { ChestWords } from "@/components/games/ChestWords";
import { GuessWord } from "@/components/games/GuessWord";
import { PingPongToss } from "@/components/games/PingPongToss";
import { FishInWater } from "@/components/games/FishInWater";
import { DartThrow } from "@/components/games/DartThrow";
import { MentalTasks } from "@/components/games/MentalTasks";
import {
  dayOfYear,
  getAllExercises,
  getExerciseKeywords,
  getExerciseQuiz,
  getGameKindForDay,
  getMainWord,
  isDayUnlocked,
  TOTAL_DAYS,
  type DailyExercise,
} from "@/lib/ejercicios365";
import { awardLeaf } from "@/lib/gems";
import exerciseCover from "@/assets/prayer-exercise.jpg";

export const Route = createFileRoute("/_authenticated/ejercicios")({
  head: () => ({
    meta: [
      { title: "Ejercicios diarios — ORIGEN" },
      { name: "description", content: "Mapa diario estilo Duolingo con prácticas, quiz, juegos mentales y cierre espiritual de ORIGEN." },
      { property: "og:title", content: "Ejercicios diarios — ORIGEN" },
      { property: "og:description", content: "Un ejercicio por día, desbloqueado a medianoche, con 5 pasos interactivos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ejercicios,
});

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function refIdFor(day: number) {
  return `ex-${day}`;
}

function Ejercicios() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = dayOfYear();
  const [active, setActive] = useState<DailyExercise | null>(null);
  const all = useMemo(() => getAllExercises(), []);
  const visible = useMemo(() => {
    const start = Math.max(1, today - 3);
    const end = Math.min(TOTAL_DAYS, today + 18);
    return all.slice(start - 1, end);
  }, [all, today]);

  const { data: completedDays, isLoading, isError } = useQuery({
    queryKey: ["exercises365_completions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return new Set<number>();
      const { data, error } = await supabase
        .from("daily_activity")
        .select("reference_id")
        .eq("user_id", user.id)
        .eq("activity_type", "exercise_completed");
      if (error) throw error;
      return new Set(
        (data ?? [])
          .map((d) => d.reference_id ?? "")
          .filter((r) => r.startsWith("ex-"))
          .map((r) => Number(r.replace("ex-", ""))),
      );
    },
  });

  const completed = completedDays ?? new Set<number>();
  const todayCompleted = completed.has(today);
  const completedCount = completed.size;
  const currentExercise = all[today - 1];

  function stateFor(ex: DailyExercise): PathNode["state"] {
    if (completed.has(ex.day)) return "completed";
    if (ex.day === today && !todayCompleted) return "active";
    return "locked";
  }

  const pathNodes: PathNode[] = visible.map((ex) => ({
    key: String(ex.day),
    label: ex.day === today ? `Día ${ex.day}: ${ex.title}` : `Día ${ex.day}`,
    note: ex.day === today ? "Disponible hoy" : ex.day === today + 1 ? "Mañana 12:00 AM" : ex.day < today ? "Ya pasó" : "Bloqueado",
    state: stateFor(ex),
  }));

  function openExercise(ex: DailyExercise) {
    const canOpen = isDayUnlocked(ex.day, today) && ex.day === today && !todayCompleted;
    if (!canOpen) {
      if (ex.day === today && todayCompleted) toast("Ya completaste tu ejercicio de hoy", { description: "El siguiente se abre a las 12:00 de la noche." });
      else toast("Este ejercicio aún no está disponible", { description: ex.day > today ? "Se abre cuando llegue su día." : "Sigue con el paso disponible de hoy." });
      return;
    }
    setActive(ex);
  }

  async function complete(ex: DailyExercise) {
    if (!user || completed.has(ex.day) || ex.day !== today) return;
    const refId = refIdFor(ex.day);
    const { error } = await supabase.from("daily_activity").insert({
      user_id: user.id,
      activity_date: todayIso(),
      activity_type: "exercise_completed",
      reference_id: refId,
      metadata: { title: ex.title, day: ex.day, theme: ex.theme } as never,
    });
    if (error && !String(error.message).toLowerCase().includes("duplicate")) {
      toast.error("No pudimos guardar tu ejercicio. Intenta de nuevo.");
      return;
    }
    await awardLeaf("ejercicios", "major", ex.title);
    toast.success("Ejercicio completado", { description: "Mañana tendrás una nueva práctica." });
    setActive(null);
    qc.invalidateQueries({ queryKey: ["exercises365_completions"] });
    qc.invalidateQueries({ queryKey: ["daily_exercise_today"] });
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  const progressPct = Math.round((completedCount / TOTAL_DAYS) * 100);

  return (
    <div className="px-4 py-6 md:p-10 max-w-5xl mx-auto mobile-safe-bottom lg:pb-10">
      <section className="relative overflow-hidden rounded-[24px] bg-card shadow-soft">
        <img src={exerciseCover} alt="Ejercicios diarios ORIGEN" loading="eager" className="h-56 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1B1930]/85 via-[#1B1930]/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-primary-foreground">
          <div className="inline-flex items-center gap-2 rounded-[10px] bg-background/15 border border-primary-foreground/20 backdrop-blur-xl px-3 py-1 text-[11px] font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Un paso diario
          </div>
          <h1 className="font-display font-extrabold text-[30px] leading-tight mt-3 text-primary-foreground">Ejercicios diarios</h1>
          <p className="mt-2 max-w-[34rem] text-[14px] leading-relaxed text-primary-foreground/86">
            Día {today}: {currentExercise?.title}. Una práctica, cinco pasos y un solo desbloqueo por día.
          </p>
        </div>
      </section>

      <section className="mt-4 app-card p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest font-bold text-primary">Tu avance</p>
            <h2 className="font-display font-bold text-[17px] leading-tight">Día {today}: vuelve a tu verdad</h2>
          </div>
          <span className="text-[12px] font-black text-primary">{completedCount}/{TOTAL_DAYS}</span>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-primary/12 overflow-hidden">
          <div className="h-full bg-brand-gradient rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </section>

      <section className="mt-4 -mx-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 w-max pb-1">
          {visible.slice(0, 10).map((ex) => {
            const unlocked = ex.day === today && !todayCompleted;
            const isDone = completed.has(ex.day);
            return (
              <button
                key={ex.day}
                onClick={() => openExercise(ex)}
                className={cn(
                  "w-[210px] shrink-0 rounded-[16px] border bg-card p-4 text-left shadow-soft active:scale-[.98] transition",
                  unlocked && "border-primary ring-2 ring-primary/18",
                  isDone && "border-[#3FBE8F]/45 bg-[#3FBE8F]/8",
                  !unlocked && !isDone && "opacity-75",
                )}
              >
                <span className="text-[11px] font-black uppercase tracking-widest text-primary">Día {ex.day}</span>
                <h3 className="mt-1 font-display font-bold text-[15px] leading-tight line-clamp-2">{ex.title}</h3>
                <p className="mt-1 text-[12px] text-muted-foreground line-clamp-2">{ex.theme}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-primary">
                  {isDone ? <Check className="w-3.5 h-3.5" /> : unlocked ? <ArrowRight className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {isDone ? "Completado" : unlocked ? "Abrir hoy" : "No disponible"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {isLoading && <div className="mt-6 h-80 rounded-[24px] bg-muted animate-pulse" />}
      {isError && (
        <div className="app-card mt-6 p-6 text-center">
          <p className="text-muted-foreground text-sm">No pudimos cargar tu historial de ejercicios.</p>
        </div>
      )}
      {!isLoading && !isError && (
        <section className="mt-6 rounded-[28px] bg-gradient-to-b from-[#2E1A4D] via-[#1E1033] to-[#150C24] px-4 py-7 overflow-hidden">
          <div className="text-center text-primary-foreground">
            <p className="text-[11px] uppercase tracking-widest font-bold text-primary-foreground/70">Mapa de prácticas</p>
            <h2 className="font-display font-extrabold text-[24px] leading-tight mt-1 text-primary-foreground">Tu siguiente paso</h2>
          </div>
          <DuolingoPath
            nodes={pathNodes}
            onSelect={(node) => {
              const ex = all[Number(node.key) - 1];
              if (ex) openExercise(ex);
            }}
            className="mt-6"
          />
        </section>
      )}

      {active && (
        <ExerciseModal
          exercise={active}
          completed={completed.has(active.day)}
          onClose={() => setActive(null)}
          onComplete={() => complete(active)}
        />
      )}
    </div>
  );
}

function ExerciseModal({
  exercise,
  completed,
  onClose,
  onComplete,
}: {
  exercise: DailyExercise;
  completed: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(1);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizPick, setQuizPick] = useState<number | null>(null);
  const [mentalDone, setMentalDone] = useState(false);
  const [gameDone, setGameDone] = useState(false);
  const keywords = useMemo(() => getExerciseKeywords(exercise), [exercise]);
  const quiz = useMemo(() => getExerciseQuiz(exercise), [exercise]);
  const gameKind = getGameKindForDay(exercise.day);
  const currentQuiz = quiz[quizIdx];
  const quizDone = quizIdx >= quiz.length - 1 && quizPick !== null;

  function nextQuiz() {
    if (quizIdx >= quiz.length - 1) {
      setStep(3);
      setQuizPick(null);
      return;
    }
    setQuizIdx((i) => i + 1);
    setQuizPick(null);
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#1B1930]/70 backdrop-blur-sm grid place-items-end sm:place-items-center p-0 sm:p-4" onClick={onClose}>
      <div className="app-card max-w-xl w-full max-h-[92vh] overflow-y-auto rounded-t-[24px] sm:rounded-[24px] p-5 sm:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-widest font-bold text-primary">Día {exercise.day} · Paso {step} de 5</div>
            <h2 className="font-display font-extrabold text-[22px] mt-1 leading-tight">{exercise.title}</h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar ejercicio" className="shrink-0 w-11 h-11 rounded-full bg-muted grid place-items-center active:scale-95 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 flex gap-1.5" aria-label={`Paso ${step} de 5`}>
          {Array.from({ length: 5 }).map((_, i) => <span key={i} className={cn("h-1.5 flex-1 rounded-full", i + 1 <= step ? "bg-primary" : "bg-primary/12")} />)}
        </div>

        {step === 1 && (
          <section className="mt-5">
            <p className="text-muted-foreground text-[14px] leading-relaxed">{exercise.purpose}</p>
            {exercise.scripture && <p className="scripture mt-3 text-sm">“{exercise.scripture}”</p>}
            <ol className="mt-5 space-y-2.5 text-sm">
              {exercise.steps.map((s, i) => (
                <li key={i} className="flex gap-3 rounded-[16px] border border-border p-3 bg-card">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-bold">{i + 1}</span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
            <StepButton onClick={() => setStep(2)}>Hacer el quiz</StepButton>
          </section>
        )}

        {step === 2 && currentQuiz && (
          <section className="mt-5">
            <div className="text-[11px] uppercase tracking-widest font-bold text-primary inline-flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" /> Quiz del ejercicio</div>
            <h3 className="font-display font-bold text-[18px] leading-tight mt-2">{currentQuiz.question}</h3>
            <div className="mt-3 space-y-2">
              {currentQuiz.options.map((op, i) => (
                <button key={op} disabled={quizPick !== null} onClick={() => setQuizPick(i)} className={cn("w-full min-h-[48px] rounded-[12px] border px-3 text-left text-[13.5px] font-semibold active:scale-[.98] transition", quizPick === null && "bg-card border-border", quizPick !== null && i === currentQuiz.correctIndex && "bg-[#3FBE8F]/15 border-[#3FBE8F]/40 text-[#2F9A73]", quizPick === i && i !== currentQuiz.correctIndex && "bg-destructive/10 border-destructive/30 text-destructive")}>
                  {op}
                </button>
              ))}
            </div>
            {quizPick !== null && <p className="mt-3 rounded-[12px] bg-primary/8 p-3 text-[13px] leading-snug">{currentQuiz.explanation}</p>}
            <StepButton disabled={quizPick === null} onClick={nextQuiz}>{quizDone ? "Ir al reto mental" : "Siguiente pregunta"}</StepButton>
          </section>
        )}

        {step === 3 && (
          <section className="mt-5">
            <div className="text-[11px] uppercase tracking-widest font-bold text-primary inline-flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" /> Reto mental</div>
            <div className="mt-3"><MentalTasks tasks={exercise.steps.slice(0, 4)} onComplete={() => setMentalDone(true)} /></div>
            <StepButton disabled={!mentalDone} onClick={() => setStep(4)}>Abrir juego del día</StepButton>
          </section>
        )}

        {step === 4 && (
          <section className="mt-5">
            <h3 className="font-display font-bold text-[19px] leading-tight text-center">Juego aplicado a tu práctica</h3>
            <div className="mt-3">{renderExerciseGame(gameKind, keywords, getMainWord(exercise), () => setGameDone(true), exercise.day)}</div>
            <StepButton disabled={!gameDone} onClick={() => setStep(5)}>Cerrar mi práctica</StepButton>
          </section>
        )}

        {step === 5 && (
          <section className="mt-5 text-center">
            <div className="mx-auto w-16 h-16 rounded-[16px] bg-[#3FBE8F]/12 grid place-items-center text-[#2F9A73]"><Check className="w-8 h-8" /></div>
            <h3 className="mt-3 font-display font-extrabold text-[22px] leading-tight">Listo por hoy</h3>
            <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">{exercise.closing}</p>
            <button onClick={onComplete} disabled={completed} className={cn("mt-5 w-full h-[54px] rounded-[12px] text-[16px] font-semibold inline-flex items-center justify-center gap-2 active:scale-[.97] transition", completed ? "bg-[#3FBE8F]/15 text-[#2F9A73]" : "btn-primary-gradient text-primary-foreground")}>
              <Check className="w-4 h-4" /> {completed ? "Completado" : "Completar ejercicio"}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}

function StepButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="mt-5 w-full h-[52px] rounded-[12px] btn-primary-gradient text-primary-foreground text-[15px] font-semibold inline-flex items-center justify-center gap-2 active:scale-[.97] transition disabled:opacity-50">
      {children} <ArrowRight className="w-4 h-4" />
    </button>
  );
}

function renderExerciseGame(kind: string, words: string[], mainWord: string, onComplete: () => void, day: number) {
  const good = words.length ? words : [mainWord, "PAZ", "FE", "CALMA"];
  const bad = ["MIEDO", "CULPA", "RUIDO", "PRISA"];
  const sk = `ejercicio-${day}:${kind}`;
  if (kind === "cofre") return <ChestWords correct={good.slice(0, 6)} decoys={bad} storageKey={sk} onComplete={onComplete} />;
  if (kind === "adivina") return <GuessWord words={[mainWord, ...good]} decoys={bad} storageKey={sk} onComplete={onComplete} />;
  if (kind === "sopa") return <div><WordSearch words={good.slice(0, 8)} storageKey={`exercise-${day}`} /><button onClick={onComplete} className="mt-3 w-full min-h-[48px] rounded-[12px] bg-primary text-primary-foreground font-semibold text-[14.5px] active:scale-[.97] transition">Ya encontré mis palabras</button></div>;
  if (kind === "pimpon") return <PingPongToss storageKey={sk} onComplete={onComplete} />;
  if (kind === "pez") return <FishInWater good={good.slice(0, 5)} bad={bad} storageKey={sk} onComplete={onComplete} />;
  return <DartThrow storageKey={sk} onComplete={onComplete} />;
}


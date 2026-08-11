import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Check, Clock, Lock, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  dayOfYear,
  getAllExercises,
  isDayUnlocked,
  TOTAL_DAYS,
  type DailyExercise,
} from "@/lib/ejercicios365";
import { awardLeaf } from "@/lib/gems";

export const Route = createFileRoute("/_authenticated/ejercicios")({
  head: () => ({ meta: [{ title: "Ejercicios diarios — ORIGEN" }] }),
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
  const [openedToday, setOpenedToday] = useState<Set<number>>(new Set());

  const all = useMemo(() => getAllExercises(), []);

  const {
    data: completedDays,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["exercises365_completions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_activity")
        .select("reference_id")
        .eq("user_id", user!.id)
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
  const completedCount = completed.size;

  function openExercise(ex: DailyExercise) {
    if (!isDayUnlocked(ex.day, today)) return;
    setActive(ex);
    if (!openedToday.has(ex.day)) {
      setOpenedToday((s) => new Set(s).add(ex.day));
      awardLeaf("ejercicios", "minor", ex.title).catch(() => {});
    }
  }

  async function complete(ex: DailyExercise) {
    if (!user || completed.has(ex.day)) return;
    const refId = refIdFor(ex.day);
    const { error } = await supabase.from("daily_activity").insert({
      user_id: user.id,
      activity_date: todayIso(),
      activity_type: "exercise_completed",
      reference_id: refId,
      metadata: { title: ex.title, day: ex.day } as never,
    });
    if (error && !String(error.message).toLowerCase().includes("duplicate")) {
      toast.error("No pudimos guardar tu ejercicio. Intenta de nuevo.");
      return;
    }
    await awardLeaf("ejercicios", "major", ex.title);
    toast.success("Ejercicio completado 🍃");
    setActive(null);
    qc.invalidateQueries({ queryKey: ["exercises365_completions"] });
    qc.invalidateQueries({ queryKey: ["daily_exercise_today"] });
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  const progressPct = Math.round((completedCount / TOTAL_DAYS) * 100);

  return (
    <div className="px-4 py-6 md:p-10 max-w-5xl mx-auto mobile-safe-bottom lg:pb-10">
      <section className="hero-card p-6 md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-background/15 border border-primary-foreground/20 backdrop-blur-xl px-3 py-1 text-xs font-bold text-gold">
          <Sparkles className="w-3.5 h-3.5" /> Un ejercicio por día, 365 al año
        </div>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl mt-4">Ejercicios diarios</h1>
        <p className="mt-2 text-primary-foreground/85 max-w-2xl text-[14px]">
          Sanación emocional, patrones familiares, niño interior, perdón, identidad y tu relación con Dios: un paso
          concreto cada día. Hoy es el día {today} de {TOTAL_DAYS}.
        </p>

        <div className="mt-5">
          <div className="flex items-center justify-between text-[12px] font-bold">
            <span>Progreso</span>
            <span>
              {completedCount}/{TOTAL_DAYS}
            </span>
          </div>
          <div className="mt-1.5 h-2.5 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </section>

      {isLoading && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-28 rounded-[16px] bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="app-card mt-6 p-6 text-center">
          <p className="text-muted-foreground text-sm">No pudimos cargar tu historial de ejercicios.</p>
        </div>
      )}

      {!isLoading && !isError && all.length === 0 && (
        <div className="app-card mt-6 p-6 text-center">
          <p className="text-muted-foreground text-sm">Aún no hay ejercicios disponibles.</p>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {all.map((ex) => {
            const unlocked = isDayUnlocked(ex.day, today);
            const isDone = completed.has(ex.day);
            const isToday = ex.day === today;
            return (
              <button
                key={ex.day}
                onClick={() => openExercise(ex)}
                disabled={!unlocked}
                className={cn(
                  "text-left rounded-[16px] p-3.5 border transition active:scale-[.98] flex flex-col gap-2 min-h-28",
                  !unlocked && "opacity-60 cursor-not-allowed border-border bg-muted/40",
                  unlocked && isDone && "border-[#3FBE8F]/45 bg-[#3FBE8F]/8",
                  unlocked && !isDone && "border-border bg-card hover:border-primary/40",
                  isToday && unlocked && "ring-2 ring-primary/50",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground">Día {ex.day}</span>
                  {!unlocked ? (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  ) : isDone ? (
                    <Check className="w-4 h-4 text-[#3FBE8F]" />
                  ) : (
                    <Clock className="w-4 h-4 text-primary" />
                  )}
                </div>
                <span className="text-[10.5px] uppercase tracking-widest font-bold text-primary line-clamp-1">
                  {ex.theme}
                </span>
                <span className="font-display font-bold text-[13.5px] leading-tight line-clamp-2">{ex.title}</span>
                {!unlocked && (
                  <span className="text-[11px] text-muted-foreground mt-auto">
                    {ex.day === today + 1 ? "Se desbloquea mañana" : "Bloqueado"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
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
  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm grid place-items-end sm:place-items-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="app-card max-w-xl w-full max-h-[92vh] overflow-y-auto rounded-t-[2rem] sm:rounded-[2rem] p-5 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-primary">{exercise.theme}</div>
            <h2 className="font-display font-extrabold text-xl mt-1">{exercise.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-9 h-9 rounded-full bg-muted grid place-items-center active:scale-95 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed mt-3">{exercise.purpose}</p>
        {exercise.scripture && <p className="scripture mt-3 text-sm">"{exercise.scripture}"</p>}

        <div className="mt-4 flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground">
          <Clock className="w-3.5 h-3.5" /> {exercise.durationMin} min
        </div>

        <ol className="mt-5 space-y-2.5 text-sm">
          {exercise.steps.map((s, i) => (
            <li key={i} className="flex gap-3 rounded-2xl border border-border p-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-bold">
                {i + 1}
              </span>
              <span className="leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>

        <p className="mt-5 text-[13px] text-muted-foreground italic leading-relaxed">{exercise.closing}</p>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 h-11 rounded-full bg-muted text-[14px] font-semibold">
            Cerrar
          </button>
          <button
            onClick={onComplete}
            disabled={completed}
            className={cn(
              "flex-1 h-11 rounded-full text-[14px] font-semibold inline-flex items-center justify-center gap-1.5",
              completed ? "bg-[#3FBE8F]/15 text-[#3FBE8F]" : "btn-primary-gradient text-white",
            )}
          >
            <Check className="w-4 h-4" /> {completed ? "Completado" : "Completar"}
          </button>
        </div>
      </div>
    </div>
  );
}

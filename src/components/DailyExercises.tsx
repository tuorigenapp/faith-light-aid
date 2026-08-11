import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { awardLeaf } from "@/lib/gems";
import { Check, Dumbbell, Timer, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { getTodayExercise } from "@/lib/ejercicios365";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/** Ejercicio de hoy: 1 por día, 365 al año, compartido con /ejercicios. */
export function DailyExercises() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const exercise = getTodayExercise();
  const refId = `ex-${exercise.day}`;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["daily_exercise_today", user?.id, refId],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_activity")
        .select("id")
        .eq("user_id", user!.id)
        .eq("activity_type", "exercise_completed")
        .eq("activity_date", todayIso())
        .eq("reference_id", refId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const done = !!data;

  async function complete() {
    if (!user || done) return;
    const { error } = await supabase.from("daily_activity").insert({
      user_id: user.id,
      activity_date: todayIso(),
      activity_type: "exercise_completed",
      reference_id: refId,
      metadata: { title: exercise.title, day: exercise.day } as never,
    });
    if (error && !String(error.message).toLowerCase().includes("duplicate")) return;
    await awardLeaf("ejercicios", "major", exercise.title);
    qc.invalidateQueries({ queryKey: ["profile"] });
    await refetch();
  }

  return (
    <section className="app-card p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest font-bold text-primary inline-flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5" /> Ejercicio de hoy
          </div>
          <h3 className="font-display font-bold text-[17px] mt-1 leading-tight">
            {done ? "Completaste tu ejercicio de hoy 🍃" : exercise.title}
          </h3>
        </div>
        {done && (
          <span className="shrink-0 rounded-full bg-[#3FBE8F]/15 text-[#3FBE8F] px-3 py-1 text-[12px] font-bold">
            Hecho
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="mt-3 h-24 rounded-[16px] bg-muted animate-pulse" />
      ) : isError ? (
        <p className="mt-3 text-[13px] text-destructive">No pudimos cargar tu ejercicio. Intenta de nuevo.</p>
      ) : (
        <button
          onClick={complete}
          disabled={done}
          className={cn(
            "mt-3 w-full text-left rounded-[16px] p-3.5 border transition active:scale-[.98]",
            done ? "border-[#3FBE8F]/45 bg-[#3FBE8F]/8" : "border-border bg-card hover:border-primary/40",
          )}
        >
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
            <span
              className={cn(
                "w-10 h-10 rounded-[12px] grid place-items-center shrink-0",
                done ? "bg-[#3FBE8F]/20 text-[#3FBE8F]" : "bg-primary/10 text-primary",
              )}
            >
              {done ? <Check className="w-5 h-5" /> : <Timer className="w-5 h-5" />}
            </span>
            <span className="min-w-0">
              <span className="block text-[10.5px] uppercase tracking-widest font-bold text-muted-foreground">
                {exercise.theme}
              </span>
              <span className="block text-[12.5px] text-muted-foreground mt-1 leading-snug">{exercise.purpose}</span>
            </span>
            <span className="shrink-0 text-[11px] font-bold text-muted-foreground">{exercise.durationMin} min</span>
          </div>
        </button>
      )}

      <Link
        to="/ejercicios"
        className="mt-3 h-11 rounded-[12px] inline-flex w-full items-center justify-center gap-1.5 bg-primary/10 text-primary text-[13px] font-semibold active:scale-[.98] transition"
      >
        Ver calendario de 365 ejercicios <ArrowRight className="w-4 h-4" />
      </Link>
    </section>
  );
}

import { Check, Leaf, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DailyExercise } from "@/lib/ejercicios365";

const OFFSETS = [0, 42, 66, 42, 0, -42, -66, -42];

export type ExerciseNodeState = "completed" | "active" | "locked";

export function ExercisePath({
  items,
  onSelect,
}: {
  items: { exercise: DailyExercise; state: ExerciseNodeState }[];
  onSelect: (exercise: DailyExercise, state: ExerciseNodeState) => void;
}) {
  return (
    <ol className="relative mx-auto w-full max-w-[380px] py-2" aria-label="Camino de ejercicios diarios">
      {items.map(({ exercise, state }, i) => {
        const offset = OFFSETS[i % OFFSETS.length]!;
        const isDone = state === "completed";
        const isActive = state === "active";
        const isLocked = state === "locked";
        return (
          <li
            key={exercise.day}
            className="relative flex flex-col items-center"
            style={{ marginTop: i === 0 ? 0 : 22, animation: `fade-in .4s ease-out ${Math.min(i, 8) * 50}ms both` }}
          >
            <div className="relative flex flex-col items-center" style={{ transform: `translateX(${offset}px)` }}>
              {isActive && (
                <span className="mb-1.5 inline-flex items-center rounded-[10px] bg-primary px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-widest text-primary-foreground shadow-[0_4px_14px_rgba(124,92,255,.35)] animate-bounce">
                  Hoy
                </span>
              )}
              <button
                onClick={() => onSelect(exercise, state)}
                disabled={isLocked}
                aria-label={`Día ${exercise.day}: ${exercise.title}${isLocked ? " (bloqueado)" : ""}`}
                className={cn(
                  "relative grid h-16 w-16 place-items-center rounded-full border-[3px] transition active:translate-y-[2px] active:scale-[.97] shrink-0",
                  isDone && "border-white bg-[#3FBE8F] text-white shadow-[0_6px_0_#2F9A73]",
                  isActive &&
                    "border-white bg-gradient-to-br from-accent-pink to-primary text-white shadow-[0_6px_0_#6A46E6]",
                  isLocked && "border-border bg-muted text-muted-foreground shadow-[0_6px_0_hsl(var(--border))]",
                )}
              >
                {isActive && (
                  <span className="absolute inset-[-6px] rounded-full border-2 border-primary/50 animate-ping" />
                )}
                {isDone ? (
                  <Check className="h-7 w-7" strokeWidth={3} />
                ) : isActive ? (
                  <Leaf className="h-7 w-7 fill-white/25" strokeWidth={2.2} />
                ) : (
                  <Lock className="h-6 w-6" />
                )}
              </button>
              <span
                className={cn(
                  "mt-1.5 max-w-[140px] text-center text-[11px] font-bold leading-tight",
                  isLocked ? "text-muted-foreground" : "text-foreground",
                )}
              >
                Día {exercise.day}
              </span>
              <span className="max-w-[150px] text-center text-[10px] text-muted-foreground line-clamp-1">
                {isLocked ? "Se abre a medianoche" : exercise.theme}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

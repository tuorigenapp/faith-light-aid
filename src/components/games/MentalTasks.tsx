import { useEffect, useMemo, useState } from "react";
import { Check, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

/** Tareas mentales: retos de atención/memoria cortos, del tema del día. */
export function MentalTasks({ tasks, onComplete }: { tasks: string[]; onComplete?: () => void }) {
  const list = useMemo(() => (tasks.length ? tasks.slice(0, 4) : [
    "Cuenta hacia atrás de 20 en 20 desde 100.",
    "Nombra 3 cosas que puedas escuchar ahora mismo.",
    "Recuerda qué desayunaste hoy, en orden.",
    "Repite en voz alta la frase de hoy 3 veces sin error.",
  ]), [tasks]);
  const [idx, setIdx] = useState(0);
  const [seconds, setSeconds] = useState(15);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    setSeconds(15);
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [idx, done]);

  function complete() {
    if (idx + 1 < list.length) setIdx(idx + 1);
    else { setDone(true); onComplete?.(); }
  }

  return (
    <div className="app-card p-5">
      <div className="text-[11px] uppercase tracking-widest font-bold text-primary inline-flex items-center gap-1.5">
        <Brain className="w-3.5 h-3.5" /> Reto mental {done ? list.length : idx + 1}/{list.length}
      </div>
      {!done ? (
        <>
          <p className="mt-2 font-display font-bold text-[17px] leading-snug">{list[idx]}</p>
          <p className="mt-1 text-[12.5px] text-muted-foreground">Tómate {seconds}s para hacerlo mentalmente, luego confirma.</p>
          <button
            onClick={complete}
            className="mt-4 w-full min-h-[48px] rounded-[12px] bg-primary text-primary-foreground font-semibold text-[14.5px] active:scale-[.97] transition"
          >
            Ya lo hice, siguiente
          </button>
        </>
      ) : (
        <p className="mt-3 rounded-[12px] bg-[#3FBE8F]/12 text-[#2F9A73] px-4 py-3 text-[13px] font-semibold inline-flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" /> Completaste tus retos de atención de hoy.
        </p>
      )}
    </div>
  );
}

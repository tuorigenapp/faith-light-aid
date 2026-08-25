import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { affirmationsFor } from "@/lib/affirmations";

/**
 * Slider de afirmaciones del Paso 1 (reemplaza el video).
 * Una afirmación a la vez, grande, animada y adaptada a la temática.
 */
export function AffirmationSlider({
  focus,
  caminoId,
  words = [],
  className,
}: {
  focus?: string | null;
  caminoId?: string | null;
  words?: string[];
  className?: string;
}) {
  const list = affirmationsFor(focus, caminoId, words);
  const [i, setI] = useState(0);
  const [seen, setSeen] = useState<number[]>([0]);

  useEffect(() => {
    const t = window.setInterval(() => setI((v) => (v + 1) % list.length), 4200);
    return () => window.clearInterval(t);
  }, [list.length]);

  useEffect(() => {
    setSeen((s) => (s.includes(i) ? s : [...s, i]));
  }, [i]);

  const current = list[i]!;
  const go = (d: number) => setI((v) => (v + d + list.length) % list.length);

  return (
    <section
      className={cn("overflow-hidden rounded-[16px] border border-border bg-card shadow-soft", className)}
      aria-label="Afirmaciones de esta etapa"
    >
      <div className="px-4 pt-3.5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Repite en voz alta</p>
        <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
          Una frase a la vez. Dila despacio, aunque todavía no la sientas.
        </p>
      </div>

      <div
        className="relative mt-3 grid min-h-[168px] place-items-center px-5 text-center"
        style={{ background: "linear-gradient(180deg,#F6EFFF 0%,#FFF3FA 100%)" }}
      >
        <div key={i} style={{ animation: "fade-in .35s ease-out both" }}>
          <div className="text-[38px] leading-none">{current.emoji}</div>
          <p className="mt-2 font-display text-[24px] font-black uppercase leading-tight tracking-tight text-[#241539]">
            {current.text}
          </p>
        </div>

        <button
          onClick={() => go(-1)}
          aria-label="Afirmación anterior"
          className="absolute left-1.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-primary shadow-soft active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => go(1)}
          aria-label="Siguiente afirmación"
          className="absolute right-1.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-primary shadow-soft active:scale-95"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5 py-3">
        {list.map((_, k) => (
          <button
            key={k}
            onClick={() => setI(k)}
            aria-label={`Afirmación ${k + 1}`}
            className={cn(
              "h-2.5 rounded-full transition-all",
              k === i ? "w-6 bg-primary" : seen.includes(k) ? "w-2.5 bg-primary/45" : "w-2.5 bg-primary/15",
            )}
          />
        ))}
      </div>
    </section>
  );
}

export default AffirmationSlider;

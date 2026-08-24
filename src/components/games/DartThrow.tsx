import { useEffect, useRef, useState } from "react";
import { Check, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

const REQUIRED = 3;

/** Lanzar el dardo en el aro: timing — toca cuando el indicador pase por el centro. */
export function DartThrow({ onComplete }: { onComplete?: () => void }) {
  const [pos, setPos] = useState(0);
  const [dir, setDir] = useState(1);
  const [hits, setHits] = useState(0);
  const [feedback, setFeedback] = useState<"hit" | "miss" | null>(null);
  const raf = useRef<number>();
  const done = hits >= REQUIRED;

  useEffect(() => {
    if (done) return;
    let p = pos, d = dir;
    function tick() {
      p += d * 2.2;
      if (p >= 100) { p = 100; d = -1; }
      if (p <= 0) { p = 0; d = 1; }
      setPos(p);
      setDir(d);
      raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => raf.current && cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function throwDart() {
    if (done) return;
    const okZone = Math.abs(pos - 50) < 12;
    if (okZone) {
      const n = hits + 1;
      setHits(n);
      setFeedback("hit");
      if (n >= REQUIRED) onComplete?.();
    } else {
      setFeedback("miss");
    }
    setTimeout(() => setFeedback(null), 350);
  }

  return (
    <div className="app-card p-5">
      <div className="text-[11px] uppercase tracking-widest font-bold text-primary inline-flex items-center gap-1.5">
        <CircleDot className="w-3.5 h-3.5" /> Dardo en el aro
      </div>
      <p className="mt-1 text-[12.5px] text-muted-foreground">Toca "Lanzar" cuando el punto esté en el centro del aro. {hits}/{REQUIRED}</p>
      <div className="relative mt-3 h-16 rounded-full bg-secondary overflow-hidden">
        <span className="absolute inset-y-0 left-[44%] w-[12%] rounded-full bg-primary/20 border-2 border-primary/50" />
        <span
          className={cn("absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary transition-colors", feedback === "hit" && "bg-[#3FBE8F]", feedback === "miss" && "bg-[#F58BCB]")}
          style={{ left: `calc(${pos}% - 12px)` }}
        />
      </div>
      <button
        onClick={throwDart}
        disabled={done}
        className="mt-4 w-full min-h-[48px] rounded-[12px] bg-primary text-primary-foreground font-semibold text-[14.5px] active:scale-[.97] transition disabled:opacity-50"
      >
        Lanzar
      </button>
      {done && (
        <p className="mt-3 rounded-[12px] bg-[#3FBE8F]/12 text-[#2F9A73] px-4 py-3 text-[13px] font-semibold inline-flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" /> ¡En el blanco! Reto cumplido.
        </p>
      )}
    </div>
  );
}

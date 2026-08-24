import { useRef, useState } from "react";
import { Check, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const TARGETS_REQUIRED = 3;

/** Lanzar bola de pimpón: toca dentro del aro que se mueve, puntería simple. */
export function PingPongToss({ onComplete }: { onComplete?: () => void }) {
  const [hits, setHits] = useState(0);
  const [pos, setPos] = useState({ x: 50, y: 40 });
  const [feedback, setFeedback] = useState<"hit" | "miss" | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const done = hits >= TARGETS_REQUIRED;

  function throwBall(e: React.MouseEvent<HTMLDivElement>) {
    if (done || !boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const dist = Math.hypot(x - pos.x, y - pos.y);
    if (dist < 12) {
      const n = hits + 1;
      setHits(n);
      setFeedback("hit");
      if (n >= TARGETS_REQUIRED) onComplete?.();
      else setPos({ x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 });
    } else {
      setFeedback("miss");
    }
    setTimeout(() => setFeedback(null), 350);
  }

  return (
    <div className="app-card p-5">
      <div className="text-[11px] uppercase tracking-widest font-bold text-primary inline-flex items-center gap-1.5">
        <Target className="w-3.5 h-3.5" /> Lanza la bola de pimpón
      </div>
      <p className="mt-1 text-[12.5px] text-muted-foreground">Toca dentro del aro para embocar {TARGETS_REQUIRED} veces.</p>
      <div
        ref={boxRef}
        onClick={throwBall}
        className={cn(
          "relative mt-3 h-56 rounded-[16px] overflow-hidden select-none cursor-pointer",
          feedback === "hit" ? "bg-[#3FBE8F]/12" : feedback === "miss" ? "bg-[#F58BCB]/10" : "bg-secondary",
        )}
      >
        {!done && (
          <span
            className="absolute w-16 h-16 rounded-full border-4 border-primary bg-primary/15 -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          />
        )}
        <span className="absolute bottom-2 right-3 text-[12px] font-bold text-muted-foreground">{hits}/{TARGETS_REQUIRED}</span>
      </div>
      {done && (
        <p className="mt-3 rounded-[12px] bg-[#3FBE8F]/12 text-[#2F9A73] px-4 py-3 text-[13px] font-semibold inline-flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" /> ¡Buena puntería! Reto cumplido.
        </p>
      )}
    </div>
  );
}

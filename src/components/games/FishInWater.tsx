import { useEffect, useRef, useState } from "react";
import { Check, Fish } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { id: number; x: number; good: boolean; caught?: boolean };

const REQUIRED = 5;

/** Pez en el agua: atrapa las palabras/verdades sanas, esquiva las que pesan. */
export function FishInWater({ good, bad, onComplete }: { good: string[]; bad: string[]; onComplete?: () => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [score, setScore] = useState(0);
  const idRef = useRef(0);
  const done = score >= REQUIRED;

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => {
      const isGood = Math.random() > 0.4;
      const pool = isGood ? (good.length ? good : ["Paz"]) : (bad.length ? bad : ["Miedo"]);
      const id = idRef.current++;
      setItems((its) => [...its.slice(-5), { id, x: 10 + Math.random() * 75, good: isGood }]);
      setTimeout(() => setItems((its) => its.filter((i) => i.id !== id)), 2400);
    }, 900);
    return () => clearInterval(t);
  }, [good, bad, done]);

  function catchFish(id: number, isGood: boolean) {
    setItems((its) => its.filter((i) => i.id !== id));
    if (isGood) {
      setScore((s) => {
        const n = s + 1;
        if (n >= REQUIRED) onComplete?.();
        return n;
      });
    }
  }

  return (
    <div className="app-card p-5">
      <div className="text-[11px] uppercase tracking-widest font-bold text-primary inline-flex items-center gap-1.5">
        <Fish className="w-3.5 h-3.5" /> Pez en el agua
      </div>
      <p className="mt-1 text-[12.5px] text-muted-foreground">Atrapa {REQUIRED} palabras sanas, evita las que pesan.</p>
      <div className="relative mt-3 h-56 rounded-[16px] overflow-hidden bg-[#DFF3FF]">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => catchFish(it.id, it.good)}
            className={cn(
              "absolute min-h-[36px] px-3 rounded-full text-[12px] font-bold shadow-soft transition-all animate-in fade-in",
              it.good ? "bg-[#3FBE8F] text-white" : "bg-[#F58BCB] text-white",
            )}
            style={{ left: `${it.x}%`, bottom: "8%" }}
          >
            {it.good ? good[0] ? "" : "" : ""}
            {it.good ? (good.find(() => true) ?? "Paz") : (bad.find(() => true) ?? "Miedo")}
          </button>
        ))}
        <span className="absolute top-2 right-3 text-[12px] font-bold text-foreground/70">{score}/{REQUIRED}</span>
      </div>
      {done && (
        <p className="mt-3 rounded-[12px] bg-[#3FBE8F]/12 text-[#2F9A73] px-4 py-3 text-[13px] font-semibold inline-flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" /> Atrapaste lo que te sana. Bien hecho.
        </p>
      )}
    </div>
  );
}

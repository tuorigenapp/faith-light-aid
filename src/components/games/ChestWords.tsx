import { useMemo, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Palabras en el cofre: toca las palabras correctas (relacionadas al tema)
 * para guardarlas en el cofre. Las palabras señuelo no suman.
 */
export function ChestWords({
  correct,
  decoys = [],
  onComplete,
}: {
  correct: string[];
  decoys?: string[];
  onComplete?: () => void;
}) {
  const options = useMemo(() => {
    const all = [...correct.map((w) => ({ w, ok: true })), ...decoys.map((w) => ({ w, ok: false }))];
    const seed = correct.join("").length + decoys.join("").length;
    let s = seed || 1;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    return all
      .map((x) => ({ x, k: rnd() }))
      .sort((a, b) => a.k - b.k)
      .map((v) => v.x);
  }, [correct, decoys]);

  const [saved, setSaved] = useState<string[]>([]);
  const done = saved.length >= correct.length;

  function tap(w: string, ok: boolean) {
    if (saved.includes(w)) return;
    if (!ok) return;
    setSaved((s) => {
      const next = [...s, w];
      if (next.length === correct.length) onComplete?.();
      return next;
    });
  }

  return (
    <div className="app-card p-5">
      <p className="text-[13px] text-muted-foreground">Toca las palabras que hablan de tu tema de hoy y guárdalas en el cofre.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map(({ w, ok }) => {
          const isSaved = saved.includes(w);
          return (
            <button
              key={w}
              onClick={() => tap(w, ok)}
              disabled={isSaved}
              className={cn(
                "min-h-[44px] px-4 rounded-[10px] text-[13.5px] font-bold transition active:scale-[.96]",
                isSaved ? "bg-[#3FBE8F]/15 text-[#2F9A73] line-through" : "bg-secondary text-foreground",
              )}
            >
              {isSaved && <Check className="inline w-3.5 h-3.5 mr-1" />}
              {w}
            </button>
          );
        })}
      </div>
      <div className="mt-4 rounded-[16px] bg-primary/8 p-3 text-center text-[13px] font-semibold">
        Cofre: {saved.length} / {correct.length} palabras guardadas
      </div>
      {done && (
        <p className="mt-3 rounded-[12px] bg-[#3FBE8F]/12 text-[#2F9A73] px-4 py-3 text-[13px] font-semibold inline-flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4" /> ¡Cofre completo! Esas palabras ya son tuyas.
        </p>
      )}
    </div>
  );
}

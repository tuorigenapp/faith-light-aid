import { useMemo, useState } from "react";
import { Check, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ALPHA = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

/** Adivinar palabras: palabra oculta con letras faltantes, del tema del día. */
export function GuessWord({ words, onComplete }: { words: string[]; onComplete?: () => void }) {
  const list = useMemo(() => words.map((w) => w.toUpperCase().replace(/[^A-ZÑ]/g, "")).filter((w) => w.length >= 3).slice(0, 5), [words]);
  const [idx, setIdx] = useState(0);
  const [guessed, setGuessed] = useState<string[]>([]);
  const word = list[idx] ?? "";
  const [letters, setLetters] = useState<string[]>([]);

  if (!list.length) return null;

  function pick(l: string) {
    if (letters.includes(l)) return;
    const next = [...letters, l];
    setLetters(next);
    const complete = word.split("").every((c) => next.includes(c));
    if (complete) {
      setTimeout(() => {
        const g = [...guessed, word];
        setGuessed(g);
        setLetters([]);
        if (idx + 1 < list.length) setIdx(idx + 1);
        else onComplete?.();
      }, 500);
    }
  }

  const doneAll = guessed.length >= list.length;

  return (
    <div className="app-card p-5">
      <div className="text-[11px] uppercase tracking-widest font-bold text-primary inline-flex items-center gap-1.5">
        <HelpCircle className="w-3.5 h-3.5" /> Adivina la palabra {idx + 1}/{list.length}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {!doneAll && word.split("").map((c, i) => (
          <span key={i} className={cn(
            "w-9 h-11 rounded-[8px] grid place-items-center font-display font-extrabold text-[18px] border-2",
            letters.includes(c) ? "border-primary bg-primary/10" : "border-border bg-secondary text-transparent",
          )}>
            {letters.includes(c) ? c : "•"}
          </span>
        ))}
      </div>
      {!doneAll && (
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {ALPHA.map((l) => (
            <button
              key={l}
              onClick={() => pick(l)}
              disabled={letters.includes(l)}
              className={cn(
                "h-10 rounded-[8px] text-[13px] font-bold transition active:scale-95",
                letters.includes(l) ? (word.includes(l) ? "bg-[#3FBE8F]/20 text-[#2F9A73]" : "bg-secondary/50 text-muted-foreground") : "bg-secondary",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      )}
      {doneAll && (
        <p className="mt-3 rounded-[12px] bg-[#3FBE8F]/12 text-[#2F9A73] px-4 py-3 text-[13px] font-semibold inline-flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" /> Adivinaste todas las palabras del tema de hoy.
        </p>
      )}
    </div>
  );
}

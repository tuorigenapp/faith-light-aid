import { useEffect, useMemo, useState } from "react";
import { Check, RefreshCw, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { WordSearch } from "@/components/WordSearch";
import type { GameKind } from "@/lib/ejercicios365";

/** Juego 1: cofre de palabras — arrastra (toca) las palabras del tema al cofre. */
export function WordChest({ words, distractors, onDone }: { words: string[]; distractors: string[]; onDone: () => void }) {
  const pool = useMemo(() => {
    const all = [...words.slice(0, 4), ...distractors.slice(0, 4)];
    return all.map((w, i) => ({ w, k: (i * 7) % all.length })).sort((a, b) => a.k - b.k).map((x) => x.w);
  }, [words, distractors]);
  const [inChest, setInChest] = useState<string[]>([]);
  const target = words.slice(0, 4);
  const done = target.every((w) => inChest.includes(w));

  useEffect(() => {
    if (done) onDone();
  }, [done, onDone]);

  return (
    <div>
      <p className="text-[13px] text-muted-foreground mb-3">Toca solo las palabras que pertenecen al tema de hoy y guárdalas en el cofre.</p>
      <div className="flex flex-wrap gap-2">
        {pool.map((w) => {
          const picked = inChest.includes(w);
          return (
            <button
              key={w}
              disabled={picked}
              onClick={() => setInChest((s) => (target.includes(w) ? [...s, w] : s))}
              className={cn(
                "px-3.5 py-2 rounded-[10px] text-[12.5px] font-bold transition active:scale-95",
                picked ? "bg-[#3FBE8F]/15 text-[#2F9A73] line-through" : "bg-secondary text-foreground",
              )}
            >
              {w}
            </button>
          );
        })}
      </div>
      <div className="mt-4 rounded-[14px] border-2 border-dashed border-primary/30 p-3 min-h-14">
        <span className="text-[11px] uppercase tracking-widest font-bold text-primary">Cofre</span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {inChest.map((w) => (
            <span key={w} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[12px] font-bold">
              {w}
            </span>
          ))}
        </div>
      </div>
      {done && (
        <p className="mt-3 text-[13px] font-semibold text-[#2F9A73] inline-flex items-center gap-1.5">
          <Check className="w-4 h-4" /> Guardaste las palabras de hoy en tu cofre.
        </p>
      )}
    </div>
  );
}

/** Juego 2: adivina la palabra (tipo ahorcado) con la palabra principal del ejercicio. */
export function GuessWord({ word, onDone }: { word: string; onDone: () => void }) {
  const [guessed, setGuessed] = useState<string[]>([]);
  const wrong = guessed.filter((l) => !word.includes(l));
  const done = word.split("").every((l) => guessed.includes(l));
  const lost = wrong.length >= 6 && !done;

  useEffect(() => {
    if (done) onDone();
  }, [done, onDone]);

  const alphabet = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

  return (
    <div>
      <p className="text-[13px] text-muted-foreground mb-3">Adivina la palabra clave del ejercicio de hoy, letra por letra.</p>
      <div className="flex justify-center gap-1.5 flex-wrap mb-4">
        {word.split("").map((l, i) => (
          <span
            key={i}
            className="w-8 h-10 rounded-[8px] bg-secondary grid place-items-center font-display font-extrabold text-lg"
          >
            {guessed.includes(l) || done ? l : ""}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {alphabet.map((l) => {
          const used = guessed.includes(l);
          return (
            <button
              key={l}
              disabled={used || lost}
              onClick={() => setGuessed((g) => [...g, l])}
              className={cn(
                "h-9 rounded-[8px] text-[12.5px] font-bold transition active:scale-95",
                used ? (word.includes(l) ? "bg-[#3FBE8F]/20 text-[#2F9A73]" : "bg-destructive/15 text-destructive") : "bg-secondary",
              )}
            >
              {l}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[12px] text-muted-foreground">Errores: {wrong.length}/6</p>
      {lost && (
        <div className="mt-2">
          <p className="text-[13px] font-semibold text-destructive">Casi. La palabra era: {word}</p>
          <button onClick={() => setGuessed([])} className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-primary">
            <RefreshCw className="w-3.5 h-3.5" /> Intentar de nuevo
          </button>
        </div>
      )}
      {done && (
        <p className="mt-3 text-[13px] font-semibold text-[#2F9A73] inline-flex items-center gap-1.5">
          <Check className="w-4 h-4" /> ¡Esa es! {word}
        </p>
      )}
    </div>
  );
}

/** Juegos 4-6: reacción — tocar "¡Ya!" cuando el marcador entra en la zona verde. N aciertos para ganar. */
function ReactionGame({
  label,
  needed = 3,
  onDone,
}: {
  label: string;
  needed?: number;
  onDone: () => void;
}) {
  const [pos, setPos] = useState(0);
  const [dir, setDir] = useState(1);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const done = hits >= needed;

  useEffect(() => {
    if (done) {
      onDone();
      return;
    }
    const t = setInterval(() => {
      setPos((p) => {
        let np = p + dir * 6;
        if (np >= 100) { np = 100; setDir(-1); }
        if (np <= 0) { np = 0; setDir(1); }
        return np;
      });
    }, 40);
    return () => clearInterval(t);
  }, [dir, done, onDone]);

  function tap() {
    if (done) return;
    if (pos >= 40 && pos <= 60) setHits((h) => h + 1);
    else setMisses((m) => m + 1);
  }

  return (
    <div>
      <p className="text-[13px] text-muted-foreground mb-3">
        Toca "¡Ya!" cuando el marcador esté sobre la zona verde. Necesitas {needed} aciertos.
      </p>
      <div className="relative h-6 rounded-full bg-secondary overflow-hidden">
        <div className="absolute inset-y-0 left-[40%] w-[20%] bg-[#3FBE8F]/35" />
        <div
          className="absolute inset-y-0 w-3 rounded-full bg-primary transition-[left] duration-75"
          style={{ left: `calc(${pos}% - 6px)` }}
        />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[12px] font-bold text-muted-foreground">
          Aciertos {hits}/{needed} · Fallos {misses}
        </span>
        <button
          onClick={tap}
          disabled={done}
          className="h-11 px-6 rounded-full btn-primary-gradient text-white text-[14px] font-bold active:scale-[.97] transition inline-flex items-center gap-1.5"
        >
          <Target className="w-4 h-4" /> {label}
        </button>
      </div>
      {done && (
        <p className="mt-3 text-[13px] font-semibold text-[#2F9A73] inline-flex items-center gap-1.5">
          <Check className="w-4 h-4" /> ¡Lo lograste! Tu enfoque también es parte del ejercicio.
        </p>
      )}
    </div>
  );
}

export function PingPongGame(p: { onDone: () => void }) {
  return <ReactionGame label="¡Lanza!" needed={3} onDone={p.onDone} />;
}
export function FishGame(p: { onDone: () => void }) {
  return <ReactionGame label="¡Atrapa!" needed={3} onDone={p.onDone} />;
}
export function DartGame(p: { onDone: () => void }) {
  return <ReactionGame label="¡Dardo!" needed={3} onDone={p.onDone} />;
}

export function WordSearchGame({ words, onDone }: { words: string[]; onDone: () => void }) {
  const key = words.join("-");
  const [done, setDone] = useState(() => {
    try {
      const f = JSON.parse(localStorage.getItem(`ws:${key}`) || "[]") as string[];
      return f.length >= words.length;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const id = setInterval(() => {
      try {
        const f = JSON.parse(localStorage.getItem(`ws:${key}`) || "[]") as string[];
        if (f.length >= words.length && !done) {
          setDone(true);
          onDone();
        }
      } catch {}
    }, 500);
    return () => clearInterval(id);
  }, [key, words.length, done, onDone]);

  return (
    <div>
      <p className="text-[13px] text-muted-foreground mb-3">Encuentra las palabras del ejercicio de hoy en la sopa de letras.</p>
      <WordSearch words={words} storageKey={key} gemsReward={0} />
    </div>
  );
}

export function GameForKind({
  kind,
  words,
  mainWord,
  onDone,
}: {
  kind: GameKind;
  words: string[];
  mainWord: string;
  onDone: () => void;
}) {
  switch (kind) {
    case "cofre":
      return <WordChest words={words} distractors={["RUIDO", "PRISA", "OLVIDO", "EXCUSA"]} onDone={onDone} />;
    case "adivina":
      return <GuessWord word={mainWord} onDone={onDone} />;
    case "sopa":
      return <WordSearchGame words={words.slice(0, 5)} onDone={onDone} />;
    case "pimpon":
      return <PingPongGame onDone={onDone} />;
    case "pez":
      return <FishGame onDone={onDone} />;
    case "dardo":
      return <DartGame onDone={onDone} />;
  }
}

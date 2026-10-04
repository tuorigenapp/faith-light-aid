import { celebrate } from "@/lib/celebrate";
import { useMemo, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Sparkles, RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { awardGems } from "@/lib/gems";

type Cell = { r: number; c: number; l: string };
type Placed = { word: string; cells: Cell[] };

const SIZE = 8;
const DIRS = [
  [0, 1], [1, 0], [1, 1], [-1, 1],
];

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function build(words: string[], seed: number) {
  const rnd = seededRand(seed);
  const grid: string[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(""));
  const placed: Placed[] = [];
  const clean = words.map((w) => w.toUpperCase().replace(/[^A-ZÑ]/g, "")).filter((w) => w.length <= SIZE);

  for (const w of clean) {
    let tries = 0;
    while (tries++ < 120) {
      const [dr, dc] = DIRS[Math.floor(rnd() * DIRS.length)];
      const r0 = Math.floor(rnd() * SIZE);
      const c0 = Math.floor(rnd() * SIZE);
      const rEnd = r0 + dr * (w.length - 1);
      const cEnd = c0 + dc * (w.length - 1);
      if (rEnd < 0 || rEnd >= SIZE || cEnd < 0 || cEnd >= SIZE) continue;
      let ok = true;
      const cells: Cell[] = [];
      for (let i = 0; i < w.length; i++) {
        const r = r0 + dr * i;
        const c = c0 + dc * i;
        const cur = grid[r][c];
        if (cur && cur !== w[i]) { ok = false; break; }
        cells.push({ r, c, l: w[i] });
      }
      if (!ok) continue;
      cells.forEach(({ r, c, l }) => (grid[r][c] = l));
      placed.push({ word: w, cells });
      break;
    }
  }

  const alpha = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (!grid[r][c]) grid[r][c] = alpha[Math.floor(rnd() * alpha.length)];

  return { grid, placed };
}



export function WordSearch({ words, storageKey, gemsReward = 40 }: { words: string[]; storageKey: string; gemsReward?: number }) {
  const queryClient = useQueryClient();
  const seed = useMemo(() => storageKey.split("").reduce((a, c) => a + c.charCodeAt(0), 0), [storageKey]);
  const { grid, placed } = useMemo(() => build(words, seed), [words, seed]);
  const initialFound = (() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(`ws:${storageKey}`) || "[]") as string[]; } catch { return []; }
  })();
  const [found, setFound] = useState<string[]>(initialFound);
  const [sel, setSel] = useState<string[]>([]);
  const [awarded, setAwarded] = useState(initialFound.length >= placed.length);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.setItem(`ws:${storageKey}`, JSON.stringify(found)); } catch {}
    if (found.length >= placed.length && placed.length > 0 && !awarded) {
      setAwarded(true);
      awardGems(gemsReward, "wordsearch_completed", { key: storageKey }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        setFeedback("Sopa completada: sumaste avance hacia tu próxima hoja de sanación");
      });
    }
  }, [found, awarded, gemsReward, placed.length, queryClient, storageKey]);

  function onCellClick(cell: Cell) {
    const key = `${cell.r},${cell.c}`;
    const next = sel.includes(key) ? sel.filter((k) => k !== key) : [...sel, key];
    const hit = placed.find((p) => !found.includes(p.word) && p.cells.every((c) => next.includes(`${c.r},${c.c}`)));
    if (hit) {
      setFound((f) => [...f, hit.word]);
      setSel([]);
      celebrate(900);
      setFeedback(`Encontraste ${hit.word}. ¡Bien hecho!`);
      awardGems(5, "wordsearch_word", { word: hit.word }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      });
      return;
    }
    setSel(next);
  }

  const foundCells = new Set(
    placed.filter((p) => found.includes(p.word)).flatMap((p) => p.cells.map((c) => `${c.r},${c.c}`))
  );

  function reset() {
    setFound([]); setSel([]); setAwarded(false); setFeedback(null);
    try { localStorage.removeItem(`ws:${storageKey}`); } catch {}
  }

  return (
    <Card className="p-4 rounded-[1.7rem] shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <Sparkles className="w-4 h-4" /> Sopa de letras espiritual
        </div>
        <button onClick={reset} className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <RotateCcw className="w-3 h-3" /> reiniciar
        </button>
      </div>
      <p className="mb-2 text-[12px] text-muted-foreground">
        Toca cada letra de la palabra, una por una. Si te equivocas, tócala otra vez para quitarla.
      </p>
      <div className="grid gap-[6px]" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
        {grid.map((row, r) =>
          row.map((l, c) => {
            const k = `${r},${c}`;
            const isFound = foundCells.has(k);
            const isSel = sel.includes(k);
            return (
              <button
                key={k}
                onClick={() => onCellClick({ r, c, l })}
                className={cn(
                  "aspect-square min-h-[36px] rounded-[10px] text-[15px] font-extrabold transition active:scale-95",
                  "grid place-items-center select-none",
                  isFound ? "bg-primary text-primary-foreground shadow-glow" :
                  isSel ? "bg-accent text-accent-foreground" :
                  "bg-secondary hover:bg-primary/15"
                )}
              >
                {l}
              </button>
            );
          })
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {placed.map((p) => {
          const ok = found.includes(p.word);
          return (
            <span key={p.word} className={cn(
              "text-[11px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1",
              ok ? "bg-primary/15 text-primary line-through" : "bg-secondary text-muted-foreground"
            )}>
              {ok && <Check className="w-3 h-3" />} {p.word}
            </span>
          );
        })}
      </div>
      {awarded && (
        <p className="mt-3 text-xs text-primary font-bold text-center">✨ Completaste el juego. Tus palabras quedaron sembradas en ti.</p>
      )}
      {feedback && !awarded && (
        <p className="mt-3 text-xs text-primary font-bold text-center">{feedback}</p>
      )}
    </Card>
  );
}

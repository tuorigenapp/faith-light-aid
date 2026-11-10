import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Delete, Lightbulb, Lock, Trophy, X } from "lucide-react";
import { CRUCI_LEVELS } from "@/lib/crucigrama";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/crucigrama")({
  head: () => ({
    meta: [
      { title: "Crucigrama Bíblico — ORÍGEN" },
      { name: "description", content: "Ocho niveles de crucigrama bíblico con pistas para ejercitar tu memoria de la Palabra." },
      { property: "og:title", content: "Crucigrama Bíblico — ORÍGEN" },
      { property: "og:description", content: "Completa cada nivel y desbloquea el siguiente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Crucigrama,
});

const KEY = "origen_cruci_unlocked";
const ROWS = ["QWERTYUIOP", "ASDFGHJKLÑ", "ZXCVBNM"];

function Crucigrama() {
  const nav = useNavigate();
  const [unlocked, setUnlocked] = useState(1);
  const [level, setLevel] = useState<number | null>(null);
  useEffect(() => { setUnlocked(Math.max(1, Number(localStorage.getItem(KEY) ?? "1") || 1)); }, []);

  if (level === null) {
    return (
      <div className="min-h-dvh bg-aura-top px-5 pb-10 pt-6">
        <div className="mx-auto max-w-[560px]">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-[28px] font-extrabold">Crucigrama Bíblico</h1>
            <button aria-label="Cerrar" onClick={() => nav({ to: "/juegos" })} className="grid h-11 w-11 place-items-center rounded-full bg-card shadow-sm"><X className="h-5 w-5" /></button>
          </div>
          <p className="mt-1 text-[14px] text-muted-foreground">Completa un nivel para abrir el siguiente.</p>
          <div className="mt-6 grid gap-3">
            {CRUCI_LEVELS.map((_, i) => {
              const n = i + 1; const open = n <= unlocked; const done = n < unlocked;
              return (
                <button key={n} disabled={!open} onClick={() => setLevel(n)} className={cn("flex h-16 items-center justify-between rounded-[16px] bg-card px-5 text-left shadow-sm transition active:scale-[.98]", !open && "opacity-50")}>
                  <span className="text-[17px] font-semibold">Bíblico-{n}</span>
                  {done ? <Trophy className="h-5 w-5 text-primary" /> : open ? <span className="text-[13px] font-semibold text-primary">Jugar</span> : <Lock className="h-5 w-5 text-muted-foreground" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  return <Board key={level} level={level} onExit={() => setLevel(null)} onWin={() => {
    const next = Math.min(CRUCI_LEVELS.length + 1, Math.max(unlocked, level + 1));
    localStorage.setItem(KEY, String(next)); setUnlocked(next);
  }} />;
}

function Board({ level, onExit, onWin }: { level: number; onExit: () => void; onWin: () => void }) {
  const clues = CRUCI_LEVELS[level - 1]!;
  const [answers, setAnswers] = useState<string[]>(() => clues.map((c) => " ".repeat(c.word.length)));
  const [cur, setCur] = useState({ w: 0, i: 0 });
  const [confirmExit, setConfirmExit] = useState(false);
  const [won, setWon] = useState(false);
  const solved = useMemo(() => answers.map((a, k) => a === clues[k]!.word), [answers, clues]);

  useEffect(() => { if (!won && solved.every(Boolean)) { setWon(true); onWin(); } }, [solved, won, onWin]);

  function put(ch: string) {
    setAnswers((prev) => {
      const next = [...prev]; const a = next[cur.w]!.split(""); a[cur.i] = ch; next[cur.w] = a.join(""); return next;
    });
    const len = clues[cur.w]!.word.length;
    if (ch !== " " && cur.i < len - 1) setCur({ ...cur, i: cur.i + 1 });
    else if (ch !== " " && cur.w < clues.length - 1) setCur({ w: cur.w + 1, i: 0 });
  }
  function back() {
    if (answers[cur.w]![cur.i] !== " ") return put(" ");
    if (cur.i > 0) { const i = cur.i - 1; setCur({ ...cur, i }); setAnswers((p) => { const n = [...p]; const a = n[cur.w]!.split(""); a[i] = " "; n[cur.w] = a.join(""); return n; }); }
  }
  function hint() {
    const w = clues[cur.w]!.word; const a = answers[cur.w]!;
    const idx = a.split("").findIndex((c, k) => c !== w[k]);
    if (idx >= 0) { setCur({ w: cur.w, i: idx }); setAnswers((p) => { const n = [...p]; const arr = n[cur.w]!.split(""); arr[idx] = w[idx]!; n[cur.w] = arr.join(""); return n; }); }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-aura-top">
      <div className="mx-auto w-full max-w-[560px] flex-1 px-4 pt-5">
        <div className="flex items-center justify-between">
          <p className="font-display text-[20px] font-bold">Bíblico-{level}</p>
          <button aria-label="Salir" onClick={() => setConfirmExit(true)} className="grid h-11 w-11 place-items-center rounded-full bg-card shadow-sm"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 grid gap-3">
          {clues.map((c, w) => (
            <div key={c.word} className={cn("rounded-[16px] bg-card p-3 shadow-sm", cur.w === w && "ring-2 ring-primary")}>
              <p className="text-[13px] font-medium text-muted-foreground">{w + 1}. {c.clue}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {c.word.split("").map((_, i) => {
                  const ch = answers[w]![i]!;
                  return (
                    <button key={i} onClick={() => setCur({ w, i })} className={cn("grid h-10 w-9 place-items-center rounded-[8px] border-[1.5px] text-[18px] font-bold transition",
                      solved[w] ? "border-cta-green bg-cta-green/15 text-foreground" : cur.w === w && cur.i === i ? "border-primary bg-primary/10" : "border-border bg-background")}>
                      {ch.trim()}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 mt-4 bg-card/95 px-2 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 shadow-lg backdrop-blur">
        <div className="mx-auto max-w-[560px]">
          <div className="mb-2 flex justify-center">
            <button onClick={hint} className="flex h-11 items-center gap-2 rounded-[12px] bg-primary/10 px-4 text-[14px] font-semibold text-primary"><Lightbulb className="h-4 w-4" /> Ayuda: revelar letra</button>
          </div>
          {ROWS.map((r, k) => (
            <div key={r} className="mb-1.5 flex justify-center gap-1">
              {r.split("").map((ch) => (
                <button key={ch} onClick={() => put(ch === "Ñ" ? "N" : ch)} className="h-11 min-w-0 flex-1 rounded-[8px] bg-background text-[16px] font-semibold shadow-sm active:scale-95">{ch}</button>
              ))}
              {k === 2 && <button aria-label="Borrar" onClick={back} className="grid h-11 w-14 place-items-center rounded-[8px] bg-background shadow-sm"><Delete className="h-5 w-5" /></button>}
            </div>
          ))}
        </div>
      </div>

      {(confirmExit || won) && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 px-6 animate-in fade-in">
          <div className="w-full max-w-[360px] rounded-[16px] bg-card p-6 text-center shadow-xl">
            {won ? (<>
              <Trophy className="mx-auto h-12 w-12 text-primary" />
              <p className="mt-3 font-display text-[22px] font-bold">¡Nivel completado!</p>
              <p className="mt-1 text-[14px] text-muted-foreground">La Palabra se queda contigo. Sigue al próximo nivel.</p>
              <button onClick={onExit} className="mt-5 h-[52px] w-full rounded-[12px] bg-cta-green text-[16px] font-bold text-cta-green-foreground">Continuar</button>
            </>) : (<>
              <p className="font-display text-[20px] font-bold">¿Salir del crucigrama?</p>
              <p className="mt-1 text-[14px] text-muted-foreground">Perderás el avance de este nivel.</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button onClick={() => setConfirmExit(false)} className="h-12 rounded-[12px] bg-primary/10 font-semibold text-primary">Seguir</button>
                <button onClick={onExit} className="h-12 rounded-[12px] bg-primary font-semibold text-primary-foreground">Salir</button>
              </div>
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}

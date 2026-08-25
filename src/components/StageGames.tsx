import { useMemo, useState } from "react";
import { Check, Gamepad2, Heart, RefreshCw, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ═══════════ Juego 1: Memoria de pares (frase ↔ verdad) ═══════════ */

type Pair = { a: string; b: string };

const PAIRS: Pair[] = [
  { a: "Me abandonaron", b: "Aprendo a quedarme conmigo" },
  { a: "No soy suficiente", b: "Valgo por existir" },
  { a: "Debo cargar todo", b: "Devuelvo lo que no es mío" },
  { a: "Tengo que agradar", b: "Mi no también es amor" },
];

export function MemoryPairs({ storageKey }: { storageKey: string }) {
  const cards = useMemo(() => {
    const list = PAIRS.flatMap((p, i) => [
      { id: `${i}-a`, pair: i, text: p.a, kind: "herida" as const },
      { id: `${i}-b`, pair: i, text: p.b, kind: "verdad" as const },
    ]);
    // orden estable pero mezclado por storageKey
    const seed = storageKey.length;
    return list
      .map((c, i) => ({ c, k: (i * 7 + seed * 13) % list.length }))
      .sort((x, y) => x.k - y.k)
      .map((x) => x.c);
  }, [storageKey]);

  const [open, setOpen] = useState<string[]>([]);
  const [found, setFound] = useState<number[]>([]);

  function tap(id: string, pair: number) {
    if (found.includes(pair) || open.includes(id) || open.length === 2) return;
    const nextOpen = [...open, id];
    setOpen(nextOpen);
    if (nextOpen.length === 2) {
      const [x, y] = nextOpen;
      const px = Number(x.split("-")[0]);
      const py = Number(y.split("-")[0]);
      setTimeout(() => {
        if (px === py) setFound((f) => [...f, px]);
        setOpen([]);
      }, px === py ? 350 : 750);
    }
  }

  const done = found.length === PAIRS.length;

  return (
    <div className="app-card p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest font-bold text-primary inline-flex items-center gap-1.5">
            <Gamepad2 className="w-3.5 h-3.5" /> Juego · Memoria de verdades
          </div>
          <h3 className="font-display font-bold text-[17px] mt-1 leading-tight">Une la herida con su verdad</h3>
        </div>
        <button
          onClick={() => { setFound([]); setOpen([]); }}
          className="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary grid place-items-center active:scale-95 transition"
          aria-label="Reiniciar juego"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {cards.map((c) => {
          const isOpen = open.includes(c.id) || found.includes(c.pair);
          return (
            <button
              key={c.id}
              onClick={() => tap(c.id, c.pair)}
              className={cn(
                "min-h-[74px] rounded-[14px] p-3 text-left text-[12.5px] font-semibold leading-snug transition active:scale-[.97]",
                found.includes(c.pair)
                  ? "bg-[#3FBE8F]/12 border-2 border-[#3FBE8F]/45 text-foreground"
                  : isOpen
                    ? "bg-primary/10 border-2 border-primary text-foreground"
                    : "bg-secondary border border-border text-transparent select-none",
              )}
            >
              {isOpen ? c.text : "• • •"}
            </button>
          );
        })}
      </div>

      {done && (
        <p className="mt-3 rounded-[12px] bg-[#3FBE8F]/12 text-[#2F9A73] px-4 py-3 text-[13px] font-semibold inline-flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" /> Cada herida tiene una verdad que la desarma. Ya las uniste todas.
        </p>
      )}
    </div>
  );
}

/* ═══════════ Juego 2: Clasifica la emoción ═══════════ */

const EMOCIONES: { text: string; group: "mia" | "heredada" }[] = [
  { text: "Miedo a que me dejen si pongo un límite", group: "heredada" },
  { text: "Tristeza por lo que hoy sí terminó", group: "mia" },
  { text: "Culpa por descansar", group: "heredada" },
  { text: "Enojo porque no me escucharon hoy", group: "mia" },
  { text: "Vergüenza de pedir ayuda", group: "heredada" },
  { text: "Alegría por un logro pequeño", group: "mia" },
];

export function ClassifyEmotions() {
  const [answers, setAnswers] = useState<Record<number, "mia" | "heredada">>({});
  const total = EMOCIONES.length;
  const correct = EMOCIONES.filter((e, i) => answers[i] === e.group).length;
  const answered = Object.keys(answers).length;

  return (
    <div className="app-card p-5">
      <div className="text-[11px] uppercase tracking-widest font-bold text-primary inline-flex items-center gap-1.5">
        <Heart className="w-3.5 h-3.5" /> Interactivo · Clasifica
      </div>
      <h3 className="font-display font-bold text-[17px] mt-1 leading-tight">¿Esta emoción es tuya o la heredaste?</h3>
      <p className="text-[13px] text-muted-foreground mt-1">Toca la opción que sientas. Al final te decimos qué revela tu elección.</p>

      <div className="mt-3 space-y-2.5">
        {EMOCIONES.map((e, i) => {
          const picked = answers[i];
          const ok = picked === e.group;
          return (
            <div key={i} className={cn(
              "rounded-[14px] border p-3",
              picked ? (ok ? "border-[#3FBE8F]/45 bg-[#3FBE8F]/8" : "border-[#F58BCB]/45 bg-[#F58BCB]/8") : "border-border bg-card",
            )}>
              <p className="text-[13.5px] font-semibold leading-snug">{e.text}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["mia", "heredada"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setAnswers((a) => ({ ...a, [i]: g }))}
                    className={cn(
                      "h-10 rounded-[10px] text-[12.5px] font-bold transition active:scale-[.97]",
                      picked === g ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/75",
                    )}
                  >
                    {g === "mia" ? "Es mía, de hoy" : "La heredé"}
                  </button>
                ))}
              </div>
              {picked && (
                <p className="mt-2 text-[12px] text-muted-foreground inline-flex items-start gap-1.5">
                  {ok ? <Check className="w-3.5 h-3.5 mt-0.5 text-[#3FBE8F] shrink-0" /> : <X className="w-3.5 h-3.5 mt-0.5 text-[#F58BCB] shrink-0" />}
                  {ok
                    ? "Exacto. Nombrarla bien es la mitad del trabajo."
                    : e.group === "heredada"
                      ? "Mira otra vez: esta suele venir de casa, no de hoy."
                      : "Esta sí es tuya y de este momento: puedes vivirla sin cargarla como historia familiar."}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {answered === total && (
        <p className="mt-3 rounded-[12px] bg-primary/8 px-4 py-3 text-[13px] font-semibold text-primary inline-flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4" /> Acertaste {correct} de {total}. Lo heredado se devuelve; lo tuyo se vive.
        </p>
      )}
    </div>
  );
}

/* ─────────── Re-exports: juegos reutilizables del día (13 pasos) ─────────── */
export { ChestWords } from "@/components/games/ChestWords";
export { GuessWord } from "@/components/games/GuessWord";
export { MentalTasks } from "@/components/games/MentalTasks";
export { PingPongToss } from "@/components/games/PingPongToss";
export { FishInWater } from "@/components/games/FishInWater";
export { DartThrow } from "@/components/games/DartThrow";

/* ═══════════ Coordinador de juegos 3D por práctica ═══════════ */

export type GameKind = "cofre" | "adivina" | "pimpon" | "pez" | "dardo";

export const GAME_ORDER: GameKind[] = ["cofre", "adivina", "pimpon", "pez", "dardo"];

export type GameContext = {
  /** Palabras/verdades del tema (las decide la IA de ORÍGEN). */
  good: string[];
  /** Cargas o palabras que pesan del tema. */
  bad: string[];
  /** Concepto central del día. */
  mainWord: string;
};

/**
 * Abre el juego correspondiente a la práctica en pantalla completa,
 * detecta la finalización, avisa al sistema EXISTENTE de recompensas
 * (onGameWin) y da paso automático al siguiente juego (onFinish al terminar).
 */
export function StageGameSequence({
  games,
  context,
  onGameWin,
  onFinish,
  onClose,
}: {
  games: GameKind[];
  context: GameContext;
  onGameWin?: (kind: GameKind) => void;
  onFinish: () => void;
  onClose?: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const kind = games[idx];
  if (!kind) return null;

  const good = context.good.filter(Boolean).slice(0, 5);
  const bad = context.bad.filter(Boolean).slice(0, 5);
  const advance = () => {
    if (idx + 1 < games.length) setIdx(idx + 1);
    else onFinish();
  };
  const win = () => onGameWin?.(kind);

  const common = { onComplete: win, onNext: advance, onClose };

  if (kind === "cofre")
    return <ChestWordsGame correct={good.length ? good : [context.mainWord]} decoys={bad} {...common} />;
  if (kind === "adivina") return <GuessWordGame words={[context.mainWord, ...good]} {...common} />;
  if (kind === "pimpon") return <PingPongGame {...common} />;
  if (kind === "pez") return <FishGame good={good} bad={bad} {...common} />;
  return <DartGame {...common} />;
}

/** Un solo juego 3D en pantalla completa, listo para un step. */
export function StageGameStep({
  kind,
  context,
  onWin,
  onNext,
  onClose,
}: {
  kind: GameKind;
  context: GameContext;
  onWin?: () => void;
  onNext: () => void;
  onClose?: () => void;
}) {
  return (
    <StageGameSequence
      games={[kind]}
      context={context}
      onGameWin={() => onWin?.()}
      onFinish={onNext}
      onClose={onClose}
    />
  );
}


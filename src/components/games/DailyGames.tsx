import { useContentOverrides } from "@/hooks/use-content-overrides";
import { ClientOnly, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useGamePlays, MIN_PLAYS } from "@/lib/game-plays";
import { dailyWritingPrompt } from "@/lib/daily-challenge";
import { StepEvidence } from "@/components/StepEvidence";

export const MAX_LEVEL = 10000;
import {
  Search,
  Brain,
  PenLine,
  Ghost,
  Blocks,
  Circle,
  Wind,
  Fish,
  Rabbit,
  HeartPulse,
  Trophy,
  Leaf,
  Check,
  Sparkles,
  ArrowRight,
} from "lucide-react";

/* ---------------------------------------------------------------- utils */

const POSITIVAS = [
  "PAZ",
  "FE",
  "AMOR",
  "LUZ",
  "PERDÓN",
  "CALMA",
  "VALOR",
  "GOZO",
  "LIBRE",
  "SANO",
  "FUERZA",
  "TERNURA",
  "ESPERANZA",
  "GRACIA",
];
const OSCURAS = ["CULPA", "MIEDO", "RENCOR", "VERGÜENZA", "CONTROL", "DUDA"];

function rnd(n: number) {
  return Math.floor(Math.random() * n);
}
function clean(w: string) {
  return w
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z]/g, "");
}

export type GameProps = {
  words: string[];
  onWin: (gems: number, learned?: string[]) => void;
  level: number;
};

/** Dificultad creciente: cada nivel sube un poco la exigencia (sin techo). */
export function levelScale(level: number, base: number, step = 1, max = 999999) {
  return Math.min(max, base + Math.floor((Math.max(1, level) - 1) / step));
}

/** Rota el banco de palabras para que nunca se repita el mismo set. */
function rotate<T>(arr: T[], by: number): T[] {
  if (arr.length === 0) return arr;
  const k = ((by % arr.length) + arr.length) % arr.length;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

/* ---------------------------------------------------------- 1. Sopa      */

const SIZE = 8;
function WordFind({ words, onWin, level }: GameProps) {
  const count = levelScale(level, 3, 2, 7);
  const list = useMemo(
    () =>
      rotate(
        words.map(clean).filter((w) => w.length >= 3 && w.length <= SIZE),
        level * 3,
      ).slice(0, count),
    [words, level, count],
  );
  const [seed] = useState(1);
  const { grid, placed } = useMemo(() => {
    const g: string[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(""));
    const ps: { word: string; cells: string[] }[] = [];
    const dirs = [
      [0, 1],
      [1, 0],
      [1, 1],
    ];
    for (const w of list) {
      for (let t = 0; t < 200; t++) {
        const [dr, dc] = dirs[rnd(dirs.length)];
        const r0 = rnd(SIZE),
          c0 = rnd(SIZE);
        if (r0 + dr * (w.length - 1) >= SIZE || c0 + dc * (w.length - 1) >= SIZE) continue;
        let ok = true;
        const cells: string[] = [];
        for (let i = 0; i < w.length; i++) {
          const r = r0 + dr * i,
            c = c0 + dc * i;
          if (g[r][c] && g[r][c] !== w[i]) {
            ok = false;
            break;
          }
          cells.push(`${r}-${c}`);
        }
        if (!ok) continue;
        for (let i = 0; i < w.length; i++) g[r0 + dr * i][c0 + dc * i] = w[i];
        ps.push({ word: w, cells });
        break;
      }
    }
    const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++) if (!g[r][c]) g[r][c] = A[rnd(26)];
    return { grid: g, placed: ps };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, seed]);

  const [sel, setSel] = useState<string[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const foundCells = new Set(placed.filter((p) => found.includes(p.word)).flatMap((p) => p.cells));

  const tap = (key: string) => {
    const next = sel.includes(key) ? sel.filter((k) => k !== key) : [...sel, key];
    setSel(next);
    const hit = placed.find(
      (p) => !found.includes(p.word) && p.cells.every((c) => next.includes(c)),
    );
    if (hit) {
      const nf = [...found, hit.word];
      setFound(nf);
      setSel([]);
      if (nf.length === placed.length) onWin(60, nf);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-8 gap-1">
        {grid.map((row, r) =>
          row.map((l, c) => {
            const key = `${r}-${c}`;
            const isF = foundCells.has(key),
              isS = sel.includes(key);
            return (
              <button
                key={key}
                onClick={() => tap(key)}
                className={cn(
                  "aspect-square rounded-[8px] text-[13px] font-bold transition active:scale-95",
                  isF
                    ? "bg-[#3FBE8F] text-white"
                    : isS
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground",
                )}
              >
                {l}
              </button>
            );
          }),
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {placed.map((p) => (
          <span
            key={p.word}
            className={cn(
              "rounded-full px-3 py-1 text-[12px] font-bold",
              found.includes(p.word)
                ? "bg-[#3FBE8F]/15 text-[#2F9C74] line-through"
                : "bg-secondary text-primary",
            )}
          >
            {p.word}
          </span>
        ))}
      </div>
      <GameFooter hint={`Nivel ${level} · ${count} palabras escondidas`} />
    </div>
  );
}

/* ---------------------------------------------------------- 2. Memoria   */

function Memory({ words, onWin, level }: GameProps) {
  const pairs = levelScale(level, 4, 2, 10);
  const cards = useMemo(() => {
    // Cada palabra aparece EXACTAMENTE dos veces: sin repetidas ni duplicadas.
    const uniq = Array.from(
      new Set([...words.map(clean).filter((w) => w.length > 2), ...POSITIVAS.map(clean)]),
    );
    const src = rotate(uniq, level * 2).slice(0, pairs);
    return src
      .flatMap((w, p) => [
        { id: `${p}-a`, w, pair: p },
        { id: `${p}-b`, w, pair: p },
      ])
      .sort(() => Math.random() - 0.5);
  }, [words, level, pairs]);
  const total = cards.length / 2;
  const [open, setOpen] = useState<number[]>([]);
  const [done, setDone] = useState<number[]>([]);

  useEffect(() => {
    if (open.length !== 2) return;
    const [a, b] = open.map((i) => cards[i]);
    const t = setTimeout(() => {
      if (a.pair === b.pair) {
        const nd = [...done, a.pair];
        setDone(nd);
        if (nd.length === total) onWin(60, cards.map((c) => c.w));
      }
      setOpen([]);
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {cards.map((c, i) => {
          const shown = open.includes(i) || done.includes(c.pair);
          return (
            <button
              key={c.id}
              onClick={() => !shown && open.length < 2 && setOpen([...open, i])}
              className={cn(
                "aspect-[4/3] rounded-[12px] grid place-items-center px-1 text-[12px] font-extrabold transition-all duration-300 active:scale-95",
                shown
                  ? "bg-gradient-to-br from-primary to-accent-pink text-white shadow-soft"
                  : "bg-secondary text-transparent",
              )}
              style={{ transform: shown ? "rotateY(0deg)" : "rotateY(8deg)" }}
            >
              {shown ? c.w : "•"}
            </button>
          );
        })}
      </div>
      <GameFooter hint={`Nivel ${level} · ${pairs} parejas`} />
    </div>
  );
}

/* ---------------------------------------------------------- 3. Escribir  */

function TypeIt({ onWin, level }: GameProps) {
  const challenge = useMemo(() => dailyWritingPrompt(level), [level]);
  return (
    <div>
      <div className="app-card p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
          Reto de hoy · nivel {level}
        </p>
        <p className="mt-1.5 font-display text-[16px] font-bold leading-snug">{challenge.prompt}</p>
        <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">
          Mínimo {challenge.minLines} líneas y usa estas palabras: {challenge.words.join(" · ")}.
          Puedes escribirlo a mano, subir la foto de tu hoja (1 o 2) o decirlo en voz alta.
        </p>
      </div>
      <StepEvidence
        className="mt-3"
        draftKey={`juego-escribe:${level}`}
        instruction={`${challenge.prompt} Usa las palabras: ${challenge.words.join(", ")}.`}
        theme={challenge.words[0]}
        minChars={40}
        onValid={() => onWin(50, challenge.words)}
      />
    </div>
  );
}

/* ------------------------------------------------- canvas game helper    */

function useCanvasLoop(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void,
  deps: unknown[],
) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const start = performance.now();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const r = cv.getBoundingClientRect();
      cv.width = r.width * dpr;
      cv.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const loop = (now: number) => {
      const r = cv.getBoundingClientRect();
      draw(ctx, r.width, r.height, (now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

function Pad({ onDir }: { onDir: (dx: number, dy: number) => void }) {
  const b =
    "w-14 h-14 rounded-[14px] bg-secondary text-primary font-bold grid place-items-center active:scale-95 transition";
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 w-[184px] mx-auto">
      <span />
      <button className={b} onClick={() => onDir(0, -1)}>
        ▲
      </button>
      <span />
      <button className={b} onClick={() => onDir(-1, 0)}>
        ◀
      </button>
      <span />
      <button className={b} onClick={() => onDir(1, 0)}>
        ▶
      </button>
      <span />
      <button className={b} onClick={() => onDir(0, 1)}>
        ▼
      </button>
      <span />
    </div>
  );
}

/* ---------------------------------------------------------- 4. Come-hojas */

/** Jardín 3D: solo en el navegador (WebGL), con carga diferida. */
const ComeHojas3D = lazy(() => import("@/components/games/ComeHojas3D"));
const Ciudad3D = lazy(() => import("@/components/games/Ciudad3D"));
const Aros3DLazy = lazy(() => import("@/components/games/Aros3D"));
const Globos3DLazy = lazy(() => import("@/components/games/Globos3D"));

/** Envoltura común: WebGL solo en el navegador, con carga diferida. */
function Only3D({ children }: { children: React.ReactNode }) {
  const skeleton = (
    <div className="aspect-[4/5] w-full animate-pulse rounded-[16px] bg-secondary" />
  );
  return (
    <ClientOnly fallback={skeleton}>
      <Suspense fallback={skeleton}>{children}</Suspense>
    </ClientOnly>
  );
}

function Ciudad3DGame(p: GameProps) {
  return (
    <Only3D>
      <Ciudad3D onWin={p.onWin} level={p.level} />
    </Only3D>
  );
}
function Aros3DGame(p: GameProps) {
  return (
    <Only3D>
      <Aros3DLazy words={p.words} onWin={p.onWin} level={p.level} />
    </Only3D>
  );
}
function Globos3DGame(p: GameProps) {
  return (
    <Only3D>
      <Globos3DLazy words={p.words} onWin={p.onWin} level={p.level} />
    </Only3D>
  );
}

function LeafEater3DLazy(p: GameProps) {
  return (
    <ClientOnly
      fallback={<div className="aspect-square w-full animate-pulse rounded-[16px] bg-secondary" />}
    >
      <Suspense
        fallback={
          <div className="aspect-square w-full animate-pulse rounded-[16px] bg-secondary" />
        }
      >
        <ComeHojas3D onWin={p.onWin} level={p.level} />
      </Suspense>
    </ClientOnly>
  );
}

function LeafEater({ onWin, level }: GameProps) {
  const G = 11;
  const state = useRef({
    p: { x: 1, y: 1 },
    e: { x: 9, y: 9 },
    leaves: new Set<string>(),
    lost: false,
    won: false,
    tick: 0,
  });
  const [, force] = useState(0);
  const [msg, setMsg] = useState("");

  const reset = () => {
    const s = state.current;
    s.p = { x: 1, y: 1 };
    s.e = { x: 9, y: 9 };
    s.lost = false;
    s.won = false;
    s.leaves = new Set();
    for (let y = 0; y < G; y++)
      for (let x = 0; x < G; x++) if ((x + y) % 2 === 0) s.leaves.add(`${x}-${y}`);
    s.leaves.delete("1-1");
    setMsg("");
    force((n) => n + 1);
  };
  useEffect(reset, []);

  const move = (dx: number, dy: number) => {
    const s = state.current;
    if (s.lost || s.won) return;
    s.p.x = Math.max(0, Math.min(G - 1, s.p.x + dx));
    s.p.y = Math.max(0, Math.min(G - 1, s.p.y + dy));
    s.leaves.delete(`${s.p.x}-${s.p.y}`);
    // chaser
    if (s.tick++ % 2 === 0) {
      if (Math.abs(s.e.x - s.p.x) > Math.abs(s.e.y - s.p.y)) s.e.x += s.e.x > s.p.x ? -1 : 1;
      else s.e.y += s.e.y > s.p.y ? -1 : 1;
    }
    if (s.e.x === s.p.x && s.e.y === s.p.y) {
      s.lost = true;
      setMsg("Te alcanzó la culpa. Vuelve a intentarlo.");
    }
    if (s.leaves.size === 0) {
      s.won = true;
      setMsg("¡Recogiste todas las hojas!");
      onWin(70);
    }
    force((n) => n + 1);
  };

  const ref = useCanvasLoop((ctx, w, h, t) => {
    const cell = Math.min(w, h) / G;
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#F6EFFF");
    g.addColorStop(1, "#EAF7F1");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const s = state.current;
    s.leaves.forEach((k) => {
      const [x, y] = k.split("-").map(Number);
      ctx.fillStyle = "#3FBE8F";
      ctx.beginPath();
      ctx.arc(
        x * cell + cell / 2,
        y * cell + cell / 2,
        cell * 0.16 + Math.sin(t * 3 + x + y) * 1.2,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });
    ctx.fillStyle = "#7C4DFF";
    ctx.beginPath();
    const mouth = Math.abs(Math.sin(t * 6)) * 0.5;
    ctx.arc(
      s.p.x * cell + cell / 2,
      s.p.y * cell + cell / 2,
      cell * 0.38,
      mouth,
      Math.PI * 2 - mouth,
    );
    ctx.lineTo(s.p.x * cell + cell / 2, s.p.y * cell + cell / 2);
    ctx.fill();
    ctx.fillStyle = "#F58BCB";
    ctx.beginPath();
    ctx.arc(s.e.x * cell + cell / 2, s.e.y * cell + cell / 2 - 2, cell * 0.34, Math.PI, 0);
    ctx.rect(
      s.e.x * cell + cell / 2 - cell * 0.34,
      s.e.y * cell + cell / 2 - 2,
      cell * 0.68,
      cell * 0.32,
    );
    ctx.fill();
  }, []);

  return (
    <div>
      <canvas ref={ref} className="w-full aspect-square rounded-[16px] shadow-soft" />
      {msg && <p className="mt-2 text-center text-[13.5px] font-bold text-primary">{msg}</p>}
      <Pad onDir={move} />
      <GameFooter />
    </div>
  );
}
/* ---------------------------------------------------------- 6. Aros       */

/* ---------------------------------------------------------- 7. Globo      */

/* ---------------------------------------------------------- 8. Pez        */

function HealingFish({ onWin, level }: GameProps) {
  const st = useRef({
    y: 0.5,
    items: [] as { x: number; y: number; w: string; good: boolean }[],
    score: 0,
    spawn: 0,
  });
  const [score, setScore] = useState(0);
  const [msg, setMsg] = useState("");
  const caught = useRef<string[]>([]);
  const goal = Math.min(50, 10 + (Math.max(1, level) - 1) * 8);

  const ref = useCanvasLoop((ctx, w, h, t) => {
    const s = st.current;
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#BFE7FF");
    g.addColorStop(1, "#4C86C6");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    if (t - s.spawn > 0.9) {
      s.spawn = t;
      const good = Math.random() > 0.35;
      s.items.push({
        x: w + 40,
        y: 30 + Math.random() * (h - 60),
        good,
        w: good ? POSITIVAS[rnd(POSITIVAS.length)] : OSCURAS[rnd(OSCURAS.length)],
      });
    }
    const fy = s.y * h;
    s.items = s.items.filter((it) => {
      it.x -= 1.7;
      ctx.font = "bold 13px system-ui";
      ctx.fillStyle = it.good ? "#FFFFFF" : "#2B1B3F";
      ctx.textAlign = "center";
      ctx.beginPath();
      ctx.fillStyle = it.good ? "rgba(63,190,143,.92)" : "rgba(43,27,63,.75)";
      const tw = ctx.measureText(it.w).width + 18;
      ctx.roundRect(it.x - tw / 2, it.y - 12, tw, 24, 12);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText(it.w, it.x, it.y + 4);
      if (Math.abs(it.x - 48) < 20 && Math.abs(it.y - fy) < 26) {
        if (it.good) {
          s.score++;
          setScore(s.score);
          if (!caught.current.includes(it.w)) caught.current.push(it.w);
          if (s.score >= goal) {
            setMsg("¡Llenaste el mar de palabras sanas!");
            onWin(60, caught.current);
          }
        } else {
          s.score = Math.max(0, s.score - 1);
          setScore(s.score);
        }
        return false;
      }
      return it.x > -60;
    });
    // pez
    ctx.fillStyle = "#F7B955";
    ctx.beginPath();
    ctx.ellipse(48, fy, 20, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(28, fy);
    ctx.lineTo(12, fy - 10 + Math.sin(t * 8) * 3);
    ctx.lineTo(12, fy + 10 + Math.sin(t * 8) * 3);
    ctx.fill();
    ctx.fillStyle = "#2B1B3F";
    ctx.beginPath();
    ctx.arc(56, fy - 3, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const swim = (dy: number) => {
    st.current.y = Math.max(0.08, Math.min(0.92, st.current.y + dy * 0.12));
  };

  return (
    <div>
      <p className="text-center text-[12.5px] font-bold text-primary mb-2">
        Palabras sanas: {score} / {goal}
      </p>
      <canvas ref={ref} className="w-full aspect-[4/3] rounded-[16px] shadow-soft" />
      {msg && <p className="mt-2 text-center text-[13.5px] font-bold text-[#2F9C74]">{msg}</p>}
      <Pad onDir={(_, dy) => swim(dy)} />
      <GameFooter hint="Esquiva las cargas oscuras" />
    </div>
  );
}

/* ---------------------------------------------------------- 9. Ardilla    */

function SquirrelRun({ onWin, level }: GameProps) {
  const st = useRef({
    lane: 1,
    obs: [] as { x: number; lane: number }[],
    carrots: [] as { x: number; lane: number }[],
    got: 0,
    over: false,
    spawn: 0,
    cspawn: 0,
  });
  const [got, setGot] = useState(0);
  const [over, setOver] = useState(false);
  const goal = Math.min(50, 14 + (Math.max(1, level) - 1) * 9);

  const ref = useCanvasLoop((ctx, w, h, t) => {
    const s = st.current;
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#EAF7F1");
    g.addColorStop(1, "#CDEBD9");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const laneY = (l: number) => (h / 3) * l + h / 6;

    // arbustos de fondo que corren (sensación de campo vivo)
    ctx.fillStyle = "rgba(63,190,143,.18)";
    for (let i = 0; i < 6; i++) {
      const bx = w + 120 - ((t * 60 + i * 140) % (w + 240));
      ctx.beginPath();
      ctx.ellipse(bx, h - 8, 34, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(43,27,63,.07)";
    for (let l = 1; l < 3; l++) {
      ctx.beginPath();
      ctx.moveTo(0, (h / 3) * l);
      ctx.lineTo(w, (h / 3) * l);
      ctx.stroke();
    }

    if (!s.over) {
      if (t - s.spawn > 0.85) {
        s.spawn = t;
        s.obs.push({ x: w + 30, lane: rnd(3) });
      }
      if (t - s.cspawn > 0.55) {
        s.cspawn = t;
        s.carrots.push({ x: w + 30, lane: rnd(3) });
      }
    }

    // zanahorias
    s.carrots = s.carrots.filter((c) => {
      if (!s.over) c.x -= 3;
      const y = laneY(c.lane);
      ctx.fillStyle = "#F7913D";
      ctx.beginPath();
      ctx.moveTo(c.x - 7, y - 9);
      ctx.lineTo(c.x + 7, y - 9);
      ctx.lineTo(c.x, y + 12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#3FBE8F";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(c.x, y - 9);
      ctx.lineTo(c.x - 4, y - 18);
      ctx.moveTo(c.x, y - 9);
      ctx.lineTo(c.x + 4, y - 18);
      ctx.stroke();
      if (Math.abs(c.x - 50) < 20 && c.lane === s.lane && !s.over) {
        s.got++;
        setGot(s.got);
        if (s.got >= goal) {
          s.over = true;
          setOver(true);
          onWin(70);
        }
        return false;
      }
      return c.x > -30;
    });

    // humano que persigue (decide solo su carril)
    s.obs = s.obs.filter((o) => {
      if (!s.over) {
        o.x -= 3.4;
        if (o.x < w * 0.7 && Math.random() < 0.02) o.lane = s.lane;
      }
      const y = laneY(o.lane);
      ctx.fillStyle = "#7C4DFF";
      ctx.beginPath();
      ctx.arc(o.x, y - 16, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(o.x - 8, y - 8, 16, 22);
      ctx.fillRect(o.x - 14, y - 4 + Math.sin(t * 12) * 3, 6, 12);
      if (Math.abs(o.x - 50) < 18 && o.lane === s.lane && !s.over) {
        s.over = true;
        setOver(true);
      }
      return o.x > -40;
    });

    // conejo
    const y = laneY(s.lane);
    const hop = Math.abs(Math.sin(t * 9)) * 5;
    ctx.fillStyle = "#F4F1FB";
    ctx.beginPath();
    ctx.ellipse(50, y - hop, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(63, y - 10 - hop, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(64, y - 24 - hop, 3.4, 11, 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(57, y - 23 - hop, 3.2, 10, -0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#F58BCB";
    ctx.beginPath();
    ctx.arc(34, y - 6 - hop, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2B1B3F";
    ctx.beginPath();
    ctx.arc(67, y - 12 - hop, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  function restart() {
    st.current = { lane: 1, obs: [], carrots: [], got: 0, over: false, spawn: 0, cspawn: 0 };
    setGot(0);
    setOver(false);
  }

  return (
    <div>
      <p className="text-center text-[12.5px] font-bold text-primary mb-2">
        Zanahorias: {got} / {goal}
      </p>
      <canvas ref={ref} className="w-full aspect-[4/3] rounded-[16px] shadow-soft" />
      {over && (
        <p className="mt-2 text-center text-[13.5px] font-bold text-primary">
          {got >= goal
            ? "¡Escapaste con tus zanahorias! Nadie decide por ti."
            : "Te atraparon. Respira y vuelve a correr."}
        </p>
      )}
      {over && got < goal && (
        <button
          onClick={restart}
          className="mx-auto mt-2 block rounded-full bg-primary px-5 py-2.5 text-[13px] font-bold text-primary-foreground active:scale-95 transition"
        >
          Correr de nuevo
        </button>
      )}
      <Pad
        onDir={(_, dy) => {
          const s = st.current;
          if (!s.over) s.lane = Math.max(0, Math.min(2, s.lane + dy));
        }}
      />
      <GameFooter hint="Sube y baja de carril: junta zanahorias y esquiva al humano" />
    </div>
  );
}

/* ---------------------------------------------------------- 10. Respira   */

function Breathe({ onWin }: GameProps) {
  const GOAL = 4;
  const SEQ = [
    { p: "in" as const, ms: 4000, label: "Inhala por la nariz" },
    { p: "hold" as const, ms: 4000, label: "Sostén sin apretar" },
    { p: "out" as const, ms: 6000, label: "Exhala y suelta" },
  ];
  const [i, setI] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const [left, setLeft] = useState(SEQ[0].ms / 1000);
  const wonRef = useRef(false);

  useEffect(() => {
    if (paused || done) return;
    setLeft(SEQ[i % 3].ms / 1000);
    const tick = window.setInterval(() => setLeft((v) => Math.max(0, v - 0.1)), 100);
    const t = window.setTimeout(
      () => {
        const nextI = i + 1;
        if (nextI % 3 === 0) {
          const c = cycle + 1;
          setCycle(c);
          if (c >= GOAL) {
            setDone(true);
            if (!wonRef.current) {
              wonRef.current = true;
              onWin(40);
            }
            return;
          }
        }
        setI(nextI);
      },
      SEQ[i % 3].ms,
    );
    return () => {
      window.clearTimeout(t);
      window.clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, paused, done]);

  const phase = SEQ[i % 3];
  const scale = done ? 0.85 : phase.p === "in" ? 1 : phase.p === "hold" ? 1 : 0.72;
  const dur = paused ? 0 : phase.ms / 1000;

  function restart() {
    wonRef.current = false;
    setI(0);
    setCycle(0);
    setDone(false);
    setPaused(false);
  }

  return (
    <div className="text-center py-2">
      <div className="grid h-56 place-items-center">
        <div
          className="grid place-items-center rounded-full bg-gradient-to-br from-primary/25 to-accent-pink/25"
          style={{
            width: 190,
            height: 190,
            transform: `scale(${scale})`,
            transition: `transform ${dur}s ease-in-out`,
          }}
        >
          <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-primary to-accent-pink font-display text-[15px] font-extrabold text-white shadow-glow">
            {cycle}/{GOAL}
          </div>
        </div>
      </div>
      <p className="mt-2 font-display text-[20px] font-extrabold">
        {done ? "Tu cuerpo bajó a la calma" : phase.label}
      </p>
      <p className="mt-1 text-[13px] text-muted-foreground">
        {done
          ? "Cuatro rondas completas. Quédate un momento así antes de seguir."
          : `${left.toFixed(1)} s · ritmo 4 · 4 · 6, sin audio ni internet`}
      </p>
      <div className="mt-3 flex items-center justify-center gap-2">
        {!done && (
          <button
            onClick={() => setPaused((p) => !p)}
            className="min-h-[44px] rounded-full bg-secondary px-5 text-[13px] font-bold text-foreground active:scale-95 transition"
          >
            {paused ? "Reanudar" : "Pausar"}
          </button>
        )}
        <button
          onClick={restart}
          className="min-h-[44px] rounded-full bg-primary px-5 text-[13px] font-bold text-primary-foreground active:scale-95 transition"
        >
          Reiniciar
        </button>
      </div>
      <div className="mx-auto mt-3 flex max-w-[240px] justify-center gap-1.5">
        {Array.from({ length: GOAL }).map((_, k) => (
          <span
            key={k}
            className={cn("h-1.5 flex-1 rounded-full", k < cycle ? "bg-primary" : "bg-primary/15")}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- shell         */

function GameFooter({ hint }: { hint?: string }) {
  return (
    <div className="mt-4 flex items-center gap-3">
      <span className="text-[11.5px] text-muted-foreground">
        {hint ?? "Sin prisa: esto también es sanar."}
      </span>
    </div>
  );
}

export type GameDef = {
  id: string;
  title: string;
  desc: string;
  gems: number;
  icon: React.ReactNode;
  tint: string;
  render: (p: GameProps) => React.ReactNode;
};

export const GAMES: GameDef[] = [
  {
    id: "sopa",
    title: "Encuentra la palabra",
    desc: "Sopa de letras de tu tema de hoy",
    gems: 60,
    tint: "from-[#7C4DFF] to-[#B18CFF]",
    icon: <Search className="w-6 h-6" />,
    render: (p) => <WordFind {...p} />,
  },
  {
    id: "memoria",
    title: "Memoria del alma",
    desc: "Empareja las palabras que te sostienen",
    gems: 60,
    tint: "from-[#F58BCB] to-[#FFB3DC]",
    icon: <Brain className="w-6 h-6" />,
    render: (p) => <Memory {...p} />,
  },
  {
    id: "escribe",
    title: "Escríbelo y créelo",
    desc: "Escribe tu declaración completa",
    gems: 50,
    tint: "from-[#3FBE8F] to-[#7FE0BC]",
    icon: <PenLine className="w-6 h-6" />,
    render: (p) => <TypeIt {...p} />,
  },
  {
    id: "hojas",
    title: "Come-hojas",
    desc: "Recoge todas las hojas sin que te atrape la culpa",
    gems: 70,
    tint: "from-[#F7B955] to-[#FFD79A]",
    icon: <Ghost className="w-6 h-6" />,
    render: (p) => <LeafEater3DLazy {...p} />,
  },
  {
    id: "bloques",
    title: "Ordena tu caos",
    desc: "Encaja los bloques 3D y la grúa se lleva cada línea",
    gems: 70,
    tint: "from-[#4C86C6] to-[#9BC6F0]",
    icon: <Blocks className="w-6 h-6" />,
    render: (p) => <Ciudad3DGame {...p} />,
  },
  {
    id: "aros",
    title: "Aros de verdad",
    desc: "Apunta, carga la fuerza y encesta los aros",
    gems: 60,
    tint: "from-[#7C4DFF] to-[#F58BCB]",
    icon: <Circle className="w-6 h-6" />,
    render: (p) => <Aros3DGame {...p} />,
  },
  {
    id: "globo",
    title: "Globo de afirmaciones",
    desc: "Revienta globos y recibe tu afirmación del día",
    gems: 50,
    tint: "from-[#F58BCB] to-[#F7B955]",
    icon: <Wind className="w-6 h-6" />,
    render: (p) => <Globos3DGame {...p} />,
  },
  {
    id: "pez",
    title: "Pez de sanación",
    desc: "Navega y atrapa solo lo que te hace bien",
    gems: 60,
    tint: "from-[#4C86C6] to-[#3FBE8F]",
    icon: <Fish className="w-6 h-6" />,
    render: (p) => <HealingFish {...p} />,
  },
  {
    id: "ardilla",
    title: "Escapa del control",
    desc: "El conejo corre, junta zanahorias y esquiva a quien lo quiere atrapar",
    gems: 70,
    tint: "from-[#C9743A] to-[#F7B955]",
    icon: <Rabbit className="w-6 h-6" />,
    render: (p) => <SquirrelRun {...p} />,
  },
  {
    id: "respira",
    title: "Respiración 4·4·6",
    desc: "Cuatro rondas para bajar el cuerpo a la calma",
    gems: 40,
    tint: "from-[#7FE0BC] to-[#BFE7FF]",
    icon: <HeartPulse className="w-6 h-6" />,
    render: (p) => <Breathe {...p} />,
  },
];

/**
 * Centro de juegos del día: 10 juegos mentales adaptados al tema de la persona.
 */
/**
 * Lista de "Juegos del día": cada tarjeta abre su propia sección
 * (`/juegos/:id`), sin ventanas emergentes. Portadas 100% locales.
 */
export function DailyGames({
  title = "Juegos del día",
  subtitle = "Diez juegos mentales que trabajan justo lo que estás sanando. Cada uno pide 5 partidas para liberar tu hoja del día.",
}: {
  words?: string[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <section>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 mb-2">
        <h3 className="font-display font-bold text-[15px] truncate">{title}</h3>
        <Link
          to="/juegos"
          className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#F7B955]/18 px-2.5 py-1 text-[11px] font-bold text-[#B67C15]"
        >
          <Trophy className="w-3.5 h-3.5" /> Ver los 10
        </Link>
      </div>
      <div className="hairline-brand mb-3" />
      <p className="text-[13px] text-muted-foreground mb-3">{subtitle}</p>
      <div className="grid grid-cols-2 gap-3">
        {GAMES.map((g, i) => (
          <GameCard key={g.id} game={g} index={i} />
        ))}
      </div>
    </section>
  );
}

/** Tarjeta-enlace con portada local (degradé tonal + ícono). */
export function GameCard({ game, index = 0 }: { game: GameDef; index?: number }) {
  const plays = useGamePlays(game.id);
  const ov = useContentOverrides().get(`juego:${game.id}`);
  if (ov?.is_hidden) return null;
  return (
    <Link
      to="/juegos/$gameId"
      params={{ gameId: game.id }}
      aria-label={`Abrir ${game.title}`}
      className="block w-full overflow-hidden rounded-[16px] border border-border/60 bg-card shadow-soft text-left active:scale-[.98] transition-transform"
      style={{ animation: `fade-in .35s ease-out ${index * 45}ms both` }}
    >
      {ov?.cover_url ? (
        <img src={ov.cover_url} alt="" loading="lazy" className="h-24 w-full object-cover" />
      ) : (
        <span className={cn("grid h-24 place-items-center bg-gradient-to-br text-white", game.tint)}>
          <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-white/20">
            {game.icon}
          </span>
        </span>
      )}
      <span className="block px-3 py-2.5">
        <span className="block font-display font-bold text-[13.5px] leading-tight truncate">
          {ov?.title || game.title}
        </span>
        <span className="block text-[11.5px] text-muted-foreground leading-snug line-clamp-2">
          {game.desc}
        </span>
        <span
          className={cn(
            "mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-bold",
            plays.unlocked ? "text-[#2F9C74]" : "text-primary",
          )}
        >
          {plays.unlocked ? (
            <>
              <Check className="w-3.5 h-3.5" /> Hoja de hoy liberada
            </>
          ) : (
            <>
              <Leaf className="w-3.5 h-3.5" /> {plays.plays}/{MIN_PLAYS} partidas de hoy
            </>
          )}
        </span>
      </span>
    </Link>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { awardLeaf, HOJA_POINTS } from "@/lib/gems";

export const MAX_LEVEL = 10000;
import { toast } from "sonner";
import {
  Search, Brain, PenLine, Ghost, Blocks, Circle, Wind,
  Fish, Rabbit, HeartPulse, Trophy, Leaf, Check, Sparkles, ArrowRight,
} from "lucide-react";

/* ---------------------------------------------------------------- utils */

const POSITIVAS = [
  "PAZ", "FE", "AMOR", "LUZ", "PERDÓN", "CALMA", "VALOR", "GOZO",
  "LIBRE", "SANO", "FUERZA", "TERNURA", "ESPERANZA", "GRACIA",
];
const OSCURAS = ["CULPA", "MIEDO", "RENCOR", "VERGÜENZA", "CONTROL", "DUDA"];

function rnd(n: number) { return Math.floor(Math.random() * n); }
function clean(w: string) {
  return w.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z]/g, "");
}

type GameProps = { words: string[]; onWin: (gems: number) => void; level: number };

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
    () => rotate(words.map(clean).filter((w) => w.length >= 3 && w.length <= SIZE), level * 3).slice(0, count),
    [words, level, count],
  );
  const [seed] = useState(1);
  const { grid, placed } = useMemo(() => {
    const g: string[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(""));
    const ps: { word: string; cells: string[] }[] = [];
    const dirs = [[0, 1], [1, 0], [1, 1]];
    for (const w of list) {
      for (let t = 0; t < 200; t++) {
        const [dr, dc] = dirs[rnd(dirs.length)];
        const r0 = rnd(SIZE), c0 = rnd(SIZE);
        if (r0 + dr * (w.length - 1) >= SIZE || c0 + dc * (w.length - 1) >= SIZE) continue;
        let ok = true;
        const cells: string[] = [];
        for (let i = 0; i < w.length; i++) {
          const r = r0 + dr * i, c = c0 + dc * i;
          if (g[r][c] && g[r][c] !== w[i]) { ok = false; break; }
          cells.push(`${r}-${c}`);
        }
        if (!ok) continue;
        for (let i = 0; i < w.length; i++) g[r0 + dr * i][c0 + dc * i] = w[i];
        ps.push({ word: w, cells });
        break;
      }
    }
    const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!g[r][c]) g[r][c] = A[rnd(26)];
    return { grid: g, placed: ps };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, seed]);

  const [sel, setSel] = useState<string[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const foundCells = new Set(placed.filter((p) => found.includes(p.word)).flatMap((p) => p.cells));

  const tap = (key: string) => {
    const next = sel.includes(key) ? sel.filter((k) => k !== key) : [...sel, key];
    setSel(next);
    const hit = placed.find((p) => !found.includes(p.word) && p.cells.every((c) => next.includes(c)));
    if (hit) {
      const nf = [...found, hit.word];
      setFound(nf); setSel([]);
      if (nf.length === placed.length) onWin(60);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-8 gap-1">
        {grid.map((row, r) => row.map((l, c) => {
          const key = `${r}-${c}`;
          const isF = foundCells.has(key), isS = sel.includes(key);
          return (
            <button key={key} onClick={() => tap(key)}
              className={cn("aspect-square rounded-[8px] text-[13px] font-bold transition active:scale-95",
                isF ? "bg-[#3FBE8F] text-white" : isS ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground")}>
              {l}
            </button>
          );
        }))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {placed.map((p) => (
          <span key={p.word} className={cn("rounded-full px-3 py-1 text-[12px] font-bold",
            found.includes(p.word) ? "bg-[#3FBE8F]/15 text-[#2F9C74] line-through" : "bg-secondary text-primary")}>{p.word}</span>
        ))}
      </div>
      <GameFooter hint={`Nivel ${level} · ${count} palabras escondidas`} />
    </div>
  );
}

/* ---------------------------------------------------------- 2. Memoria   */

function Memory({ words, onWin, level }: GameProps) {
  const pairs = levelScale(level, 4, 2, 10);
  const base = useMemo(() => {
    const src = rotate([...words.map(clean).filter((w) => w.length > 2), ...POSITIVAS.map(clean)], level * 2).slice(0, pairs);
    return [...src, ...src].map((w, i) => ({ id: i, w })).sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, level, pairs]);
  const [cards, setCards] = useState(base);
  const [open, setOpen] = useState<number[]>([]);
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    if (open.length !== 2) return;
    const [a, b] = open.map((i) => cards[i]);
    const t = setTimeout(() => {
      if (a.w === b.w) {
        const nd = [...done, a.w];
        setDone(nd);
        if (nd.length === new Set(cards.map((c) => c.w)).size) onWin(60);
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
          const shown = open.includes(i) || done.includes(c.w);
          return (
            <button key={c.id} onClick={() => !shown && open.length < 2 && setOpen([...open, i])}
              className={cn("aspect-[4/3] rounded-[12px] grid place-items-center px-1 text-[12px] font-extrabold transition-all duration-300 active:scale-95",
                shown ? "bg-gradient-to-br from-primary to-accent-pink text-white shadow-soft" : "bg-secondary text-transparent")}
              style={{ transform: shown ? "rotateY(0deg)" : "rotateY(8deg)" }}>
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

function TypeIt({ words, onWin, level }: GameProps) {
  const frase = useMemo(() => {
    const w = words.map((x) => x.toLowerCase()).filter(Boolean)[0] ?? "paz";
    return `Hoy elijo ${w} y suelto lo que no me pertenece.`;
  }, [words]);
  const [val, setVal] = useState("");
  const ok = val.trim().toLowerCase() === frase.toLowerCase();
  useEffect(() => { if (ok) onWin(50); /* eslint-disable-next-line */ }, [ok]);
  const progress = Math.min(100, (val.length / frase.length) * 100);
  return (
    <div>
      <p className="app-card p-4 text-[15px] leading-relaxed font-display font-bold text-center">{frase}</p>
      <textarea value={val} onChange={(e) => setVal(e.target.value)} rows={3}
        placeholder="Escríbela tal cual, con calma…"
        className="mt-3 w-full rounded-[10px] border-[1.5px] border-border bg-background p-3 text-[15px] outline-none focus:border-primary focus:ring-4 focus:ring-primary/20" />
      <div className="mt-2 h-1.5 rounded-full bg-primary/12 overflow-hidden">
        <div className="h-full bg-brand-gradient transition-all" style={{ width: `${progress}%` }} />
      </div>
      {ok && <p className="mt-3 text-[13.5px] font-bold text-[#2F9C74] flex items-center gap-1.5"><Check className="w-4 h-4" /> Lo escribiste completo. Que hoy sea verdad.</p>}
    </div>
  );
}

/* ------------------------------------------------- canvas game helper    */

function useCanvasLoop(draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    let raf = 0; let start = performance.now();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const r = cv.getBoundingClientRect();
      cv.width = r.width * dpr; cv.height = r.height * dpr;
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
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

function Pad({ onDir }: { onDir: (dx: number, dy: number) => void }) {
  const b = "w-14 h-14 rounded-[14px] bg-secondary text-primary font-bold grid place-items-center active:scale-95 transition";
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 w-[184px] mx-auto">
      <span /><button className={b} onClick={() => onDir(0, -1)}>▲</button><span />
      <button className={b} onClick={() => onDir(-1, 0)}>◀</button>
      <span /><button className={b} onClick={() => onDir(1, 0)}>▶</button>
      <span /><button className={b} onClick={() => onDir(0, 1)}>▼</button><span />
    </div>
  );
}

/* ---------------------------------------------------------- 4. Come-hojas */

function LeafEater({ onWin, level }: GameProps) {
  const G = 11;
  const state = useRef({
    p: { x: 1, y: 1 }, e: { x: 9, y: 9 },
    leaves: new Set<string>(), lost: false, won: false, tick: 0,
  });
  const [, force] = useState(0);
  const [msg, setMsg] = useState("");

  const reset = () => {
    const s = state.current;
    s.p = { x: 1, y: 1 }; s.e = { x: 9, y: 9 }; s.lost = false; s.won = false;
    s.leaves = new Set();
    for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) if ((x + y) % 2 === 0) s.leaves.add(`${x}-${y}`);
    s.leaves.delete("1-1");
    setMsg(""); force((n) => n + 1);
  };
  useEffect(reset, []);

  const move = (dx: number, dy: number) => {
    const s = state.current; if (s.lost || s.won) return;
    s.p.x = Math.max(0, Math.min(G - 1, s.p.x + dx));
    s.p.y = Math.max(0, Math.min(G - 1, s.p.y + dy));
    s.leaves.delete(`${s.p.x}-${s.p.y}`);
    // chaser
    if (s.tick++ % 2 === 0) {
      if (Math.abs(s.e.x - s.p.x) > Math.abs(s.e.y - s.p.y)) s.e.x += s.e.x > s.p.x ? -1 : 1;
      else s.e.y += s.e.y > s.p.y ? -1 : 1;
    }
    if (s.e.x === s.p.x && s.e.y === s.p.y) { s.lost = true; setMsg("Te alcanzó la culpa. Vuelve a intentarlo."); }
    if (s.leaves.size === 0) { s.won = true; setMsg("¡Recogiste todas las hojas!"); onWin(70); }
    force((n) => n + 1);
  };

  const ref = useCanvasLoop((ctx, w, h, t) => {
    const cell = Math.min(w, h) / G;
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#F6EFFF"); g.addColorStop(1, "#EAF7F1");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const s = state.current;
    s.leaves.forEach((k) => {
      const [x, y] = k.split("-").map(Number);
      ctx.fillStyle = "#3FBE8F";
      ctx.beginPath();
      ctx.arc(x * cell + cell / 2, y * cell + cell / 2, cell * 0.16 + Math.sin(t * 3 + x + y) * 1.2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#7C4DFF";
    ctx.beginPath();
    const mouth = Math.abs(Math.sin(t * 6)) * 0.5;
    ctx.arc(s.p.x * cell + cell / 2, s.p.y * cell + cell / 2, cell * 0.38, mouth, Math.PI * 2 - mouth);
    ctx.lineTo(s.p.x * cell + cell / 2, s.p.y * cell + cell / 2);
    ctx.fill();
    ctx.fillStyle = "#F58BCB";
    ctx.beginPath();
    ctx.arc(s.e.x * cell + cell / 2, s.e.y * cell + cell / 2 - 2, cell * 0.34, Math.PI, 0);
    ctx.rect(s.e.x * cell + cell / 2 - cell * 0.34, s.e.y * cell + cell / 2 - 2, cell * 0.68, cell * 0.32);
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

/* ---------------------------------------------------------- 5. Tetris     */

const COLS = 8, ROWS = 14;
const SHAPES = [
  [[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]],
];
function TetrisLite({ onWin, level }: GameProps) {
  const lineGoal = levelScale(level, 3, 1, 40);
  const st = useRef({
    board: Array.from({ length: ROWS }, () => Array(COLS).fill(0)) as number[][],
    shape: SHAPES[0] as number[][], x: 3, y: 0, lines: 0, over: false, acc: 0, last: 0,
  });
  const [lines, setLines] = useState(0);
  const [over, setOver] = useState(false);

  const spawn = () => {
    const s = st.current;
    s.shape = SHAPES[rnd(SHAPES.length)]; s.x = 3; s.y = 0;
    if (collide(0, 0)) { s.over = true; setOver(true); }
  };
  const collide = (dx: number, dy: number, sh?: number[][]) => {
    const s = st.current; const shape = sh ?? s.shape;
    for (let r = 0; r < shape.length; r++) for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = s.x + c + dx, ny = s.y + r + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && s.board[ny][nx]) return true;
    }
    return false;
  };
  const merge = () => {
    const s = st.current;
    s.shape.forEach((row, r) => row.forEach((v, c) => { if (v && s.y + r >= 0) s.board[s.y + r][s.x + c] = 1; }));
    let cleared = 0;
    s.board = s.board.filter((row) => { if (row.every(Boolean)) { cleared++; return false; } return true; });
    while (s.board.length < ROWS) s.board.unshift(Array(COLS).fill(0));
    if (cleared) {
      s.lines += cleared; setLines(s.lines);
      if (s.lines >= lineGoal) onWin(70);
    }
    spawn();
  };
  const drop = () => { if (collide(0, 1)) merge(); else st.current.y++; };
  const move = (dx: number, dy: number) => {
    const s = st.current; if (s.over) return;
    if (dy > 0) { drop(); return; }
    if (dy < 0) {
      const rot = s.shape[0].map((_, i) => s.shape.map((r) => r[i]).reverse());
      if (!collide(0, 0, rot)) s.shape = rot;
      return;
    }
    if (!collide(dx, 0)) s.x += dx;
  };

  useEffect(() => { spawn(); const id = setInterval(() => { if (!st.current.over) drop(); }, 650); return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ref = useCanvasLoop((ctx, w, h) => {
    const cw = w / COLS, ch = h / ROWS;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#1E1033"; ctx.fillRect(0, 0, w, h);
    const s = st.current;
    const cellPaint = (x: number, y: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.roundRect(x * cw + 1.5, y * ch + 1.5, cw - 3, ch - 3, 4); ctx.fill();
    };
    s.board.forEach((row, y) => row.forEach((v, x) => { if (v) cellPaint(x, y, "#3FBE8F"); }));
    s.shape.forEach((row, r) => row.forEach((v, c) => { if (v) cellPaint(s.x + c, s.y + r, "#F7B955"); }));
  }, []);

  const reset = () => {
    st.current.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    st.current.lines = 0; st.current.over = false; setLines(0); setOver(false); spawn();
  };

  return (
    <div>
      <p className="text-center text-[12.5px] font-bold text-primary mb-2">Líneas ordenadas: {lines} / 3</p>
      <canvas ref={ref} className="w-full aspect-[8/14] max-h-[46vh] mx-auto rounded-[16px] shadow-soft" />
      {over && <p className="mt-2 text-center text-[13px] font-bold text-primary">Se llenó. Empieza otra vez con calma.</p>}
      <Pad onDir={move} />
      <GameFooter hint="▲ gira la pieza" />
    </div>
  );
}

/* ---------------------------------------------------------- 6. Aros       */

function RingWord({ words, onWin, level }: GameProps) {
  const target = useMemo(() => clean(words.map(clean).filter((w) => w.length >= 4)[0] ?? "LIBERTAD"), [words]);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [fails, setFails] = useState(0);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const won = target.split("").every((l) => guessed.includes(l));
  useEffect(() => { if (won) onWin(60); /* eslint-disable-next-line */ }, [won]);
  const rings = new Set(target.split("")).size;
  const placedRings = new Set(target.split("").filter((l) => guessed.includes(l))).size;

  return (
    <div>
      <div className="relative h-40 grid place-items-end justify-center">
        <div className="absolute bottom-0 w-2 h-32 rounded-full bg-primary/25" />
        {Array.from({ length: placedRings }).map((_, i) => (
          <span key={i} className="absolute rounded-full border-[6px] border-accent-pink/80"
            style={{ width: 74 - i * 6, height: 22, bottom: i * 18, animation: "scale-in .25s ease-out both" }} />
        ))}
      </div>
      <p className="text-center font-display font-extrabold text-[26px] tracking-[6px] mt-2">
        {target.split("").map((l, i) => <span key={i}>{guessed.includes(l) ? l : "_"}</span>)}
      </p>
      <p className="text-center text-[12px] text-muted-foreground mt-1">Aros colocados {placedRings}/{rings} · fallos {fails}</p>
      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {letters.map((l) => (
          <button key={l} disabled={guessed.includes(l)}
            onClick={() => { setGuessed([...guessed, l]); if (!target.includes(l)) setFails((f) => f + 1); }}
            className={cn("h-10 rounded-[10px] text-[13px] font-bold transition active:scale-95",
              guessed.includes(l) ? (target.includes(l) ? "bg-[#3FBE8F] text-white" : "bg-muted text-muted-foreground") : "bg-secondary text-primary")}>
            {l}
          </button>
        ))}
      </div>
      {won && <p className="mt-3 text-center text-[13.5px] font-bold text-[#2F9C74]">¡Completaste la palabra y todos los aros!</p>}
      <GameFooter />
    </div>
  );
}

/* ---------------------------------------------------------- 7. Globo      */

function Balloon({ onWin, level }: GameProps) {
  const [n, setN] = useState(0);
  const goal = levelScale(level, 12, 1, 120);
  const word = POSITIVAS[n % POSITIVAS.length];
  const done = n >= goal;
  useEffect(() => { if (done) onWin(50); /* eslint-disable-next-line */ }, [done]);
  return (
    <div className="text-center">
      <div className="h-56 grid place-items-center">
        <button onClick={() => !done && setN(n + 1)} aria-label="Inflar el globo"
          className="relative grid place-items-center transition-transform active:scale-95"
          style={{ transform: `scale(${1 + n * 0.06})` }}>
          <span className="block w-24 h-28 rounded-[50%] bg-gradient-to-br from-accent-pink to-primary shadow-glow" />
          <span className="absolute text-white font-display font-extrabold text-[13px]">{done ? "¡LISTO!" : word}</span>
        </button>
      </div>
      <p className="text-[13px] text-muted-foreground">Pulsa para llenar tu globo de palabras que sí son tuyas.</p>
      <p className="text-[12.5px] font-bold text-primary mt-1">{Math.min(n, goal)} / {goal}</p>
      <GameFooter />
    </div>
  );
}

/* ---------------------------------------------------------- 8. Pez        */

function HealingFish({ onWin, level }: GameProps) {
  const st = useRef({
    y: 0.5, items: [] as { x: number; y: number; w: string; good: boolean }[],
    score: 0, spawn: 0,
  });
  const [score, setScore] = useState(0);
  const [msg, setMsg] = useState("");
  const goal = levelScale(level, 6, 1, 80);

  const ref = useCanvasLoop((ctx, w, h, t) => {
    const s = st.current;
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#BFE7FF"); g.addColorStop(1, "#4C86C6");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    if (t - s.spawn > 0.9) {
      s.spawn = t;
      const good = Math.random() > 0.35;
      s.items.push({ x: w + 40, y: 30 + Math.random() * (h - 60), good, w: good ? POSITIVAS[rnd(POSITIVAS.length)] : OSCURAS[rnd(OSCURAS.length)] });
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
      ctx.roundRect(it.x - tw / 2, it.y - 12, tw, 24, 12); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.fillText(it.w, it.x, it.y + 4);
      if (Math.abs(it.x - 48) < 20 && Math.abs(it.y - fy) < 26) {
        if (it.good) { s.score++; setScore(s.score); if (s.score >= goal) { setMsg("¡Llenaste el mar de palabras sanas!"); onWin(60); } }
        else { s.score = Math.max(0, s.score - 1); setScore(s.score); }
        return false;
      }
      return it.x > -60;
    });
    // pez
    ctx.fillStyle = "#F7B955";
    ctx.beginPath(); ctx.ellipse(48, fy, 20, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(28, fy); ctx.lineTo(12, fy - 10 + Math.sin(t * 8) * 3); ctx.lineTo(12, fy + 10 + Math.sin(t * 8) * 3); ctx.fill();
    ctx.fillStyle = "#2B1B3F"; ctx.beginPath(); ctx.arc(56, fy - 3, 2.4, 0, Math.PI * 2); ctx.fill();
  }, []);

  const swim = (dy: number) => { st.current.y = Math.max(0.08, Math.min(0.92, st.current.y + dy * 0.12)); };

  return (
    <div>
      <p className="text-center text-[12.5px] font-bold text-primary mb-2">Palabras sanas: {score} / {goal}</p>
      <canvas ref={ref} className="w-full aspect-[4/3] rounded-[16px] shadow-soft" />
      {msg && <p className="mt-2 text-center text-[13.5px] font-bold text-[#2F9C74]">{msg}</p>}
      <Pad onDir={(_, dy) => swim(dy)} />
      <GameFooter hint="Esquiva las cargas oscuras" />
    </div>
  );
}

/* ---------------------------------------------------------- 9. Ardilla    */

function SquirrelRun({ onWin, level }: GameProps) {
  const st = useRef({ lane: 1, obs: [] as { x: number; lane: number }[], dist: 0, over: false, spawn: 0 });
  const [dist, setDist] = useState(0);
  const [over, setOver] = useState(false);
  const goal = levelScale(level, 100, 1, 2000) ;

  const ref = useCanvasLoop((ctx, w, h, t) => {
    const s = st.current;
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#EAF7F1"); g.addColorStop(1, "#CDEBD9");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const laneY = (l: number) => (h / 3) * l + h / 6;
    ctx.strokeStyle = "rgba(43,27,63,.08)";
    for (let l = 1; l < 3; l++) { ctx.beginPath(); ctx.moveTo(0, (h / 3) * l); ctx.lineTo(w, (h / 3) * l); ctx.stroke(); }
    if (!s.over) {
      s.dist += 0.35; setDistThrottled(s.dist, setDist);
      if (t - s.spawn > 0.75) { s.spawn = t; s.obs.push({ x: w + 30, lane: rnd(3) }); }
      if (s.dist >= goal) { s.over = true; setOver(true); onWin(70); }
    }
    s.obs = s.obs.filter((o) => {
      if (!s.over) o.x -= 3.2;
      // humano
      ctx.fillStyle = "#7C4DFF";
      ctx.beginPath(); ctx.arc(o.x, laneY(o.lane) - 14, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(o.x - 8, laneY(o.lane) - 6, 16, 22);
      if (Math.abs(o.x - 50) < 18 && o.lane === s.lane && !s.over) { s.over = true; setOver(true); }
      return o.x > -40;
    });
    // ardilla
    const y = laneY(s.lane);
    ctx.fillStyle = "#C9743A";
    ctx.beginPath(); ctx.ellipse(50, y, 15, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(62, y - 8, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(32, y - 12 + Math.sin(t * 10) * 2, 7, 14, 0.4, 0, Math.PI * 2); ctx.fill();
  }, []);

  return (
    <div>
      <p className="text-center text-[12.5px] font-bold text-primary mb-2">Distancia: {Math.floor(dist)} / {goal} m</p>
      <canvas ref={ref} className="w-full aspect-[4/3] rounded-[16px] shadow-soft" />
      {over && <p className="mt-2 text-center text-[13.5px] font-bold text-primary">{dist >= goal ? "¡Escapaste! Nadie decide por ti." : "Te atraparon. Respira y vuelve a correr."}</p>}
      <Pad onDir={(_, dy) => { const s = st.current; if (!s.over) s.lane = Math.max(0, Math.min(2, s.lane + dy)); }} />
      <GameFooter />
    </div>
  );
}
let lastDist = 0;
function setDistThrottled(v: number, set: (n: number) => void) {
  if (Math.floor(v) !== lastDist) { lastDist = Math.floor(v); set(v); }
}

/* ---------------------------------------------------------- 10. Respira   */

function Breathe({ onWin, level }: GameProps) {
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const goal = levelScale(level, 4, 2, 24);
  useEffect(() => {
    const seq: { p: "in" | "hold" | "out"; ms: number }[] = [{ p: "in", ms: 4000 }, { p: "hold", ms: 4000 }, { p: "out", ms: 6000 }];
    let i = 0; let stop = false;
    const run = () => {
      if (stop) return;
      const s = seq[i % seq.length];
      setPhase(s.p);
      setTimeout(() => {
        if (stop) return;
        i++;
        if (i % seq.length === 0) {
          setCycle((c) => {
            const n = c + 1;
            if (n === goal) onWin(40);
            return n;
          });
        }
        run();
      }, s.ms);
    };
    run();
    return () => { stop = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const label = phase === "in" ? "Inhala" : phase === "hold" ? "Sostén" : "Exhala y suelta";
  const scale = phase === "in" ? 1 : phase === "hold" ? 1 : 0.72;
  const dur = phase === "in" ? 4 : phase === "hold" ? 4 : 6;
  return (
    <div className="text-center py-4">
      <div className="h-56 grid place-items-center">
        <div className="rounded-full bg-gradient-to-br from-primary/25 to-accent-pink/25 grid place-items-center"
          style={{ width: 190, height: 190, transform: `scale(${scale})`, transition: `transform ${dur}s ease-in-out` }}>
          <div className="rounded-full bg-gradient-to-br from-primary to-accent-pink w-24 h-24 grid place-items-center text-white font-display font-extrabold text-[14px] shadow-glow">
            {cycle}/{goal}
          </div>
        </div>
      </div>
      <p className="font-display font-extrabold text-[20px] mt-2">{label}</p>
      <p className="text-[13px] text-muted-foreground mt-1">Cuatro rondas y tu cuerpo entiende que ya estás a salvo.</p>
    </div>
  );
}

/* ---------------------------------------------------------- shell         */

function GameFooter({ hint }: { hint?: string }) {
  return (
    <div className="mt-4 flex items-center gap-3">
      <span className="text-[11.5px] text-muted-foreground">{hint ?? "Sin prisa: esto también es sanar."}</span>
    </div>
  );
}

type GameDef = {
  id: string;
  title: string;
  desc: string;
  gems: number;
  icon: React.ReactNode;
  tint: string;
  cover: string;
  render: (p: GameProps) => React.ReactNode;
};

const C = (p: string) => `https://i.ibb.co/${p}`;

const GAMES: GameDef[] = [
  { id: "sopa", title: "Encuentra la palabra", desc: "Sopa de letras de tu tema de hoy", gems: 60, tint: "from-[#7C4DFF] to-[#B18CFF]", cover: C("GQGKDcRy/file-00000000302c820c9bcc0ef622bbb95f.png"), icon: <Search className="w-6 h-6" />, render: (p) => <WordFind {...p} /> },
  { id: "memoria", title: "Memoria del alma", desc: "Empareja las palabras que te sostienen", gems: 60, tint: "from-[#F58BCB] to-[#FFB3DC]", cover: C("tMdjP53T/file-000000000968822fb55558196d3bfa85.png"), icon: <Brain className="w-6 h-6" />, render: (p) => <Memory {...p} /> },
  { id: "escribe", title: "Escríbelo y créelo", desc: "Escribe tu declaración completa", gems: 50, tint: "from-[#3FBE8F] to-[#7FE0BC]", cover: C("d4WZhL5y/file-000000005f9881f68651918204d94946.png"), icon: <PenLine className="w-6 h-6" />, render: (p) => <TypeIt {...p} /> },
  { id: "hojas", title: "Come-hojas", desc: "Recoge todas las hojas sin que te atrape la culpa", gems: 70, tint: "from-[#F7B955] to-[#FFD79A]", cover: C("5X90QnfG/file-00000000c560822fa9626d7a57de661f.png"), icon: <Ghost className="w-6 h-6" />, render: (p) => <LeafEater {...p} /> },
  { id: "bloques", title: "Ordena tu caos", desc: "Completa 3 líneas y ordena lo que pesa", gems: 70, tint: "from-[#4C86C6] to-[#9BC6F0]", cover: C("9HdTG5zJ/file-00000000241881f9a4ca43617619c673.png"), icon: <Blocks className="w-6 h-6" />, render: (p) => <TetrisLite {...p} /> },
  { id: "aros", title: "Aros de verdad", desc: "Adivina la palabra y coloca cada aro", gems: 60, tint: "from-[#7C4DFF] to-[#F58BCB]", cover: C("PsFpT5wj/file-000000008b4c820dbbb18f04e6dae500.png"), icon: <Circle className="w-6 h-6" />, render: (p) => <RingWord {...p} /> },
  { id: "globo", title: "Globo de afirmaciones", desc: "Pulsa y llénalo de palabras que sí son tuyas", gems: 50, tint: "from-[#F58BCB] to-[#F7B955]", cover: C("0y0rQjNR/file-00000000531881f6a38f2295738d74fb.png"), icon: <Wind className="w-6 h-6" />, render: (p) => <Balloon {...p} /> },
  { id: "pez", title: "Pez de sanación", desc: "Navega y atrapa solo lo que te hace bien", gems: 60, tint: "from-[#4C86C6] to-[#3FBE8F]", cover: C("8nnY77dN/file-00000000c7f881f78ffc3a13efd5225f.png"), icon: <Fish className="w-6 h-6" />, render: (p) => <HealingFish {...p} /> },
  { id: "ardilla", title: "Escapa del control", desc: "La ardilla corre y esquiva a quien la quiere atrapar", gems: 70, tint: "from-[#C9743A] to-[#F7B955]", cover: C("HLg6TJ48/file-00000000f1cc822fad2f6a5fe48a329e.png"), icon: <Rabbit className="w-6 h-6" />, render: (p) => <SquirrelRun {...p} /> },
  { id: "respira", title: "Respiración 4·4·6", desc: "Cuatro rondas para bajar el cuerpo a la calma", gems: 40, tint: "from-[#7FE0BC] to-[#BFE7FF]", cover: C("ycL9N1Rf/file-000000008488820c838483738952c2ee.png"), icon: <HeartPulse className="w-6 h-6" />, render: (p) => <Breathe {...p} /> },
];


/**
 * Centro de juegos del día: 10 juegos mentales adaptados al tema de la persona.
 */
export function DailyGames({
  words = [],
  title = "Juegos del día",
  subtitle = "Diez juegos mentales que trabajan justo lo que estás sanando.",
}: { words?: string[]; title?: string; subtitle?: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [wonToday, setWonToday] = useState<string[]>([]);
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [lastGranted, setLastGranted] = useState<Record<string, number>>({});
  const qc = useQueryClient();
  const game = GAMES.find((g) => g.id === openId) ?? null;

  useEffect(() => {
    const next: Record<string, number> = {};
    for (const g of GAMES) {
      const raw = Number(localStorage.getItem(`origen_game_level_${g.id}`) ?? "1");
      next[g.id] = Number.isFinite(raw) && raw >= 1 ? Math.min(raw, MAX_LEVEL) : 1;
    }
    setLevels(next);
  }, []);

  const pool = words.length ? words : POSITIVAS;

  const win = async (g: GameDef) => {
    if (wonToday.includes(g.id)) return;
    setWonToday((w) => [...w, g.id]);
    const r = await awardLeaf("juegos", "medium", g.title, { game: g.id, level: levels[g.id] ?? 1 });
    setLastGranted((m) => ({ ...m, [g.id]: r.granted }));
    qc.invalidateQueries({ queryKey: ["profile"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    if (r.granted > 0) toast.success(`+${(r.granted / HOJA_POINTS).toFixed(3)} hojas · ${g.title}`);
    else if (r.capped === "daily") toast.info("Ya llegaste a tu tope de hojas de hoy. Después de las 12:00 PM sigues sumando.");
    else toast.info("Tope de esta sección alcanzado hoy. Prueba otra sección de la app.");
  };

  const nextLevel = (g: GameDef) => {
    const lvl = Math.min(MAX_LEVEL, (levels[g.id] ?? 1) + 1);
    localStorage.setItem(`origen_game_level_${g.id}`, String(lvl));
    setLevels((m) => ({ ...m, [g.id]: lvl }));
    setWonToday((w) => w.filter((id) => id !== g.id));
  };


  return (
    <section>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 mb-2">
        <h3 className="font-display font-bold text-[15px] truncate">{title}</h3>
        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#F7B955]/18 px-2.5 py-1 text-[11px] font-bold text-[#B67C15]">
          <Trophy className="w-3.5 h-3.5" /> {wonToday.length}/10
        </span>
      </div>
      <div className="hairline-brand mb-3" />
      <p className="text-[13px] text-muted-foreground mb-3">{subtitle}</p>

      <div className="grid grid-cols-2 gap-3">
        {GAMES.map((g, i) => (
          <button key={g.id} onClick={() => setOpenId(g.id)} aria-label={`Jugar ${g.title}`}
            className="block w-full overflow-hidden rounded-[16px] border border-border/60 bg-card shadow-soft text-left active:scale-[.98] transition-transform"
            style={{ animation: `fade-in .35s ease-out ${i * 45}ms both` }}>
            <img src={g.cover} alt={g.title} loading="lazy" className="w-full h-auto block" />
            <span className="block px-3 py-2.5">
              <span className="block font-display font-bold text-[13.5px] leading-tight truncate">{g.title}</span>
              <span className="block text-[11.5px] text-muted-foreground leading-snug line-clamp-2">{g.desc}</span>
              <span className={cn("mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-bold",
                wonToday.includes(g.id) ? "text-[#2F9C74]" : "text-primary")}>
                {wonToday.includes(g.id)
                  ? <><Check className="w-3.5 h-3.5" /> Nivel {levels[g.id] ?? 1} logrado</>
                  : <><Leaf className="w-3.5 h-3.5" /> Nivel {levels[g.id] ?? 1} · suma hojas</>}
              </span>
            </span>
          </button>
        ))}

      </div>


      <Dialog open={!!game} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-[440px] max-h-[92dvh] overflow-y-auto rounded-[20px]">
          {game && (
            <>
              <DialogTitle className="flex items-center gap-3 text-left">
                <span className={cn("w-11 h-11 rounded-[12px] grid place-items-center text-white bg-gradient-to-br shrink-0", game.tint)}>
                  {game.icon}
                </span>
                <span className="min-w-0">
                  <span className="block font-display font-extrabold text-[17px] leading-tight">{game.title}</span>
                  <span className="block text-[12px] font-medium text-muted-foreground">{game.desc}</span>
                </span>
              </DialogTitle>
              <div className="mt-1" key={`${game.id}-${levels[game.id] ?? 1}`}>
                {game.render({ words: pool, onWin: () => win(game), level: levels[game.id] ?? 1 })}
              </div>
              {wonToday.includes(game.id) && (
                <div className="mt-3 rounded-[12px] bg-[#3FBE8F]/12 px-3 py-2.5">
                  <p className="text-[13px] font-bold text-[#2F9C74] flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {(lastGranted[game.id] ?? 0) > 0
                      ? `Sumaste ${((lastGranted[game.id] ?? 0) / HOJA_POINTS).toFixed(3)} hojas de sanación.`
                      : "Hoy ya llegaste a tu tope de hojas. El nivel igual queda guardado."}
                  </p>
                  <button
                    onClick={() => nextLevel(game)}
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground active:scale-95 transition"
                  >
                    Nivel {Math.min(MAX_LEVEL, (levels[game.id] ?? 1) + 1)} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

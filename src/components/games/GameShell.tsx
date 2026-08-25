import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Leaf, Pause, Play, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/use-profile";
import { TOTAL_LEVELS } from "@/lib/game-progress";

/**
 * Shell de pantalla completa para las prácticas jugables de ORÍGEN.
 * Regla: 3D solo donde aporta a la mecánica; toda la interfaz (nombre, hojas,
 * instrucción, nivel, ronda, opciones, controles) es UI 2D limpia y táctil.
 */

export type DpadHandler = (x: number, y: number) => void;

export function GameShell({
  title,
  cue,
  progress,
  level,
  round,
  roundsInLevel,
  levelUp,
  dpad,
  onPauseChange,
  won,
  wonText,
  onNext,
  onClose,
  footer,
  children,
}: {
  title: string;
  cue: string;
  progress?: { value: number; max: number };
  level?: number;
  round?: number;
  roundsInLevel?: number;
  levelUp?: boolean;
  dpad?: DpadHandler;
  onPauseChange?: (paused: boolean) => void;
  won?: boolean;
  wonText?: string;
  onNext?: () => void;
  onClose?: () => void;
  /** Zona de interfaz 2D (opciones, tarjetas de palabras, botón de acción). */
  footer?: ReactNode;
  children: ReactNode;
}) {
  const [demo, setDemo] = useState(true);
  const [paused, setPaused] = useState(false);
  const advanced = useRef(false);
  const { data: profile } = useProfile();
  const name = profile?.display_name || profile?.full_name?.split(" ")[0] || "Tú";
  const hojas = profile?.gems ?? 0;
  const [gain, setGain] = useState(0);
  const prevHojas = useRef<number | null>(null);

  useEffect(() => {
    if (prevHojas.current !== null && hojas > prevHojas.current) {
      setGain(hojas - prevHojas.current);
      const t = setTimeout(() => setGain(0), 1400);
      prevHojas.current = hojas;
      return () => clearTimeout(t);
    }
    prevHojas.current = hojas;
  }, [hojas]);

  useEffect(() => {
    const t = setTimeout(() => setDemo(false), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    onPauseChange?.(paused || demo || !!levelUp);
  }, [paused, demo, levelUp, onPauseChange]);

  useEffect(() => {
    if (!won || advanced.current) return;
    advanced.current = true;
    const t = setTimeout(() => onNext?.(), 1800);
    return () => clearTimeout(t);
  }, [won, onNext]);

  const pct = progress ? Math.min(100, (progress.value / Math.max(1, progress.max)) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#151034] touch-none select-none">
      {/* HUD — identidad del jugador (datos reales) */}
      <div className="relative z-20 flex items-center gap-2 px-4 pb-2 pt-[max(12px,env(safe-area-inset-top))]">
        <span className="inline-flex min-w-0 items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 backdrop-blur-md">
          <User className="h-4 w-4 shrink-0 text-white/80" />
          <span className="truncate text-[13px] font-bold text-white">{name}</span>
        </span>
        <span className="relative inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 backdrop-blur-md">
          <Leaf className="h-4 w-4 text-[#7BE0A8]" />
          <span className="text-[13px] font-black text-white">{hojas}</span>
          {gain > 0 && (
            <span
              className="pointer-events-none absolute -top-5 right-2 text-[13px] font-black text-[#7BE0A8]"
              style={{ animation: "fade-in .3s ease-out both" }}
            >
              +{gain}
            </span>
          )}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-2">
          <button
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Reanudar" : "Pausar"}
            className="grid h-11 w-11 place-items-center rounded-full bg-white/12 text-white backdrop-blur-md active:scale-95"
          >
            {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Salir del juego"
              className="grid h-11 w-11 place-items-center rounded-full bg-white/12 text-white backdrop-blur-md active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </span>
      </div>

      {/* Nivel y ronda */}
      {level && (
        <div className="relative z-20 flex items-center justify-center gap-2 px-4 pb-1">
          {Array.from({ length: TOTAL_LEVELS }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest",
                i + 1 < level
                  ? "bg-[#7BE0A8]/25 text-[#7BE0A8]"
                  : i + 1 === level
                    ? "bg-white text-[#241539]"
                    : "bg-white/10 text-white/45",
              )}
            >
              Nivel {i + 1}
            </span>
          ))}
        </div>
      )}

      {/* Instrucción + progreso */}
      <div className="relative z-20 px-4 pb-3 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
          {title}
          {round && roundsInLevel ? ` · Ronda ${round} de ${roundsInLevel}` : ""}
        </p>
        <p className="mt-1 font-display text-[19px] font-black leading-tight text-white">{cue}</p>
        {progress && (
          <div className="mx-auto mt-3 flex max-w-[320px] items-center gap-2">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-[#7BE0A8] transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[12px] font-black text-white/85">
              {progress.value}/{progress.max}
            </span>
          </div>
        )}
      </div>

      {/* Escena (3D solo donde aporta) */}
      <div className="relative min-h-0 flex-1">{children}</div>

      {/* Interfaz 2D del juego */}
      {footer && !won && (
        <div className="relative z-20 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">{footer}</div>
      )}

      {/* Control direccional grande */}
      {dpad && !won && (
        <div className="relative z-20 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-1">
          <div className="mx-auto grid w-[210px] grid-cols-3 gap-2.5">
            {[
              null,
              { l: "▲", a: () => dpad(0, -1) },
              null,
              { l: "◀", a: () => dpad(-1, 0) },
              { l: "stop", a: () => dpad(0, 0) },
              { l: "▶", a: () => dpad(1, 0) },
              null,
              { l: "▼", a: () => dpad(0, 1) },
              null,
            ].map((b, i) =>
              b ? (
                <button
                  key={i}
                  onPointerDown={b.a}
                  aria-label={b.l === "stop" ? "Pausar o reanudar" : `Mover ${b.l}`}
                  className={cn(
                    "grid h-[58px] place-items-center rounded-[16px] text-[20px] font-black text-white backdrop-blur-md active:scale-95",
                    b.l === "stop" ? "bg-white/25" : "bg-white/15",
                  )}
                >
                  {b.l === "stop" ? (paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />) : b.l}
                </button>
              ) : (
                <span key={i} />
              ),
            )}
          </div>
        </div>
      )}

      {/* Demostración corta */}
      {demo && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-[#151034]/70 backdrop-blur-[2px]">
          <div className="px-8 text-center" style={{ animation: "fade-in .3s ease-out both" }}>
            <p className="font-display text-[26px] font-black leading-tight text-white">{cue}</p>
            <p className="mt-2 text-[13px] font-bold uppercase tracking-widest text-white/60">Ahora tú</p>
          </div>
        </div>
      )}

      {/* Nivel superado */}
      {levelUp && !won && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-[#151034]/70 backdrop-blur-[2px]">
          <div className="px-8 text-center" style={{ animation: "scale-in .35s ease-out both" }}>
            <p className="text-[13px] font-bold uppercase tracking-widest text-[#7BE0A8]">Nivel superado</p>
            <p className="mt-1 font-display text-[30px] font-black leading-tight text-white">Nivel {level}</p>
            <p className="mt-2 text-[13.5px] text-white/75">Sube un poco la dificultad. Presta atención.</p>
          </div>
        </div>
      )}

      {/* Pausa */}
      {paused && !won && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-[#151034]/75">
          <button
            onClick={() => setPaused(false)}
            className="inline-flex h-14 items-center gap-2 rounded-full bg-white px-7 text-[16px] font-black text-[#241539] active:scale-95"
          >
            <Play className="h-5 w-5" /> Reanudar
          </button>
        </div>
      )}

      {/* Victoria (los 3 niveles) */}
      {won && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-[#151034]/80">
          <div className="px-8 text-center" style={{ animation: "fade-in .3s ease-out both" }}>
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#7BE0A8]/20">
              <Leaf className="h-8 w-8 text-[#7BE0A8]" />
            </span>
            <p className="mt-3 font-display text-[28px] font-black text-white">Juego completado</p>
            <p className="mt-1 text-[12px] font-bold uppercase tracking-widest text-white/55">Niveles 1 · 2 · 3</p>
            {wonText && <p className="mx-auto mt-2 max-w-[300px] text-[13.5px] text-white/80">{wonText}</p>}
            <button
              onClick={onNext}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-black text-[#241539] active:scale-95"
            >
              Siguiente paso <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameShell;

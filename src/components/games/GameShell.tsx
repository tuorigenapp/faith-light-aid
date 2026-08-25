import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Pause, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shell de pantalla completa para los juegos 3D de las prácticas diarias.
 * - 100dvh real, sin scroll, sin tarjeta pequeña.
 * - HUD mínimo y discreto (no tapa el juego).
 * - Demostración de 1–2 s con instrucción cortísima (accesible sin leer mucho).
 * - Control direccional con botón central de PAUSA/REANUDAR (sin reiniciar).
 * - Al ganar: "¡Listo!" y paso automático al siguiente juego.
 */

export type DpadHandler = (x: number, y: number) => void;

export function GameShell({
  title,
  cue,
  progress,
  dpad,
  onPauseChange,
  won,
  wonText,
  onNext,
  onClose,
  children,
}: {
  title: string;
  cue: string;
  progress?: { value: number; max: number };
  dpad?: DpadHandler;
  onPauseChange?: (paused: boolean) => void;
  won?: boolean;
  wonText?: string;
  onNext?: () => void;
  onClose?: () => void;
  children: ReactNode;
}) {
  const [demo, setDemo] = useState(true);
  const [paused, setPaused] = useState(false);
  const advanced = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setDemo(false), 1800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    onPauseChange?.(paused || demo);
  }, [paused, demo, onPauseChange]);

  useEffect(() => {
    if (!won || advanced.current) return;
    advanced.current = true;
    const t = setTimeout(() => onNext?.(), 1500);
    return () => clearTimeout(t);
  }, [won, onNext]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#120A22] touch-none select-none">
      {/* Mundo 3D a pantalla completa */}
      <div className="absolute inset-0">{children}</div>

      {/* HUD superior discreto */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 pt-[max(12px,env(safe-area-inset-top))]">
        <span className="rounded-full bg-black/35 px-3 py-1.5 text-[12px] font-bold text-white/90 backdrop-blur-sm">
          {title}
        </span>
        {progress && (
          <span className="rounded-full bg-black/35 px-3 py-1.5 text-[12px] font-black text-white backdrop-blur-sm">
            {progress.value}/{progress.max}
          </span>
        )}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Salir del juego"
            className="pointer-events-auto grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black/35 text-white/90 backdrop-blur-sm active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Instrucción cortísima permanente */}
      <p className="pointer-events-none absolute inset-x-0 top-16 text-center text-[15px] font-black tracking-wide text-white/85 drop-shadow">
        {cue}
      </p>

      {/* Demostración inicial */}
      {demo && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/45 backdrop-blur-[2px]">
          <div className="text-center" style={{ animation: "fade-in .3s ease-out both" }}>
            <p className="text-[42px] leading-none" style={{ animation: "pulse 1s ease-in-out infinite" }}>
              👆
            </p>
            <p className="mt-3 font-display text-[26px] font-black text-white">{cue}</p>
            <p className="mt-2 text-[13px] font-bold uppercase tracking-widest text-white/70">Ahora tú</p>
          </div>
        </div>
      )}

      {/* Pausa */}
      {paused && !won && (
        <div className="absolute inset-0 grid place-items-center bg-black/55">
          <button
            onClick={() => setPaused(false)}
            className="inline-flex h-14 items-center gap-2 rounded-full bg-white px-7 text-[16px] font-black text-[#241539] active:scale-95"
          >
            <Play className="h-5 w-5" /> Reanudar
          </button>
        </div>
      )}

      {/* Victoria + siguiente automático */}
      {won && (
        <div className="absolute inset-0 grid place-items-center bg-black/55">
          <div className="text-center" style={{ animation: "fade-in .3s ease-out both" }}>
            <p className="text-[52px] leading-none">✨</p>
            <p className="mt-2 font-display text-[28px] font-black text-white">¡Listo!</p>
            {wonText && <p className="mx-auto mt-2 max-w-[300px] text-[13.5px] text-white/80">{wonText}</p>}
            <button
              onClick={onNext}
              className="mt-5 inline-flex h-13 items-center gap-2 rounded-full bg-white px-7 py-3 text-[15px] font-black text-[#241539] active:scale-95"
            >
              Siguiente <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Control direccional: centro = pausa/reanudar */}
      {dpad && !won && (
        <div className="absolute inset-x-0 bottom-0 p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          <div className="mx-auto grid w-[190px] grid-cols-3 gap-2 opacity-90">
            {[
              null,
              { l: "▲", a: () => dpad(0, -1) },
              null,
              { l: "◀", a: () => dpad(-1, 0) },
              { l: "pause", a: () => setPaused((p) => !p) },
              { l: "▶", a: () => dpad(1, 0) },
              null,
              { l: "▼", a: () => dpad(0, 1) },
              null,
            ].map((b, i) =>
              b ? (
                <button
                  key={i}
                  onPointerDown={b.a}
                  aria-label={b.l === "pause" ? "Pausar o reanudar" : `Mover ${b.l}`}
                  className={cn(
                    "grid h-14 place-items-center rounded-[14px] text-[18px] font-black text-white backdrop-blur-sm active:scale-95",
                    b.l === "pause" ? "bg-white/25" : "bg-black/35",
                  )}
                >
                  {b.l === "pause" ? paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" /> : b.l}
                </button>
              ) : (
                <span key={i} />
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GameShell;

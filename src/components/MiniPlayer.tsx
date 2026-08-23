import { useState } from "react";
import { ChevronDown, Headphones, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { fmtTime, usePlayer } from "@/lib/player";

/** Barra de reproducción persistente + pantalla completa estilo Spotify. */
export function MiniPlayer() {
  const { current, isPlaying, position, duration, toggle, next, prev, seek, close } = usePlayer();
  const [full, setFull] = useState(false);

  if (!current) return null;

  const pct = duration > 0 ? (position / duration) * 100 : 0;

  if (full) {
    return (
      <div className="fixed inset-0 z-[70] flex flex-col bg-[oklch(0.22_0.03_285)] px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-4 text-white">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <button
            onClick={() => setFull(false)}
            aria-label="Minimizar reproductor"
            className="grid h-11 w-11 place-items-center rounded-full bg-white/10"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
          <p className="truncate text-center text-[12px] font-bold uppercase tracking-widest opacity-70">
            Visualízalo y Vívelo
          </p>
          <button
            onClick={close}
            aria-label="Cerrar reproductor"
            className="grid h-11 w-11 place-items-center rounded-full bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 grid place-items-center">
          {current.cover ? (
            <img
              src={current.cover}
              alt=""
              className="aspect-square w-full max-w-[320px] rounded-[16px] object-cover shadow-[0_24px_60px_rgba(0,0,0,.45)]"
            />
          ) : (
            <div className="grid aspect-square w-full max-w-[320px] place-items-center rounded-[16px] bg-white/10">
              <Headphones className="h-16 w-16 opacity-70" />
            </div>
          )}
        </div>

        <div className="mt-8">
          <h2 className="font-display text-[24px] font-extrabold leading-tight">{current.title}</h2>
          {current.subtitle && <p className="mt-1 text-[14px] opacity-70">{current.subtitle}</p>}
        </div>

        <div className="mt-6">
          <input
            type="range"
            min={0}
            max={Math.max(duration, 1)}
            value={position}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Avanzar el audio"
            className="h-1.5 w-full accent-[#F58BCB]"
          />
          <div className="mt-1 flex justify-between text-[11.5px] opacity-70">
            <span>{fmtTime(position)}</span>
            <span>{fmtTime(duration)}</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6">
          <button onClick={prev} aria-label="Anterior" className="grid h-12 w-12 place-items-center rounded-full bg-white/10">
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            onClick={toggle}
            aria-label={isPlaying ? "Pausar" : "Reproducir"}
            className="grid h-16 w-16 place-items-center rounded-full bg-white text-[oklch(0.22_0.03_285)]"
          >
            {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7" />}
          </button>
          <button onClick={next} aria-label="Siguiente" className="grid h-12 w-12 place-items-center rounded-full bg-white/10">
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-6 text-center text-[12px] leading-relaxed opacity-60">
          Puedes salir de la app: el audio sigue sonando en segundo plano.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-[55] px-3 lg:bottom-4 lg:left-auto lg:right-4 lg:w-[360px] lg:px-0">
      <div className="overflow-hidden rounded-[16px] border border-border bg-card shadow-elev">
        <div className="h-[3px] w-full bg-primary/12">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-2.5">
          <button onClick={() => setFull(true)} aria-label="Abrir reproductor" className="shrink-0">
            {current.cover ? (
              <img src={current.cover} alt="" className="h-11 w-11 rounded-[10px] object-cover" />
            ) : (
              <span className="grid h-11 w-11 place-items-center rounded-[10px] bg-primary/10 text-primary">
                <Headphones className="h-5 w-5" />
              </span>
            )}
          </button>
          <button onClick={() => setFull(true)} className="min-w-0 text-left">
            <p className="truncate text-[13.5px] font-bold leading-tight">{current.title}</p>
            <p className="truncate text-[11.5px] text-muted-foreground">
              {current.subtitle ?? "Manifestación guiada"} · {fmtTime(position)}
            </p>
          </button>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={toggle}
              aria-label={isPlaying ? "Pausar" : "Reproducir"}
              className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground"
            >
              {isPlaying ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5" />}
            </button>
            <button
              onClick={close}
              aria-label="Cerrar reproductor"
              className="grid h-11 w-9 place-items-center text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

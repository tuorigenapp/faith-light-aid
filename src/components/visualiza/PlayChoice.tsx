import { BookOpen, Headphones, X } from "lucide-react";

/** Two ways to open a playlist audio: full lesson page, or just listen in the floating player. */
export function PlayChoice({ title, onLesson, onListen, onClose }: { title: string; onLesson: () => void; onListen: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-foreground/40 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label="Cómo quieres abrir este audio" onClick={onClose}>
      <div className="w-full max-w-md rounded-[20px] bg-card p-5 shadow-[0_8px_30px_rgba(30,25,20,.18)] motion-safe:animate-in motion-safe:slide-in-from-bottom-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">¿Cómo quieres abrirlo?</p>
            <h3 className="mt-1 font-display text-[18px] font-bold leading-tight">{title}</h3>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 grid gap-3">
          <button onClick={onLesson} className="flex min-h-16 items-center gap-3 rounded-[14px] border-2 border-primary bg-primary/10 p-3 text-left active:scale-[.97]">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-primary text-primary-foreground"><BookOpen className="h-5 w-5" /></span>
            <span><span className="block text-[15px] font-bold">Ver la lección de este audio</span><span className="block text-[13px] text-muted-foreground">Escucha, lee las instrucciones, descarga el PDF y juega.</span></span>
          </button>
          <button onClick={onListen} className="flex min-h-16 items-center gap-3 rounded-[14px] border border-border bg-background p-3 text-left active:scale-[.97]">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-primary/10 text-primary"><Headphones className="h-5 w-5" /></span>
            <span><span className="block text-[15px] font-bold">Solo escuchar</span><span className="block text-[13px] text-muted-foreground">Suena en el reproductor y sigue aunque salgas de la app o bloquees el teléfono.</span></span>
          </button>
        </div>
      </div>
    </div>
  );
}

/** Total rows every playlist shows; missing days render as blurred "Próximamente" rows. */
export const PLAYLIST_SLOTS = 21;

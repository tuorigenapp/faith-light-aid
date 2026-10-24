import { BookOpen, Headphones, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Two ways to open a playlist audio: full lesson page, or just listen in the floating player. */
export function PlayChoice({ title, onLesson, onListen, onClose, canListen = true }: { title: string; onLesson: () => void; onListen: () => void; onClose: () => void; canListen?: boolean }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-foreground/40 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label="Cómo quieres abrir este audio" onClick={onClose}>
      <div className="w-full max-w-md rounded-[20px] bg-card p-5 shadow-[0_8px_30px_rgba(30,25,20,.18)] motion-safe:animate-in motion-safe:slide-in-from-bottom-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">¿Cómo quieres abrirlo?</p>
            <h3 className="mt-1 font-display text-[18px] font-bold leading-tight">{title}</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar" className="h-11 w-11 shrink-0 rounded-full bg-muted"><X className="h-5 w-5" /></Button>
        </div>
        <div className="mt-4 grid gap-3">
          <Button variant="outline" onClick={onLesson} className="h-auto min-h-16 justify-start gap-3 whitespace-normal rounded-[14px] border-2 border-primary bg-primary/10 p-3 text-left active:scale-[.97]">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-primary text-primary-foreground"><BookOpen className="h-5 w-5" /></span>
            <span><span className="block text-[15px] font-bold">Ver la lección de este audio</span><span className="block text-[13px] text-muted-foreground">Escucha, lee las instrucciones, descarga el PDF y juega.</span></span>
          </Button>
          <Button variant="outline" disabled={!canListen} onClick={onListen} className={cn("h-auto min-h-16 justify-start gap-3 whitespace-normal rounded-[14px] border p-3 text-left active:scale-[.97]", canListen ? "border-primary/40 bg-primary/5" : "border-border bg-muted text-muted-foreground grayscale disabled:opacity-70")}>
            <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-[12px]", canListen ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}><Headphones className="h-5 w-5" /></span>
            <span><span className="block text-[15px] font-bold">Solo escuchar</span><span className="block text-[13px] text-muted-foreground">{canListen ? "Escucha en el reproductor. La reproducción en segundo plano depende de tu dispositivo." : "Audio aún no disponible."}</span></span>
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Total rows every playlist shows; missing days render as blurred "Próximamente" rows. */
export const PLAYLIST_SLOTS = 21;

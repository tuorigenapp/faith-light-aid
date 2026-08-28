import { Volume2, VolumeX, Ear } from "lucide-react";
import { useVoice } from "@/lib/voice";
import { cn } from "@/lib/utils";

/** Botón "Escuchar": lee el texto en voz alta con la voz del dispositivo. */
export function SpeakButton({ text, label = "Escuchar", className }: { text: string; label?: string; className?: string }) {
  const voice = useVoice();
  if (!voice.available) return null;
  return (
    <button
      type="button"
      onClick={() => (voice.speaking ? voice.stop() : voice.speakNow(text))}
      aria-label={voice.speaking ? "Detener la lectura en voz alta" : `${label} la instrucción en voz alta`}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full bg-primary/10 px-4 text-[13px] font-bold text-primary transition active:scale-[.97]",
        className,
      )}
    >
      {voice.speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      {voice.speaking ? "Detener" : label}
    </button>
  );
}

/** Interruptor discreto del modo voz (accesibilidad, opcional). */
export function VoiceToggle({ className }: { className?: string }) {
  const voice = useVoice();
  if (!voice.available) return null;
  return (
    <button
      type="button"
      onClick={voice.toggle}
      aria-pressed={voice.enabled}
      aria-label={voice.enabled ? "Desactivar modo voz" : "Activar modo voz para escuchar las instrucciones"}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[12.5px] font-bold transition active:scale-[.97]",
        voice.enabled ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-foreground/70",
        className,
      )}
    >
      <Ear className="h-4 w-4" />
      {voice.enabled ? "Modo voz activo" : "Modo voz"}
    </button>
  );
}

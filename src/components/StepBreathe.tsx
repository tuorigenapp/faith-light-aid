import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { VoiceAnswer } from "@/components/VoiceAnswer";
import { useVoice } from "@/lib/voice";
import { cn } from "@/lib/utils";
import guia from "@/assets/respiracion-guia.jpg";

/**
 * Ejercicio guiado de respiración 4·4·6 con acompañamiento de voz.
 * El botón Continuar solo se abre cuando la persona completa las 3 rondas.
 */

const ROUNDS = 3;
const PHASES = [
  { key: "prep", label: "Etapa 1 · Preparación", cue: "Siéntate con la espalda apoyada y suelta los hombros.", ms: 4000, scale: 0.9 },
  { key: "in", label: "Etapa 2 · Inhala", cue: "Inhala por la nariz contando 4.", ms: 4000, scale: 1 },
  { key: "hold", label: "Etapa 2 · Sostén", cue: "Sostén el aire 4, sin apretar.", ms: 4000, scale: 1 },
  { key: "out", label: "Etapa 3 · Exhala", cue: "Exhala despacio contando 6 y suelta.", ms: 6000, scale: 0.72 },
] as const;

export function StepBreathe({ onNext }: { onNext: () => void }) {
  const voice = useVoice();
  const [running, setRunning] = useState(false);
  const [i, setI] = useState(0);
  const [round, setRound] = useState(0);
  const [left, setLeft] = useState(PHASES[0].ms / 1000);
  const [done, setDone] = useState(false);
  const [text, setText] = useState("");
  const spoken = useRef("");

  const phase = PHASES[i % PHASES.length];

  useEffect(() => {
    if (!running || done) return;
    if (spoken.current !== `${round}-${i}`) {
      spoken.current = `${round}-${i}`;
      try {
        voice.speakNow(phase.cue);
      } catch {
        /* sin voz en este dispositivo */
      }
    }
    setLeft(phase.ms / 1000);
    const tick = window.setInterval(() => setLeft((v) => Math.max(0, v - 0.1)), 100);
    const t = window.setTimeout(() => {
      const nextI = i + 1;
      if (nextI % PHASES.length === 0) {
        const r = round + 1;
        setRound(r);
        if (r >= ROUNDS) {
          setDone(true);
          setRunning(false);
          try {
            voice.speakNow("Terminaste. Quédate un momento así, en calma.");
          } catch {
            /* ignorar */
          }
          return;
        }
      }
      setI(nextI);
    }, phase.ms);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, done, i, round]);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[16px] border border-border bg-card shadow-soft">
        <img
          src={guia}
          alt="Una guía acompañando a una mujer que respira en calma"
          width={1024}
          height={768}
          loading="lazy"
          className="h-44 w-full object-cover"
        />
        <div className="p-5">
          <div className="text-[11px] font-bold uppercase tracking-widest text-primary">
            Respira antes de cerrar
          </div>
          <h3 className="mt-1 font-display text-[19px] font-bold leading-tight">
            Respiración guiada 4 · 4 · 6
          </h3>
          <p className="mt-2 text-[14px] leading-snug text-muted-foreground">
            Tres rondas acompañadas paso a paso: preparación, inhalar y exhalar. Yo te voy diciendo
            qué hacer; tú solo sigue el ritmo.
          </p>
        </div>
      </div>

      <div className="rounded-[16px] border border-border bg-card p-5 text-center shadow-soft">
        <div className="grid h-52 place-items-center">
          <div
            className="grid place-items-center rounded-full bg-gradient-to-br from-primary/25 to-accent-pink/25"
            style={{
              width: 180,
              height: 180,
              transform: `scale(${done ? 0.85 : running ? phase.scale : 0.85})`,
              transition: `transform ${running ? phase.ms / 1000 : 0.4}s ease-in-out`,
            }}
          >
            <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-primary to-accent-pink font-display text-[15px] font-extrabold text-white">
              {Math.min(round, ROUNDS)}/{ROUNDS}
            </div>
          </div>
        </div>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-primary">
          {done ? "Ejercicio completo" : running ? phase.label : "Cuando estés lista"}
        </p>
        <p className="mt-1 font-display text-[19px] font-extrabold leading-tight">
          {done ? "Tu cuerpo bajó a la calma" : running ? phase.cue : "Toca empezar y respira conmigo"}
        </p>
        {running && (
          <p className="mt-1 text-[13px] text-muted-foreground">{left.toFixed(1)} s</p>
        )}
        <div className="mx-auto mt-3 flex max-w-[240px] gap-1.5">
          {Array.from({ length: ROUNDS }).map((_, k) => (
            <span
              key={k}
              className={cn("h-1.5 flex-1 rounded-full", k < round ? "bg-primary" : "bg-primary/15")}
            />
          ))}
        </div>
        {!done && (
          <button
            onClick={() => setRunning((r) => !r)}
            className="mt-4 min-h-[52px] w-full rounded-[12px] bg-primary px-5 text-[15px] font-bold text-primary-foreground transition active:scale-[.97]"
          >
            {running ? "Pausar" : round > 0 ? "Seguir respirando" : "Empezar la respiración"}
          </button>
        )}
      </div>

      <div className="rounded-[16px] border border-border bg-card p-4 shadow-soft">
        <p className="text-[14px] font-bold">¿Cómo te sientes? (opcional)</p>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 1000))}
          placeholder="Puedes escribirlo o decirlo en voz alta…"
          className="mt-2.5 min-h-[100px] rounded-[10px] text-[13.5px]"
        />
        <div className="mt-1 text-right text-[11px] text-muted-foreground">{text.length}/1000</div>
        <VoiceAnswer
          className="mt-2"
          question="¿Cómo te sientes después de respirar?"
          value={text}
          onChange={setText}
        />
      </div>

      <button
        onClick={onNext}
        disabled={!done}
        className={cn(
          "min-h-[56px] w-full rounded-[12px] text-[16px] font-bold transition active:scale-[.97]",
          done
            ? "bg-gradient-to-r from-accent-pink to-primary text-white shadow-soft"
            : "bg-secondary text-muted-foreground",
        )}
      >
        {done ? "Continuar" : "Termina las 3 respiraciones para continuar"}
      </button>
    </div>
  );
}

export default StepBreathe;

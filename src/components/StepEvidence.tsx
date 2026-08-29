import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Mic, Square, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AnswerFeedback } from "@/components/AnswerFeedback";
import { SpeakButton } from "@/components/VoiceControls";
import { validateStepEvidence, transcribeVoiceNote } from "@/lib/step-ai.functions";
import { cn } from "@/lib/utils";

/**
 * Bloque de evidencia de una actividad: escribir, hablar o subir la foto de la
 * hoja. La mentora (IA) revisa el contenido y da feedback en el momento.
 * El borrador se guarda en el dispositivo: si sales, al volver sigue ahí.
 */

const DRAFT = "origen:evidencia:";

function encodeWav(chunks: Float32Array[], sampleRate: number): Blob {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const target = 16000;
  const ratio = Math.max(1, Math.round(sampleRate / target));
  const outLen = Math.floor(total / ratio);
  const buf = new ArrayBuffer(44 + outLen * 2);
  const view = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  view.setUint32(4, 36 + outLen * 2, true);
  str(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, Math.round(sampleRate / ratio), true);
  view.setUint32(28, Math.round(sampleRate / ratio) * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, outLen * 2, true);
  let i = 0;
  let w = 44;
  const flat = new Float32Array(total);
  let p = 0;
  for (const c of chunks) {
    flat.set(c, p);
    p += c.length;
  }
  while (i < outLen) {
    const s = Math.max(-1, Math.min(1, flat[i * ratio] ?? 0));
    view.setInt16(w, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    w += 2;
    i += 1;
  }
  return new Blob([buf], { type: "audio/wav" });
}

async function toBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(bin);
}

export function StepEvidence({
  draftKey,
  instruction,
  theme,
  minChars = 5,
  onValid,
  className,
}: {
  /** Clave única de la actividad (para guardar el borrador). */
  draftKey: string;
  instruction: string;
  theme?: string;
  minChars?: number;
  /** Se llama con el texto cuando la mentora aprueba la evidencia. */
  onValid: (text: string) => void;
  className?: string;
}) {
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState<"revisar" | "transcribir" | null>(null);
  const [rec, setRec] = useState(false);
  const [state, setState] = useState<"ok" | "fail" | null>(null);
  const [msg, setMsg] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);
  const audio = useRef<{ ctx: AudioContext; node: ScriptProcessorNode; stream: MediaStream; chunks: Float32Array[] } | null>(null);

  useEffect(() => {
    try {
      setText(window.localStorage.getItem(DRAFT + draftKey) ?? "");
    } catch {
      /* sin almacenamiento */
    }
  }, [draftKey]);

  function change(v: string) {
    setText(v);
    try {
      window.localStorage.setItem(DRAFT + draftKey, v);
    } catch {
      /* ignorar */
    }
  }

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const node = ctx.createScriptProcessor(4096, 1, 1);
      const chunks: Float32Array[] = [];
      node.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      src.connect(node);
      node.connect(ctx.destination);
      audio.current = { ctx, node, stream, chunks };
      setRec(true);
    } catch {
      setState("fail");
      setMsg("No pudimos usar el micrófono. Escribe tu respuesta o sube la foto.");
    }
  }

  async function stopRec() {
    const a = audio.current;
    audio.current = null;
    setRec(false);
    if (!a) return;
    a.stream.getTracks().forEach((t) => t.stop());
    a.node.disconnect();
    const rate = a.ctx.sampleRate;
    await a.ctx.close().catch(() => {});
    const blob = encodeWav(a.chunks, rate);
    if (blob.size < 4000) {
      setState("fail");
      setMsg("No escuché nada. Acércate al micrófono e inténtalo otra vez.");
      return;
    }
    setBusy("transcribir");
    try {
      const { text: t } = await transcribeVoiceNote({ data: { audio: await toBase64(blob) } });
      if (t) change(text ? `${text} ${t}` : t);
      else {
        setState("fail");
        setMsg("No entendí la nota de voz. Prueba de nuevo, más despacio.");
      }
    } catch {
      setState("fail");
      setMsg("No pudimos escuchar tu nota ahora mismo. Escríbela y continúa.");
    } finally {
      setBusy(null);
    }
  }

  function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 6 * 1024 * 1024) {
      setState("fail");
      setMsg("La foto pesa demasiado. Tómala de nuevo con menos calidad.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(f);
  }

  async function review() {
    if (!text.trim() && !photo) {
      setState("fail");
      setMsg("Escribe, habla o sube la foto de tu hoja para continuar.");
      return;
    }
    setBusy("revisar");
    try {
      const v = await validateStepEvidence({
        data: { instruction, theme, text: text.trim() || undefined, image: photo ?? undefined },
      });
      setState(v.ok ? "ok" : "fail");
      setMsg(v.feedback);
      if (v.ok) {
        try {
          window.localStorage.removeItem(DRAFT + draftKey);
        } catch {
          /* ignorar */
        }
        onValid(text.trim() || "Evidencia enviada como foto");
      }
    } catch {
      // Si la IA no está disponible, no bloqueamos el camino de la persona.
      if (text.trim().length >= minChars || photo) {
        setState("ok");
        setMsg("Guardé tu registro. Seguimos avanzando.");
        onValid(text.trim() || "Evidencia enviada como foto");
      } else {
        setState("fail");
        setMsg("No pudimos revisarlo ahora. Escribe un poco más e inténtalo otra vez.");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <SpeakButton text={instruction} />

      <Textarea
        value={text}
        onChange={(e) => change(e.target.value.slice(0, 600))}
        placeholder="Escribe con tus palabras lo que hiciste hoy…"
        className="min-h-[110px] rounded-[10px] text-[13.5px]"
      />
      <div className="-mt-2 text-right text-[11px] text-muted-foreground">{text.length}/600</div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={rec ? stopRec : startRec}
          disabled={busy !== null}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-[10px] px-4 text-[12.5px] font-bold transition active:scale-[.97]",
            rec ? "bg-destructive text-white" : "bg-primary/10 text-primary",
          )}
        >
          {rec ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {rec ? "Detener y transcribir" : "Hablar mi respuesta"}
        </button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy !== null}
          className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-primary/10 px-4 text-[12.5px] font-bold text-primary transition active:scale-[.97]"
        >
          <Camera className="h-4 w-4" />
          {photo ? "Cambiar foto" : "Foto de mi hoja"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={pickPhoto} className="hidden" />
      </div>

      {photo && (
        <div className="relative overflow-hidden rounded-[12px] border border-border">
          <img src={photo} alt="Foto de tu hoja escrita" className="max-h-44 w-full object-cover" />
          <button
            type="button"
            onClick={() => setPhoto(null)}
            aria-label="Quitar la foto"
            className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full bg-background/85 text-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {busy === "transcribir" && (
        <p className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Escuchando tu nota de voz…
        </p>
      )}

      <Button
        onClick={review}
        disabled={busy !== null || rec}
        className="h-[52px] w-full rounded-[12px] bg-gradient-to-r from-accent-pink to-primary text-[15px] font-semibold text-white"
      >
        {busy === "revisar" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Revisar y guardar <Sparkles className="ml-1.5 h-4 w-4" />
          </>
        )}
      </Button>

      <AnswerFeedback state={state} message={msg} onClose={() => setState(null)} />
    </div>
  );
}

export default StepEvidence;

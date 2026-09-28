import { useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { SpeakButton } from "@/components/VoiceControls";
import { transcribeVoiceNote } from "@/lib/step-ai.functions";
import { cn } from "@/lib/utils";

/**
 * Accesibilidad de una respuesta escrita: escuchar la pregunta en voz alta y
 * dictar la respuesta con el micrófono (se transcribe y se agrega al texto).
 */

function encodeWav(chunks: Float32Array[], sampleRate: number): Blob {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const ratio = Math.max(1, Math.round(sampleRate / 16000));
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
  const flat = new Float32Array(total);
  let p = 0;
  for (const c of chunks) {
    flat.set(c, p);
    p += c.length;
  }
  let i = 0;
  let w = 44;
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

export function VoiceAnswer({
  question,
  value,
  onChange,
  className,
}: {
  /** Texto que se lee en voz alta (la pregunta). */
  question: string;
  value: string;
  onChange: (next: string) => void;
  className?: string;
}) {
  const [rec, setRec] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audio = useRef<{
    ctx: AudioContext;
    node: ScriptProcessorNode;
    stream: MediaStream;
    chunks: Float32Array[];
  } | null>(null);

  async function start() {
    setError(null);
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
      setError("No pudimos usar el micrófono. Escribe tu respuesta.");
    }
  }

  async function stop() {
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
      setError("No escuché nada. Acércate al micrófono e inténtalo otra vez.");
      return;
    }
    setBusy(true);
    try {
      const { text } = await transcribeVoiceNote({ data: { audio: await toBase64(blob) } });
      if (text) onChange((value ? `${value} ${text}` : text).slice(0, 1000));
      else setError("No entendí la nota de voz. Prueba de nuevo, más despacio.");
    } catch {
      setError("No pudimos escuchar tu nota ahora mismo. Escríbela y continúa.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2">
        <SpeakButton text={question} />
        <button
          type="button"
          onClick={rec ? stop : start}
          disabled={busy}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[12.5px] font-bold transition active:scale-[.97]",
            rec ? "bg-destructive text-white" : "bg-primary/10 text-primary",
          )}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : rec ? (
            <Square className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
          {busy ? "Escuchando tu voz…" : rec ? "Detener y escribir" : "Hablar mi respuesta"}
        </button>
      </div>
      {error && <p className="text-[12px] font-semibold text-destructive">{error}</p>}
    </div>
  );
}

export default VoiceAnswer;

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Validación de evidencia de las actividades (STEP 2 y STEP 3).
 * La IA solo entiende y genera TEXTO; la voz se produce en el dispositivo.
 */

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.7-flash";

const evidenceSchema = z.object({
  instruction: z.string().min(2).max(1200),
  theme: z.string().max(200).optional(),
  /** Texto escrito o transcripción de la nota de voz. */
  text: z.string().max(4000).optional(),
  /** Foto de la hoja escrita, como data URL (image/jpeg|png). */
  image: z.string().max(9_000_000).optional(),
});

type Verdict = { ok: boolean; feedback: string };

function parseVerdict(raw: string): Verdict {
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const v = JSON.parse(match[0]) as { ok?: boolean; feedback?: string };
      if (typeof v.ok === "boolean" && typeof v.feedback === "string") {
        return { ok: v.ok, feedback: v.feedback.slice(0, 320) };
      }
    } catch {
      /* respuesta no JSON */
    }
  }
  return { ok: false, feedback: "No pude leer bien tu respuesta. Inténtalo otra vez, con calma." };
}

/** Analiza foto o texto/voz y decide si la actividad quedó cumplida. */
export const validateStepEvidence = createServerFn({ method: "POST" })
  .inputValidator((d) => evidenceSchema.parse(d))
  .handler(async ({ data }): Promise<Verdict> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, feedback: "El acompañamiento con IA no está disponible ahora mismo." };
    if (!data.text?.trim() && !data.image) {
      return { ok: false, feedback: "No recibí nada todavía. Escribe, habla o sube la foto de tu hoja." };
    }

    const system =
      "Eres la mentora de ORÍGEN, cálida y breve, en español latino. Evalúas si la persona realizó una actividad de crecimiento personal. " +
      "Sé generosa: NO exijas respuestas perfectas ni palabras exactas; acepta respuestas equivalentes o parciales pero relacionadas. " +
      "Rechaza solo si está vacío, es ruido/texto sin sentido, es una foto sin escritura, o no tiene ninguna relación con la instrucción. " +
      'Responde SOLO JSON: {"ok":true|false,"feedback":"1-2 frases en segunda persona"}. ' +
      "Si ok es false, explica en una frase concreta qué falta.";

    const content: unknown[] = [
      {
        type: "text",
        text:
          `Instrucción de la actividad: ${data.instruction}\n` +
          (data.theme ? `Tema del camino: ${data.theme}\n` : "") +
          (data.text?.trim()
            ? `Respuesta de la persona (escrita o transcrita): ${data.text.trim()}`
            : "La persona subió una foto de su hoja escrita. Revisa si hay escritura real y si responde a la instrucción."),
      },
    ];
    if (data.image) content.push({ type: "image_url", image_url: { url: data.image } });

    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      if (res.status === 429) return { ok: false, feedback: "Muchas revisiones a la vez. Espera unos segundos y vuelve a intentarlo." };
      throw new Error(`Validación falló: ${res.status} ${detail.slice(0, 200)}`);
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return parseVerdict(json.choices?.[0]?.message?.content ?? "");
  });

const transcribeSchema = z.object({
  /** Audio WAV en base64 (sin prefijo data:). */
  audio: z.string().min(100).max(9_000_000),
});

/** Transcribe una nota de voz (la voz de salida se genera en el dispositivo). */
export const transcribeVoiceNote = createServerFn({ method: "POST" })
  .inputValidator((d) => transcribeSchema.parse(d))
  .handler(async ({ data }): Promise<{ text: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { text: "" };
    const bin = Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0));
    const form = new FormData();
    form.append("model", "openai/gpt-4o-mini-transcribe");
    form.append("file", new Blob([bin], { type: "audio/wav" }), "nota.wav");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Transcripción falló: ${res.status} ${detail.slice(0, 200)}`);
    }
    const json = (await res.json()) as { text?: string };
    return { text: (json.text ?? "").trim() };
  });

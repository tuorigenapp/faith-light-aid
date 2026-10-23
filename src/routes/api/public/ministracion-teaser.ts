import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CHRISTIAN_LANGUAGE_RULE, christianContent } from "@/lib/christian-language";

const Input = z.object({
  name: z.string().trim().min(1).max(80),
  dob: z.string().trim().min(4).max(20),
  question: z.string().trim().max(400).optional().default(""),
});

export type MinistracionTeaser = {
  headline: string;
  visible: string;
  locked: { title: string; body: string }[];
  versiculo: string;
};

const SYS = `Eres la vocera de la Ministración del Cielo de ORÍGEN (método de Ruth Esther Paredes Sufrán, libro "Reconectando el Espíritu con Dios").

PROHIBIDO nombrar o insinuar: akáshico, registros, canalizar, tarot, cartas, oráculo, energía, karma, vibración, frecuencia, magia, cristales, astrología, chakras, videncia, adivinación.
PERMITIDO: Ministración del Cielo, Corte Celestial, causa espiritual, deuda generacional, lazos generacionales, diseño divino, propósito, restauración.

Tono humano, cálido, directo, sin misticismo. Español de LATAM. Tuteo.

Devuelve SOLO JSON estricto:
{
  "headline": "máx 10 palabras, lo más impactante y específico del día para esta persona",
  "visible": "2 o 3 frases (máx 45 palabras) con lo MÁS importante y concreto: qué se está atendiendo hoy en su historia. Debe dejar hambre de saber más, nunca resolver todo",
  "locked": [
    { "title": "De qué lado viene el patrón", "body": "5 a 7 líneas explorando solo lo que la persona comparte, sin inventar secretos familiares ni atribuirlo a una línea materna o paterna sin evidencia" },
    { "title": "Tus pasos para los próximos días", "body": "4 a 6 líneas con acciones prácticas, sin predicciones ni fechas de sucesos" },
    { "title": "Qué debes soltar hoy", "body": "4 a 6 líneas con la instrucción exacta para romper el ciclo" }
  ],
  "versiculo": "cita bíblica exacta (Libro capítulo:versículo) + texto corto"
}`;

export const Route = createFileRoute("/api/public/ministracion-teaser")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return json({ error: "El servicio no está disponible ahora." }, 500);
        }
        let data: z.infer<typeof Input>;
        try {
          data = Input.parse(await request.json());
        } catch {
          return json({ error: "Faltan tu nombre o tu fecha de nacimiento." }, 400);
        }

        const userMsg = `Nombre: ${data.name}
Fecha de nacimiento: ${data.dob}
Fecha de hoy: ${new Date().toISOString().slice(0, 10)}
Pregunta que trae: ${data.question || "(sin pregunta: entrega la ministración general de hoy)"}

Entrega el JSON pedido.`;

        try {
          const r = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": key,
              "X-Lovable-AIG-SDK": "fetch",
            },
            body: JSON.stringify({
              model: "openai/gpt-6-astra",
              input: [
                { role: "system", content: [{ type: "input_text", text: `${SYS}\n${CHRISTIAN_LANGUAGE_RULE}` }] },
                { role: "user", content: [{ type: "input_text", text: userMsg }] },
              ],
              stream: true,
              reasoning: { effort: "low", summary: "auto" },
              store: false,
            }),
          });

          if (!r.ok || !r.body) {
            const t = await r.text().catch(() => "");
            return json(
              {
                error:
                  r.status === 402
                    ? "El servicio está ocupado en este momento. Intenta más tarde."
                    : r.status === 429
                      ? "Muchas consultas al mismo tiempo. Intenta en unos minutos."
                      : "No pudimos recibir tu ministración ahora." + (t ? "" : ""),
              },
              r.status || 500,
            );
          }

          const text = await readOutputText(r.body);
          const parsed = safeParse(text);
          if (!parsed) return json({ error: "No pudimos leer la respuesta. Intenta otra vez." }, 502);
          return json(christianContent(parsed), 200);
        } catch (e) {
          return json({ error: (e as Error).message }, 500);
        }
      },
    },
  },
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Lee el SSE de /v1/responses y junta solo el texto final. */
async function readOutputText(body: ReadableStream<Uint8Array>): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
          out += evt.delta;
        } else if (evt.type === "response.completed" && evt.response?.output_text) {
          if (!out) out = evt.response.output_text;
        }
      } catch {
        /* fragmento incompleto: se ignora */
      }
    }
  }
  return out;
}

function safeParse(text: string): MinistracionTeaser | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const raw = JSON.parse(text.slice(start, end + 1)) as Partial<MinistracionTeaser>;
    if (!raw.headline || !raw.visible) return null;
    return {
      headline: String(raw.headline),
      visible: String(raw.visible),
      versiculo: String(raw.versiculo ?? ""),
      locked: Array.isArray(raw.locked)
        ? raw.locked.slice(0, 3).map((l) => ({ title: String(l.title), body: String(l.body) }))
        : [],
    };
  } catch {
    return null;
  }
}

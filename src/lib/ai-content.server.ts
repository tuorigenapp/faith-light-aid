/** Generación de contenido con la pasarela de IA de Lovable (solo servidor). */

import { createOpenAI } from "@ai-sdk/openai";
import { APICallError, Output, streamText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "./ai-run-id.server.ts";
import { logUsage } from "./usage-log.server.ts";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const TEXT_MODEL = "openai/gpt-6-astra";
const IMAGE_MODEL = "openai/gpt-image-2.5-sunburst";

function apiKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("La generación automática no está disponible ahora.");
  return key;
}

/** Traduce un fallo de la IA a un mensaje claro para el panel. */
function friendly(status: number | undefined) {
  if (status === 402) return "Se acabaron los créditos de IA disponibles. Mira «Créditos de IA» en el panel para ver cuándo se recargan. No se guardó nada.";
  if (status === 403) return "La IA está bloqueada por un límite del espacio de trabajo. Revisa «Créditos de IA» en el panel. No se guardó nada.";
  if (status === 429) return "La IA está recibiendo muchas solicitudes. Espera un minuto y vuelve a intentar. No se guardó nada.";
  if (status && status >= 500) return "La IA tuvo una falla temporal. Intenta de nuevo en unos minutos. No se guardó nada.";
  return "La IA no devolvió contenido esta vez. Intenta de nuevo; no se guardó nada.";
}

function statusOf(e: unknown): number | undefined {
  if (APICallError.isInstance(e)) return e.statusCode;
  const c = (e as { cause?: unknown })?.cause;
  return c && c !== e ? statusOf(c) : undefined;
}

/** Pide un JSON al modelo y lo devuelve ya parseado. */
export async function aiJson<T>(prompt: string, system?: string, feature = "crear-con-ia"): Promise<T> {
  const key = apiKey();
  const started = Date.now();
  const run = createLovableAiGatewayRunIdFetch();
  let lastStatus: number | undefined;
  const trackFetch: typeof fetch = async (input, init) => {
    const res = await run.fetch(input as RequestInfo, init);
    lastStatus = res.status;
    return res;
  };
  let streamError: unknown;
  const provider = createOpenAI({ baseURL: GATEWAY, apiKey: key, headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" }, fetch: trackFetch });
  const result = streamText({
    model: provider.responses(TEXT_MODEL),
    maxRetries: 0,
    system: system ?? "Escribes contenido original de sanación emocional y fe en español LATAM para ORÍGEN. No inventes citas bíblicas, cifras ni promesas médicas.",
    prompt: `${prompt}\nDevuelve el objeto JSON solicitado serializado dentro del campo json. Sin markdown.`,
    output: Output.object({ schema: z.object({ json: z.string() }) }),
    providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
    onError: ({ error }) => { streamError = error; },
  });
  let output: { json: string };
  try { output = await result.output; }
  catch (error) {
    const status = statusOf(streamError) ?? statusOf(error) ?? (lastStatus && lastStatus >= 400 ? lastStatus : undefined);
    await logUsage({ kind: "ai", feature, ok: false, status, durationMs: Date.now() - started, error: String((streamError as Error)?.message ?? (error as Error)?.message ?? "") });
    throw new Error(friendly(status));
  }
  try {
    const parsed = JSON.parse(output.json) as T;
    await logUsage({ kind: "ai", feature, ok: true, status: 200, durationMs: Date.now() - started });
    return parsed;
  } catch {
    await logUsage({ kind: "ai", feature, ok: false, status: 200, durationMs: Date.now() - started, error: "json" });
    throw new Error("No pudimos leer el contenido generado. Tus datos no se han cambiado.");
  }
}

/** Genera una imagen y devuelve sus bytes en PNG. */
export async function aiImage(prompt: string): Promise<Uint8Array> {
  const started = Date.now();
  const res = await fetch(`${GATEWAY}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey(),
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
    }),
  });
  await logUsage({ kind: "ai", feature: "portada", ok: res.ok, status: res.status, durationMs: Date.now() - started });
  if (!res.ok) throw new Error(friendly(res.status));
  const data = (await res.json()) as {
    data?: { b64_json?: string }[];
  };
  const base64 = data.data?.[0]?.b64_json;
  if (!base64) throw new Error("La generación no devolvió una portada.");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Sube una portada al almacenamiento y devuelve una URL usable por años. */
export async function uploadCover(prompt: string, slug: string): Promise<string | null> {
  try {
    const bytes = await aiImage(prompt);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${slug}-${Date.now()}.png`;
    const up = await supabaseAdmin.storage
      .from("content-covers")
      .upload(path, bytes, { contentType: "image/png", upsert: true });
    if (up.error) return null;
    const signed = await supabaseAdmin.storage
      .from("content-covers")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    return signed.data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

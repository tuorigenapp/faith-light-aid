/** Generación de contenido con la pasarela de IA de Lovable (solo servidor). */

import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "./ai-run-id.server.ts";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const TEXT_MODEL = "openai/gpt-6-astra";
const IMAGE_MODEL = "openai/gpt-image-2.5-sunburst";

function apiKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("La generación automática no está disponible ahora.");
  return key;
}

/** Pide un JSON al modelo y lo devuelve ya parseado. */
export async function aiJson<T>(prompt: string, system?: string): Promise<T> {
  const key = apiKey();
  const run = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({ baseURL: GATEWAY, apiKey: key, headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" }, fetch: run.fetch });
  const result = streamText({
    model: provider.responses(TEXT_MODEL),
    maxRetries: 0,
    system: system ?? "Escribes contenido original de sanación emocional y fe en español LATAM para ORÍGEN. No inventes citas bíblicas, cifras ni promesas médicas.",
    prompt: `${prompt}\nDevuelve el objeto JSON solicitado serializado dentro del campo json. Sin markdown.`,
    output: Output.object({ schema: z.object({ json: z.string() }) }),
    providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
  });
  const output = await result.output;
  try { return JSON.parse(output.json) as T; }
  catch { throw new Error("No pudimos leer el contenido generado. Tus datos no se han cambiado."); }
}

/** Genera una imagen y devuelve sus bytes en PNG. */
export async function aiImage(prompt: string): Promise<Uint8Array> {
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
  if (!res.ok) throw new Error("No pudimos generar la portada. Intenta de nuevo.");
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

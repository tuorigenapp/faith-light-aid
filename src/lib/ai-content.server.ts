/** Generación de contenido con la pasarela de IA de Lovable (solo servidor). */

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const TEXT_MODEL = "google/gemini-2.5-flash";
const IMAGE_MODEL = "google/gemini-2.5-flash-image";

function apiKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("La generación automática no está disponible ahora.");
  return key;
}

/** Pide un JSON al modelo y lo devuelve ya parseado. */
export async function aiJson<T>(prompt: string, system?: string): Promise<T> {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey(),
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages: [
        {
          role: "system",
          content:
            system ??
            "Escribes contenido de sanación emocional y fe en español latinoamericano para la plataforma ORÍGEN. Nunca inventes citas bíblicas inexistentes, cifras ni promesas médicas. Responde SOLO con JSON válido, sin markdown.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error("No pudimos generar el contenido. Intenta de nuevo.");
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("La generación no devolvió contenido legible.");
  return JSON.parse(text.slice(start, end + 1)) as T;
}

/** Genera una imagen y devuelve sus bytes en PNG. */
export async function aiImage(prompt: string): Promise<Uint8Array> {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey(),
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) throw new Error("No pudimos generar la portada. Intenta de nuevo.");
  const data = (await res.json()) as {
    choices?: { message?: { images?: { image_url?: { url?: string } }[] } }[];
  };
  const url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) throw new Error("La generación no devolvió una portada.");
  const base64 = url.includes(";base64,") ? url.split(";base64,")[1]! : url;
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

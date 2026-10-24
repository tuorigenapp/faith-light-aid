import { googleDriveFileId, directAudioUrl, validAudioAddress } from "./media-input";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_drive/drive/v3";
const MAX_AUDIO_BYTES = 50 * 1024 * 1024;

/** Copy Drive audio once into our audio storage; never expose connector credentials. */
export async function importAudioAddress(address: string): Promise<string> {
  if (!validAudioAddress(address)) throw new Error("Pega un enlace completo que empiece con https://.");
  const id = googleDriveFileId(address);
  if (!id) return directAudioUrl(address);
  const apiKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_DRIVE_API_KEY"];
  if (!apiKey || !connectionKey) throw new Error("Conecta Google Drive a ORÍGEN para importar este audio.");
  const headers = { Authorization: `Bearer ${apiKey}`, "X-Connection-Api-Key": connectionKey };
  const providerRead = async (path: string) => {
    const response = await fetch(`${GATEWAY_URL}${path}`, { headers, redirect: "follow", signal: AbortSignal.timeout(60_000) });
    if (!response.ok) {
      const body = await response.text();
      console.error(`Google Drive import failed [${response.status}]: ${body}`);
      throw new Error(`Google Drive no permitió descargar el archivo (${response.status}). Comparte el audio con la cuenta de Drive conectada y vuelve a intentar. Detalle: ${body}`);
    }
    return response;
  };
  const metadata = await (await providerRead(`/files/${id}?fields=id,name,mimeType,size,capabilities(canDownload)`)).json() as { name: string; mimeType: string; size?: string; capabilities?: { canDownload?: boolean } };
  if (!metadata.mimeType.startsWith("audio/") && !/\.(mp3|m4a|wav|aac|ogg)$/i.test(metadata.name)) throw new Error("Ese archivo de Drive no es un audio. Elige el enlace de un MP3, M4A o WAV.");
  if (metadata.capabilities?.canDownload === false) throw new Error("Este archivo no permite descargas en Drive. Habilita la descarga o sube el MP3.");
  if (Number(metadata.size ?? 0) > MAX_AUDIO_BYTES) throw new Error("El audio supera 50 MB.");
  const response = await providerRead(`/files/${id}?alt=media`);
  if (!response.body) throw new Error("Drive no devolvió el audio. Intenta otra vez.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = []; let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_AUDIO_BYTES) { await reader.cancel(); throw new Error("El audio supera 50 MB."); }
    chunks.push(value);
  }
  if (!size) throw new Error("El archivo de audio no tiene contenido.");
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const extension = metadata.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp3";
  const path = `drive/${id}-${crypto.randomUUID()}.${extension}`;
  const uploaded = await supabaseAdmin.storage.from("manifest-audios").upload(path, bytes, { contentType: metadata.mimeType.startsWith("audio/") ? metadata.mimeType : "audio/mpeg" });
  if (uploaded.error) throw new Error(`No pudimos guardar el audio de Drive: ${uploaded.error.message}`);
  const signed = await supabaseAdmin.storage.from("manifest-audios").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (signed.error || !signed.data) throw new Error("El audio se copió, pero no pudimos crear su enlace de reproducción.");
  return signed.data.signedUrl;
}
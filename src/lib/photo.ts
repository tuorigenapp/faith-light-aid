import { supabase } from "@/integrations/supabase/client";

export const MAX_PHOTO_MB = 8;

/** Carga un File en un HTMLImageElement */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo leer la imagen"));
    img.src = src;
  });
}

/**
 * Recorta la imagen a un cuadrado según zoom/offset del editor y devuelve un JPEG comprimido.
 * viewport = tamaño en px del recuadro de recorte en pantalla.
 */
export async function cropToSquareBlob(
  img: HTMLImageElement,
  opts: { zoom: number; offsetX: number; offsetY: number; viewport: number; out?: number },
): Promise<Blob> {
  const out = opts.out ?? 512;
  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out, out);

  // escala base: cubrir el viewport
  const base = opts.viewport / Math.min(img.naturalWidth, img.naturalHeight);
  const scale = base * opts.zoom;
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  const k = out / opts.viewport;

  const dx = (opts.viewport / 2 - drawW / 2 + opts.offsetX) * k;
  const dy = (opts.viewport / 2 - drawH / 2 + opts.offsetY) * k;
  ctx.drawImage(img, dx, dy, drawW * k, drawH * k);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo procesar la imagen"))), "image/jpeg", 0.88),
  );
}

/** Sube un blob a un bucket privado y devuelve la RUTA guardada (no la URL). */
export async function uploadPhoto(bucket: string, userId: string, blob: Blob): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    cacheControl: "3600",
    upsert: true,
    contentType: "image/jpeg",
  });
  if (error) throw new Error(`No pudimos subir la foto: ${error.message}`);
  return path;
}

export async function removePhoto(bucket: string, path?: string | null) {
  if (!path || path.startsWith("http")) return;
  await supabase.storage.from(bucket).remove([path]);
}

/** Convierte rutas de storage en URLs firmadas (1 año). Deja pasar URLs http. */
export async function signPaths(bucket: string, paths: string[]): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  const toSign = paths.filter((p) => p && !p.startsWith("http"));
  paths.filter((p) => p?.startsWith("http")).forEach((p) => (map[p] = p));
  if (toSign.length === 0) return map;
  const { data } = await supabase.storage.from(bucket).createSignedUrls(toSign, 60 * 60 * 24 * 365);
  data?.forEach((d) => {
    if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
  });
  return map;
}

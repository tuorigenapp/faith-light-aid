/** Accept only a usable web audio address; storage links remain private and signed. */
export function directAudioUrl(raw: string) {
  const url = raw.trim();
  const drive = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{10,})/);
  if (drive) return `https://drive.google.com/uc?export=download&id=${drive[1]}`;
  if (/dropbox\.com/.test(url)) return url.replace(/[?&]dl=0/, "").replace("www.dropbox.com", "dl.dropboxusercontent.com");
  return url;
}

export function mediaError(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return fallback;
}

export function validAudioAddress(value: string): boolean {
  if (!value.trim()) return true;
  try { const url = new URL(directAudioUrl(value)); return url.protocol === "https:" || url.protocol === "http:"; }
  catch { return false; }
}
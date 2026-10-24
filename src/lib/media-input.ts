/** Accept only a usable web audio address; storage links remain private and signed. */
export function googleDriveFileId(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" || url.hostname !== "drive.google.com") return null;
    const id = url.pathname.match(/^\/file\/d\/([\w-]+)(?:\/|$)/)?.[1] ?? url.searchParams.get("id");
    return id && /^[\w-]{10,}$/.test(id) ? id : null;
  } catch { return null; }
}

export function directAudioUrl(raw: string) {
  const url = raw.trim();
  const drive = googleDriveFileId(url);
  if (drive) return `https://drive.google.com/uc?export=download&id=${drive}`;
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
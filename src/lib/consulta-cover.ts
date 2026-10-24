/** Stored public/signed addresses can stop working; sign the original private object instead. */
export function consultaCoverPath(source: string | null | undefined): string | undefined {
  if (!source) return undefined;
  if (!/^https?:\/\//i.test(source)) return source;
  try {
    const url = new URL(source);
    const path = url.pathname.match(/^\/storage\/v1\/object\/(?:public|sign|authenticated)\/content-covers\/(.+)$/)?.[1];
    return path ? decodeURIComponent(path) : source;
  } catch { return undefined; }
}
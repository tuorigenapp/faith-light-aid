/** Restrict server delivery to the services that browsers use for Web Push. */
export function isTrustedPushEndpoint(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return false;
    const host = url.hostname.toLowerCase();
    return host === "fcm.googleapis.com"
      || host === "updates.push.services.mozilla.com"
      || host === "push.services.mozilla.com"
      || host === "web.push.apple.com"
      || host === "notify.windows.com"
      || host.endsWith(".notify.windows.com");
  } catch { return false; }
}
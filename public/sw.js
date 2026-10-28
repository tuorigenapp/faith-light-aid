/* Service worker de ORÍGEN — notificaciones */
const ORIGIN_LABEL = "tuorigen.app";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = { title: "ORÍGEN", body: "Tienes algo nuevo esperándote.", url: "/dashboard" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (_) {
    if (event.data) payload.body = event.data.text();
  }

  const url = payload.url || "/dashboard";
  const tag = payload.tag || `origen-${url}`;
  const title = payload.title?.startsWith(ORIGIN_LABEL)
    ? payload.title
    : `${ORIGIN_LABEL} · ${payload.title}`;

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body,
      icon: payload.icon || "/icon-192.png",
      badge: "/badge-96.png",
      ...(payload.image ? { image: payload.image } : {}),
      tag,
      renotify: false,
      data: { url, track: payload.track || null },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/dashboard";
  const track = event.notification.data && event.notification.data.track;
  // Registra la apertura en tiempo real sin bloquear la navegación.
  if (track) event.waitUntil(fetch(track, { method: "GET", mode: "no-cors", keepalive: true }).catch(() => {}));
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        const clientUrl = new URL(client.url);
        if ("focus" in client) {
          if (clientUrl.pathname !== url && "navigate" in client) {
            client.navigate(url);
          }
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

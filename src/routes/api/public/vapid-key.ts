import { createFileRoute } from "@tanstack/react-router";

/** Llave pública de notificaciones (dato público por diseño). */
export const Route = createFileRoute("/api/public/vapid-key")({
  server: {
    handlers: {
      GET: () =>
        new Response(JSON.stringify({ key: process.env["VAPID_PUBLIC_KEY"] ?? null }), {
          headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
        }),
    },
  },
});

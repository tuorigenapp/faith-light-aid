import { createFileRoute } from "@tanstack/react-router";
import { sendPush, type PushSubscriptionRow } from "@/lib/webpush.server";

const MENSAJES = [
  { title: "Tu Palabra de hoy ya está lista 🕊️", body: "Dos minutos hoy sostienen tu paz y tu racha.", url: "/palabra" },
  { title: "Tu camino te espera", body: "Un paso pequeño hoy cambia la historia de tu linaje.", url: "/etapas" },
  { title: "Respira 5 minutos con nosotros", body: "Pon un audio de manifestación y suelta el peso del día.", url: "/visualiza" },
];

/**
 * Recordatorio diario fuera de la app. Llamar desde un cron con x-push-secret.
 * Solo escribe notificaciones: no expone datos de usuarios.
 */
export const Route = createFileRoute("/api/public/push-daily")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PUSH_CRON_SECRET"];
        if (!secret || request.headers.get("x-push-secret") !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const prefs = await supabaseAdmin.from("notification_prefs").select("user_id").eq("push_enabled", true);
        const ids = (prefs.data ?? []).map((p) => p.user_id);
        if (ids.length === 0) return Response.json({ sent: 0 });

        // Quién ya entró hoy: a esas personas no se les recuerda nada.
        const today = new Date().toISOString().slice(0, 10);
        const active = await supabaseAdmin
          .from("daily_activity")
          .select("user_id")
          .eq("activity_date", today)
          .in("user_id", ids);
        const activeIds = new Set((active.data ?? []).map((a) => a.user_id));
        const targets = ids.filter((id) => !activeIds.has(id));
        if (targets.length === 0) return Response.json({ sent: 0 });

        const subs = await supabaseAdmin
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth, user_id")
          .in("user_id", targets);

        const message = MENSAJES[new Date().getDate() % MENSAJES.length]!;
        let sent = 0;
        const dead: string[] = [];
        for (const sub of (subs.data ?? []) as (PushSubscriptionRow & { user_id: string })[]) {
          try {
            const status = await sendPush(sub, message);
            if (status === 404 || status === 410) dead.push(sub.endpoint);
            else if (status >= 200 && status < 300) sent += 1;
          } catch {
            /* seguimos con el resto */
          }
        }
        if (dead.length) await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", dead);

        return Response.json({ sent, skipped: activeIds.size });
      },
    },
  },
});

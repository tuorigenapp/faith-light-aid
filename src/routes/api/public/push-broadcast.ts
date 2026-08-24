import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { sendPush, type PushSubscriptionRow } from "@/lib/webpush.server";

const bodySchema = z.object({
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(2).max(300),
  url: z.string().trim().max(300).optional(),
  tag: z.string().trim().max(100).optional(),
  /** Si se omite, se envía a todos los usuarios con push activado. */
  userIds: z.array(z.string().uuid()).max(2000).optional(),
});

/**
 * Envío de notificaciones fuera de la app (recordatorios, Palabra del día).
 * Requiere la cabecera x-push-secret: solo lo llama el cron interno.
 */
export const Route = createFileRoute("/api/public/push-broadcast")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PUSH_CRON_SECRET"];
        if (!secret || request.headers.get("x-push-secret") !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }

        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Bad request", { status: 400 });
        const { title, body, url, userIds, tag } = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const prefs = await supabaseAdmin
          .from("notification_prefs")
          .select("user_id")
          .eq("push_enabled", true);
        let allowed = new Set((prefs.data ?? []).map((p) => p.user_id));
        if (userIds) allowed = new Set(userIds.filter((id) => allowed.has(id)));
        if (allowed.size === 0) {
          return Response.json({ sent: 0, removed: 0 });
        }

        const subs = await supabaseAdmin
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth, user_id")
          .in("user_id", [...allowed]);

        let sent = 0;
        const dead: string[] = [];
        for (const sub of (subs.data ?? []) as (PushSubscriptionRow & { user_id: string })[]) {
          try {
            const status = await sendPush(sub, { title, body, url: url ?? "/dashboard", tag });
            if (status === 404 || status === 410) dead.push(sub.endpoint);
            else if (status >= 200 && status < 300) sent += 1;
          } catch {
            /* una suscripción caída no detiene el envío */
          }
        }
        if (dead.length) await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", dead);

        return Response.json({ sent, removed: dead.length });
      },
    },
  },
});

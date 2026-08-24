import { createFileRoute } from "@tanstack/react-router";
import { runCampaignSend } from "@/lib/marketing.functions";

/**
 * Disparador de campañas programadas (llamado por un cron externo).
 * Protegido con la cabecera x-push-secret (PUSH_CRON_SECRET).
 */
export const Route = createFileRoute("/api/public/marketing-dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PUSH_CRON_SECRET"];
        if (!secret || request.headers.get("x-push-secret") !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const now = new Date();
        const nowIso = now.toISOString();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

        const { data: due } = await supabaseAdmin
          .from("marketing_campaigns")
          .select("*")
          .eq("status", "scheduled")
          .lte("scheduled_at", nowIso);

        const results: Array<{ id: string; sent?: number; skipped?: string; error?: string }> = [];

        for (const campaign of due ?? []) {
          if (campaign.ends_at && campaign.ends_at < nowIso) {
            await supabaseAdmin.from("marketing_campaigns").update({ status: "sent" }).eq("id", campaign.id);
            results.push({ id: campaign.id, skipped: "ventana vencida" });
            continue;
          }

          const sentToday = campaign.last_sent_at && campaign.last_sent_at >= todayStart;
          const maxPerDay = campaign.max_per_day ?? 1;
          if (sentToday && maxPerDay <= 1) {
            results.push({ id: campaign.id, skipped: "ya enviada hoy" });
            continue;
          }

          try {
            await supabaseAdmin.from("marketing_campaigns").update({ status: "sending" }).eq("id", campaign.id);
            const r = await runCampaignSend(supabaseAdmin, campaign.id);
            // Si aún hay ventana (ends_at futuro), la dejamos programada para el próximo envío del día.
            if (campaign.ends_at && campaign.ends_at > nowIso) {
              await supabaseAdmin.from("marketing_campaigns").update({ status: "scheduled" }).eq("id", campaign.id);
            }
            results.push({ id: campaign.id, sent: r.sent });
          } catch (e) {
            await supabaseAdmin.from("marketing_campaigns").update({ status: "scheduled" }).eq("id", campaign.id);
            results.push({ id: campaign.id, error: e instanceof Error ? e.message : "error desconocido" });
          }
        }

        return Response.json({ processed: results.length, results });
      },
    },
  },
});

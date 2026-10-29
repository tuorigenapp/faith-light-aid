import { createFileRoute } from "@tanstack/react-router";
import { authorizedCaller } from "@/lib/cron-auth.server";
import { runCampaignSend } from "@/lib/marketing.functions";
import { AI_EMAIL_SLOTS_UTC, AI_PUSH_SLOTS_UTC, buildTemplates, pickAiPush, pickAiTemplate } from "@/lib/marketing-render";

/**
 * Disparador de campañas programadas (llamado por un cron externo).
 * Protegido con la cabecera x-push-secret (PUSH_CRON_SECRET).
 */
export const Route = createFileRoute("/api/public/marketing-dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PUSH_CRON_SECRET"];
        if (!(await authorizedCaller(request, secret))) {
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

        await createAiCampaigns(supabaseAdmin, now);

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

/**
 * Asistente 24/7: si está encendido, crea la campaña de la franja actual (una sola vez)
 * y la deja programada para ahora. Queda en el historial marcada como automática.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createAiCampaigns(admin: any, now: Date) {
  const s = await admin.from("community_settings").select("value").eq("key", "ai_marketing").maybeSingle();
  const cfg = (s.data?.value ?? {}) as { email?: boolean; push?: boolean; mode?: string };
  const mode = cfg.mode === "remarketing" ? "remarketing" : "marketing";
  const hour = now.getUTCHours();
  const slotStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour)).toISOString();
  const audience = mode === "remarketing" ? "inactive" : "all";

  async function exists(channel: string) {
    const { data } = await admin
      .from("marketing_campaigns")
      .select("id")
      .eq("ai_generated", true)
      .eq("channel", channel)
      .gte("created_at", slotStart)
      .limit(1);
    return (data ?? []).length > 0;
  }

  if (cfg.email && AI_EMAIL_SLOTS_UTC.includes(hour) && !(await exists("email"))) {
    const v = await admin.from("community_settings").select("value").eq("key", "mkt_template_variants").maybeSingle();
    const t = pickAiTemplate(now, AI_EMAIL_SLOTS_UTC.indexOf(hour), mode, buildTemplates((v.data?.value ?? {}) as Record<string, number>));
    await admin.from("marketing_campaigns").insert({
      name: `Asistente · ${t.title}`,
      channel: "email",
      subject: t.subject,
      content: t.content,
      image_url: t.image_url,
      button_text: t.button_text,
      button_url: t.button_url,
      discount_label: t.discount_label,
      template_id: t.id,
      kind: mode,
      audience_type: audience,
      status: "scheduled",
      scheduled_at: now.toISOString(),
      ai_generated: true,
    });
  }
  if (cfg.push && AI_PUSH_SLOTS_UTC.includes(hour) && !(await exists("push"))) {
    const p = pickAiPush(now, mode);
    await admin.from("marketing_campaigns").insert({
      name: `Asistente · ${p.subject.replace("[usuario]", "").trim()}`,
      channel: "push",
      ...p,
      button_text: null,
      kind: mode,
      audience_type: audience,
      status: "scheduled",
      scheduled_at: now.toISOString(),
      ai_generated: true,
    });
  }
}

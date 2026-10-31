import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveAudience, dispatchPush, dispatchEmail } from "@/lib/marketing.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: solo administradores pueden operar Marketing.");
}

export const getAudienceCount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ audienceType: z.string(), listId: z.string().uuid().nullable() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const audience = await resolveAudience(supabaseAdmin, data.audienceType, data.listId);
    return { count: audience.length };
  });

export async function runCampaignSend(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  campaignId: string,
) {
  const { data: campaign, error } = await supabaseAdmin
    .from("marketing_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();
  if (error || !campaign) throw new Error("La campaña no existe.");

  const audience =
    campaign.audience_type === "me"
      ? await selfAudience(supabaseAdmin, campaign.created_by)
      : await resolveAudience(supabaseAdmin, campaign.audience_type, campaign.list_id, campaign.source_campaign_id);
  let sent = 0;
  let emailUnconfigured = false;

  if (campaign.channel === "push" || campaign.channel === "both") {
    const r = await dispatchPush(
      supabaseAdmin,
      audience.map((a) => a.user_id),
      campaign,
    );
    sent += r.sent;
  }
  if (campaign.channel === "email" || campaign.channel === "both") {
    const r = await dispatchEmail(supabaseAdmin, audience, campaign);
    sent += r.sent;
    emailUnconfigured = r.unconfigured;
  }

  const now = new Date().toISOString();
  await supabaseAdmin
    .from("marketing_campaigns")
    .update({
      status: "sent",
      sent_count: (campaign.sent_count ?? 0) + sent,
      last_sent_at: now,
    })
    .eq("id", campaignId);

  await supabaseAdmin.from("marketing_events").insert({
    campaign_id: campaignId,
    event_type: "send",
    user_id: null,
  });

  return { sent, audienceSize: audience.length, emailUnconfigured };
}

export const sendCampaignNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ campaignId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("marketing_campaigns").update({ status: "sending" }).eq("id", data.campaignId);
    try {
      return await runCampaignSend(supabaseAdmin, data.campaignId);
    } catch (e) {
      await supabaseAdmin.from("marketing_campaigns").update({ status: "draft" }).eq("id", data.campaignId);
      throw e;
    }
  });

export const scheduleCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        campaignId: z.string().uuid(),
        scheduledAt: z.string().min(1),
        endsAt: z.string().optional().nullable(),
        maxPerDay: z.number().int().min(1).max(24).default(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("marketing_campaigns")
      .update({
        status: "scheduled",
        scheduled_at: new Date(data.scheduledAt).toISOString(),
        ends_at: data.endsAt ? new Date(data.endsAt).toISOString() : null,
        max_per_day: data.maxPerDay,
      })
      .eq("id", data.campaignId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const pauseCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ campaignId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("marketing_campaigns")
      .update({ status: "paused" })
      .eq("id", data.campaignId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAiPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [s, total, paid] = await Promise.all([
      supabaseAdmin.from("community_settings").select("value").eq("key", "ai_push").maybeSingle(),
      resolveAudience(supabaseAdmin, "all", null),
      resolveAudience(supabaseAdmin, "buyers", null),
    ]);
    return { enabled: s.data?.value !== false, total: total.length, paid: paid.length, free: total.length - paid.length };
  });

export const setAiPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ enabled: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("community_settings").upsert({ key: "ai_push", value: data.enabled, updated_at: new Date().toISOString() });
    return { ok: true };
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function selfAudience(supabaseAdmin: any, userId: string | null) {
  if (!userId) return [];
  const { data } = await supabaseAdmin.from("profiles").select("id, email").eq("id", userId).maybeSingle();
  return data ? [{ user_id: data.id as string, email: (data.email as string | null) ?? null }] : [];
}

const campaignInput = z.object({
  subject: z.string().max(200).nullable(),
  content: z.string().min(1).max(8000),
  image_url: z.string().max(800).nullable(),
  button_text: z.string().max(80).nullable(),
  button_url: z.string().max(400).nullable(),
  push_style: z.enum(["text", "banner", "discount"]).nullable().optional(),
  push_icon: z.string().max(40).nullable().optional(),
  discount_label: z.string().max(60).nullable().optional(),
});

/** Correo de prueba al buzón indicado, con tu nombre real y el pie completo. */
export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => campaignInput.extend({ to: z.string().email() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const me = await selfAudience(supabaseAdmin, context.userId);
    const r = await dispatchEmail(supabaseAdmin, me.length ? me : [{ user_id: context.userId, email: data.to }], { ...data, id: undefined }, { testTo: data.to });
    if (r.unconfigured) throw new Error("El envío de correos no está activado en el servidor.");
    if (!r.sent) throw new Error(`No se pudo enviar la prueba${r.error ? `: ${r.error}` : ` (destinatarios: ${me.length}, fallidos: ${r.failed})`}`);
    return { ok: true };
  });

/** Programa una push de prueba solo para tu cuenta dentro de N minutos (registra apertura). */
export const scheduleTestPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => campaignInput.extend({ minutes: z.number().int().min(0).max(60) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const subs = await supabaseAdmin.from("push_subscriptions").select("endpoint").eq("user_id", context.userId);
    const { minutes, ...c } = data;
    const at = new Date(Date.now() + minutes * 60_000);
    const { data: row, error } = await supabaseAdmin
      .from("marketing_campaigns")
      .insert({
        name: `Prueba push ${at.toISOString().slice(11, 16)} UTC`,
        channel: "push",
        ...c,
        push_style: c.push_style ?? "text",
        audience_type: "me",
        status: minutes === 0 ? "draft" : "scheduled",
        scheduled_at: at.toISOString(),
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "No pudimos crear la prueba");
    if (minutes === 0) await runCampaignSend(supabaseAdmin, row.id);
    return { devices: subs.data?.length ?? 0, at: at.toISOString() };
  });

export type AiMarketingSettings = { email: boolean; push: boolean; mode: "marketing" | "remarketing" };

export const getAiMarketing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [s, v] = await Promise.all([
      supabaseAdmin.from("community_settings").select("value").eq("key", "ai_marketing").maybeSingle(),
      supabaseAdmin.from("community_settings").select("value").eq("key", "mkt_template_variants").maybeSingle(),
    ]);
    const val = (s.data?.value ?? {}) as Partial<AiMarketingSettings>;
    return {
      settings: { email: !!val.email, push: !!val.push, mode: val.mode === "remarketing" ? "remarketing" : "marketing" } as AiMarketingSettings,
      variants: (v.data?.value ?? {}) as Record<string, number>,
    };
  });

export const setAiMarketing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ email: z.boolean(), push: z.boolean(), mode: z.enum(["marketing", "remarketing"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("community_settings").upsert({ key: "ai_marketing", value: data, updated_at: new Date().toISOString() });
    return { ok: true };
  });

/** "Actualizar": renueva N plantillas de una categoría (cambia redacción e imagen). */
export const refreshTemplates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ ids: z.array(z.string().max(40)).min(1).max(100) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cur = await supabaseAdmin.from("community_settings").select("value").eq("key", "mkt_template_variants").maybeSingle();
    const v = { ...((cur.data?.value ?? {}) as Record<string, number>) };
    for (const id of data.ids) v[id] = (v[id] ?? 0) + 1;
    await supabaseAdmin.from("community_settings").upsert({ key: "mkt_template_variants", value: v, updated_at: new Date().toISOString() });
    return { variants: v };
  });

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

  const audience = await resolveAudience(supabaseAdmin, campaign.audience_type, campaign.list_id);
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
    const r = await dispatchEmail(audience, campaign);
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

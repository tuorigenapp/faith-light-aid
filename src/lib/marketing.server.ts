import { sendPush, type PushSubscriptionRow } from "@/lib/webpush.server";

export type AudienceRow = { user_id: string; email: string | null };

/** Resuelve la audiencia real de una campaña consultando la función SQL del proyecto. */
export async function resolveAudience(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  audienceType: string,
  listId: string | null,
): Promise<AudienceRow[]> {
  const { data, error } = await supabaseAdmin.rpc("resolve_marketing_audience", {
    p_audience_type: audienceType,
    p_list_id: listId,
  });
  if (error) throw new Error(`No pudimos calcular la audiencia: ${error.message}`);
  return (data ?? []) as AudienceRow[];
}

function personalize(text: string, displayName: string | null) {
  return text
    .replaceAll("[usuario]", displayName || "amiga")
    .replaceAll("[sitio]", "tuorigen.app")
    .replace(/\[enlace:(.*?)\]/g, (_m, p1: string) => p1);
}

/** Envía la campaña por push a un lote de usuarios, respetando preferencias y limpiando suscripciones muertas. */
export async function dispatchPush(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  userIds: string[],
  campaign: { subject: string | null; content: string; button_url: string | null },
): Promise<{ sent: number; failed: number }> {
  if (userIds.length === 0) return { sent: 0, failed: 0 };

  const prefs = await supabaseAdmin
    .from("notification_prefs")
    .select("user_id")
    .eq("push_enabled", true)
    .in("user_id", userIds);
  const allowed = new Set((prefs.data ?? []).map((p: { user_id: string }) => p.user_id));
  if (allowed.size === 0) return { sent: 0, failed: 0 };

  const subs = await supabaseAdmin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_id")
    .in("user_id", [...allowed]);

  let sent = 0;
  let failed = 0;
  const dead: string[] = [];
  for (const sub of (subs.data ?? []) as (PushSubscriptionRow & { user_id: string })[]) {
    try {
      const status = await sendPush(sub, {
        title: campaign.subject || "tuorigen.app",
        body: personalize(campaign.content, null),
        url: campaign.button_url || "/dashboard",
      });
      if (status === 404 || status === 410) dead.push(sub.endpoint);
      else if (status >= 200 && status < 300) sent += 1;
      else failed += 1;
    } catch {
      failed += 1;
    }
  }
  if (dead.length) await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", dead);
  return { sent, failed };
}

/** Envía la campaña por correo usando el sistema de email de Lovable (LOVABLE_API_KEY). */
export async function dispatchEmail(
  audience: AudienceRow[],
  campaign: { subject: string | null; content: string; button_text: string | null; button_url: string | null; image_url: string | null },
): Promise<{ sent: number; failed: number; unconfigured: boolean }> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { sent: 0, failed: 0, unconfigured: true };

  const { sendLovableEmail } = await import("@lovable.dev/email-js");
  const from = "ORÍGEN <noreply@notify.tuorigen.app>";
  let sent = 0;
  let failed = 0;
  for (const person of audience) {
    if (!person.email) continue;
    try {
      const html = `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <p>${personalize(campaign.content, null).replace(/\n/g, "<br/>")}</p>
          ${campaign.image_url ? `<img src="${campaign.image_url}" style="width:100%;border-radius:12px" />` : ""}
          ${
            campaign.button_text && campaign.button_url
              ? `<p><a href="https://tuorigen.app${campaign.button_url}" style="background:#7c5cff;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;display:inline-block">${campaign.button_text}</a></p>`
              : ""
          }
        </div>`;
      const res = await sendLovableEmail(
        {
          to: person.email,
          from,
          sender_domain: "notify.tuorigen.app",
          subject: campaign.subject || "Novedades de ORÍGEN",
          html,
          text: personalize(campaign.content, null),
          purpose: "marketing",
        },
        { apiKey },
      );
      if (res.success) sent += 1;
      else failed += 1;
    } catch {
      failed += 1;
    }
  }
  return { sent, failed, unconfigured: false };
}

import { logUsage } from "./usage-log.server.ts";
import { sendPush, type PushSubscriptionRow } from "@/lib/webpush.server";
import { SECTION_TAGS, SITE, buildPush, firstName, personalize, renderEmailHtml, renderEmailText } from "@/lib/marketing-render";

export type AudienceRow = { user_id: string; email: string | null };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

/** Audiencia real. Remarketing: abrieron / no abrieron / hicieron clic en otra campaña. */
export async function resolveAudience(
  supabaseAdmin: Admin,
  audienceType: string,
  listId: string | null,
  sourceCampaignId?: string | null,
): Promise<AudienceRow[]> {
  if (["opened", "not_opened", "clicked"].includes(audienceType)) {
    if (!sourceCampaignId) return [];
    const all = await resolveAudience(supabaseAdmin, "all", null);
    const ev = await supabaseAdmin
      .from("marketing_events")
      .select("user_id, event_type")
      .eq("campaign_id", sourceCampaignId)
      .in("event_type", audienceType === "clicked" ? ["click"] : ["open", "click"]);
    const hit = new Set((ev.data ?? []).map((e: { user_id: string | null }) => e.user_id).filter(Boolean));
    return all.filter((a) => (audienceType === "not_opened" ? !hit.has(a.user_id) : hit.has(a.user_id)));
  }
  const { data, error } = await supabaseAdmin.rpc("resolve_marketing_audience", {
    p_audience_type: audienceType,
    p_list_id: listId,
  });
  if (error) throw new Error(`No pudimos calcular la audiencia: ${error.message}`);
  return (data ?? []) as AudienceRow[];
}

async function hmac(text: string): Promise<string> {
  const secret = process.env["PUSH_CRON_SECRET"] ?? "origen";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text)));
  return [...sig.slice(0, 12)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function trackToken(campaignId: string, userId: string) {
  return hmac(`${campaignId}.${userId}`);
}

export async function verifyTrackToken(campaignId: string, userId: string, token: string) {
  return (await hmac(`${campaignId}.${userId}`)) === token;
}

export async function trackUrl(kind: "open" | "click", campaignId: string, userId: string, to?: string) {
  const t = await trackToken(campaignId, userId);
  const q = new URLSearchParams({ e: kind, c: campaignId, u: userId, t });
  if (to) q.set("to", to);
  return `${SITE}/api/public/marketing-track?${q.toString()}`;
}

async function namesFor(supabaseAdmin: Admin, ids: string[]) {
  const map = new Map<string, string>();
  for (let i = 0; i < ids.length; i += 500) {
    const { data } = await supabaseAdmin.from("profiles").select("id, display_name, full_name").in("id", ids.slice(i, i + 500));
    for (const p of data ?? []) map.set(p.id, firstName(p));
  }
  return map;
}

type Campaign = {
  id?: string;
  subject: string | null;
  content: string;
  button_text: string | null;
  button_url: string | null;
  image_url: string | null;
  push_style?: string | null;
  push_icon?: string | null;
  discount_label?: string | null;
};

/** Push a cada dispositivo registrado (no requiere correo), personalizado y con registro de apertura. */
export async function dispatchPush(
  supabaseAdmin: Admin,
  userIds: string[],
  campaign: Campaign,
): Promise<{ sent: number; failed: number }> {
  if (userIds.length === 0) return { sent: 0, failed: 0 };
  const off = await supabaseAdmin.from("notification_prefs").select("user_id").eq("push_enabled", false).in("user_id", userIds);
  const blocked = new Set((off.data ?? []).map((p: { user_id: string }) => p.user_id));
  const allowed = userIds.filter((id) => !blocked.has(id));
  if (allowed.length === 0) return { sent: 0, failed: 0 };

  const subs = await supabaseAdmin.from("push_subscriptions").select("endpoint, p256dh, auth, user_id").in("user_id", allowed);
  const names = await namesFor(supabaseAdmin, allowed);

  let sent = 0;
  let failed = 0;
  const dead: string[] = [];
  for (const sub of (subs.data ?? []) as (PushSubscriptionRow & { user_id: string })[]) {
    try {
      const p = buildPush(campaign, names.get(sub.user_id) ?? "");
      const status = await sendPush(sub, {
        ...p,
        tag: campaign.id ? `camp-${campaign.id}` : undefined,
        track: campaign.id ? await trackUrl("open", campaign.id, sub.user_id) : undefined,
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

/** Correo personalizado: nombre real, etiquetas como botones, pie de soporte y lectura registrada. */
export async function dispatchEmail(
  supabaseAdmin: Admin,
  audience: AudienceRow[],
  campaign: Campaign,
  opts: { testTo?: string } = {},
): Promise<{ sent: number; failed: number; unconfigured: boolean; error?: string }> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { sent: 0, failed: 0, unconfigured: true };
  const { sendLovableEmail } = await import("@lovable.dev/email-js");

  let people = audience.filter((a) => !!a.email);
  if (!opts.testTo && people.length) {
    const off = await supabaseAdmin.from("notification_prefs").select("user_id").eq("email_enabled", false).in("user_id", people.map((p) => p.user_id));
    const blocked = new Set((off.data ?? []).map((p: { user_id: string }) => p.user_id));
    people = people.filter((p) => !blocked.has(p.user_id));
  }
  const names = await namesFor(supabaseAdmin, people.map((p) => p.user_id));

  let sent = 0;
  let failed = 0;
  let lastError: string | undefined;
  for (const person of people) {
    const name = names.get(person.user_id) ?? "";
    const cid = campaign.id;
    const wrapCache = new Map<string, string>();
    if (cid) {
      for (const m of collectUrls(campaign)) wrapCache.set(m, await trackUrl("click", cid, person.user_id, m));
    }
    try {
      const html = renderEmailHtml(
        { ...campaign, subject: campaign.subject || "Novedades de ORÍGEN" },
        {
          name,
          pixelUrl: cid ? await trackUrl("open", cid, person.user_id) : undefined,
          wrap: (u) => wrapCache.get(u) ?? u,
        },
      );
      const res = await sendLovableEmail(
        {
          to: opts.testTo ?? person.email!,
          from: "ORÍGEN <noreply@notify.tuorigen.app>",
          sender_domain: "notify.tuorigen.app",
          subject: personalize(campaign.subject || "Novedades de ORÍGEN", name),
          html,
          text: renderEmailText({ ...campaign, subject: campaign.subject || "" }, name),
          purpose: "transactional",
          idempotency_key: `origen-camp-${cid ?? "x"}-${person.user_id}-${opts.testTo ? Date.now() : new Date().toISOString().slice(0, 13)}`,
        } as Parameters<typeof sendLovableEmail>[0],
        { apiKey },
      );
      if (res.success) sent += 1;
      else {
        failed += 1;
        lastError = JSON.stringify(res).slice(0, 200);
      }
      await logUsage({ kind: "email", feature: "campaña", ok: !!res.success });
    } catch (e) {
      failed += 1;
      lastError = e instanceof Error ? e.message : "error";
      await logUsage({ kind: "email", feature: "campaña", ok: false, error: lastError });
    }
  }
  return { sent, failed, unconfigured: false, error: lastError };
}

/** URLs absolutas que aparecerán en el correo (para envolverlas con registro de clic). */
function collectUrls(c: Campaign): string[] {
  const urls = new Set<string>();
  const abs = (p: string) => (/^https?:/i.test(p) ? p : `${SITE}${p.startsWith("/") ? "" : "/"}${p}`);
  urls.add(abs(c.button_url || "/dashboard"));
  for (const m of c.content.matchAll(/\[enlace:([^\]\s]+)\]/gi)) urls.add(abs(m[1]!));
  for (const m of c.content.matchAll(/\[([a-záéíóúñ]+)\]/gi)) {
    const t = SECTION_TAGS[m[1]!.toLowerCase()];
    if (t) urls.add(abs(t.path));
  }
  for (const m of c.content.matchAll(/https?:\/\/[^\s<)\]]+/g)) urls.add(m[0]);
  return [...urls];
}

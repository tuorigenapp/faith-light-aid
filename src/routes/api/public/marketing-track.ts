import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { verifyTrackToken } from "@/lib/marketing.server";

const PIXEL = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"), (c) => c.charCodeAt(0));

const query = z.object({
  e: z.enum(["open", "click"]),
  c: z.string().uuid(),
  u: z.string().uuid(),
  t: z.string().regex(/^[0-9a-f]{24}$/),
  to: z.string().max(800).optional(),
});

function safeRedirect(to: string | undefined) {
  if (!to) return "https://tuorigen.app/dashboard";
  try {
    const u = new URL(to, "https://tuorigen.app");
    return ["tuorigen.app", "www.tuorigen.app", "faith-light-aid.lovable.app"].includes(u.hostname) ? u.toString() : "https://tuorigen.app/dashboard";
  } catch {
    return "https://tuorigen.app/dashboard";
  }
}

/**
 * Registro en tiempo real de lecturas (píxel del correo / toque en push) y clics.
 * Cada enlace lleva una firma por campaña+persona: sin firma válida no se escribe nada.
 */
export const Route = createFileRoute("/api/public/marketing-track")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = Object.fromEntries(new URL(request.url).searchParams);
        const parsed = query.safeParse(params);
        const isClick = params["e"] === "click";
        const done = () =>
          isClick
            ? Response.redirect(safeRedirect(parsed.success ? parsed.data.to : undefined), 302)
            : new Response(PIXEL, { headers: { "Content-Type": "image/gif", "Cache-Control": "no-store" } });
        if (!parsed.success) return done();
        const { e, c, u, t } = parsed.data;
        if (!(await verifyTrackToken(c, u, t))) return done();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const prev = await supabaseAdmin
          .from("marketing_events")
          .select("event_type")
          .eq("campaign_id", c)
          .eq("user_id", u)
          .in("event_type", ["open", "click"]);
        const had = new Set((prev.data ?? []).map((r) => r.event_type));
        const types = e === "click" ? ["click", ...(had.has("open") ? [] : ["open"])] : ["open"];
        const fresh = types.filter((x) => !had.has(x));
        if (fresh.length) {
          await supabaseAdmin.from("marketing_events").insert(fresh.map((event_type) => ({ campaign_id: c, user_id: u, event_type })));
          const { data: camp } = await supabaseAdmin.from("marketing_campaigns").select("open_count, click_count").eq("id", c).maybeSingle();
          if (camp) {
            await supabaseAdmin
              .from("marketing_campaigns")
              .update({
                open_count: camp.open_count + (fresh.includes("open") ? 1 : 0),
                click_count: camp.click_count + (fresh.includes("click") ? 1 : 0),
              })
              .eq("id", c);
          }
        }
        return done();
      },
    },
  },
});

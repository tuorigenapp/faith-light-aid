import { createFileRoute } from "@tanstack/react-router";
import { authorizedCaller } from "@/lib/cron-auth.server";
import { sendPush, type PushSubscriptionRow } from "@/lib/webpush.server";

const MENSAJES = [
  { title: "Tu Palabra de hoy ya está lista 🕊️", body: "Dos minutos hoy sostienen tu paz y tu racha.", url: "/palabra" },
  { title: "Tu camino te espera", body: "Un paso pequeño hoy cambia la historia de tu linaje.", url: "/etapas" },
  { title: "Respira 5 minutos con nosotros", body: "Pon un audio de reflexión cristiana y encuentra un momento de calma.", url: "/visualiza" },
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
        if (!(await authorizedCaller(request, secret))) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const prefs = await supabaseAdmin.from("notification_prefs").select("user_id").eq("push_enabled", true);
        const ids = (prefs.data ?? []).map((p) => p.user_id);
        if (ids.length === 0) return Response.json({ sent: 0 });

        // Siempre recomendamos algo nuevo, aunque la persona ya haya entrado hoy.
        const targets = ids;

        const subs = await supabaseAdmin
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth, user_id")
          .in("user_id", targets);

        const setting = await supabaseAdmin.from("community_settings").select("value").eq("key", "ai_push").maybeSingle();
        const smart = setting.data?.value !== false;
        const catalog = smart ? await buildCatalog(supabaseAdmin) : [];
        const profs = smart
          ? await supabaseAdmin.from("profiles").select("id, display_name, full_name, interests").in("id", targets)
          : { data: [] };
        const byUser = new Map((profs.data ?? []).map((p) => [p.id, p]));
        let sent = 0;
        const dead: string[] = [];
        for (const sub of (subs.data ?? []) as (PushSubscriptionRow & { user_id: string })[]) {
          try {
            const p = byUser.get(sub.user_id);
            const message = smart && catalog.length
              ? pickFor(catalog, (p?.interests as string[] | null) ?? [], (p?.display_name || p?.full_name || "").split(" ")[0] ?? "")
              : MENSAJES[new Date().getDate() % MENSAJES.length]!;
            const status = await sendPush(sub, message);
            if (status === 404 || status === 410) dead.push(sub.endpoint);
            else if (status >= 200 && status < 300) sent += 1;
          } catch {
            /* seguimos con el resto */
          }
        }
        if (dead.length) await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", dead);

        return Response.json({ sent, skipped: 0 });
      },
    },
  },
});

type Msg = { title: string; body: string; url: string; tags: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildCatalog(admin: any): Promise<Msg[]> {
  const [cats, consultas] = await Promise.all([
    admin.from("manifest_categories").select("id, title, subtitle").eq("is_published", true).limit(60),
    admin.from("custom_consultas").select("slug, title, subtitle").eq("is_published", true).limit(30),
  ]);
  const out: Msg[] = [
    ...MENSAJES.map((m) => ({ ...m, tags: m.title.toLowerCase() })),
    { title: "Tu mentora te escucha", body: "Cuéntale lo que hoy te pesa y recibe una guía para ti.", url: "/chat", tags: "mentora relaciones familia" },
    { title: "¿Tu pareja es de destino?", body: "Mira lo que dicen tu fecha y la suya.", url: "/pareja", tags: "pareja amor relaciones" },
    { title: "Patrones de tu familia", body: "Descubre qué se repite en tu linaje y cómo cortarlo.", url: "/patrones", tags: "familia patrones linaje" },
    { title: "Gira la ruleta de hoy", body: "Hay un premio esperándote en ORÍGEN.", url: "/ruleta", tags: "premios" },
    { title: "Lo nuevo en la comunidad", body: "Otras almas compartieron su avance hoy.", url: "/comunidad", tags: "comunidad" },
  ];
  for (const c of cats.data ?? []) out.push({ title: c.title, body: c.subtitle || "Un audio nuevo te espera en Visualízalo y Vívelo.", url: `/visualiza/${c.id}`, tags: `${c.title} ${c.subtitle ?? ""}`.toLowerCase() });
  for (const c of consultas.data ?? []) out.push({ title: c.title, body: c.subtitle || "Mira lo que esto dice de ti hoy.", url: `/consulta/${c.slug}`, tags: `${c.title} ${c.subtitle ?? ""}`.toLowerCase() });
  return out;
}

/** Elige al azar, dando más peso a lo que coincide con los intereses de la persona. */
function pickFor(catalog: Msg[], interests: string[], name: string) {
  const keys = interests.map((i) => i.toLowerCase());
  const liked = catalog.filter((m) => keys.some((k) => k && m.tags.includes(k)));
  const pool = liked.length && Math.random() < 0.75 ? liked : catalog;
  const m = pool[Math.floor(Math.random() * pool.length)]!;
  return { title: name ? `${name}, ${m.title.charAt(0).toLowerCase()}${m.title.slice(1)}` : m.title, body: m.body, url: m.url };
}

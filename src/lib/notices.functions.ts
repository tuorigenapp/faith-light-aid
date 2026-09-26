import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Crea (una sola vez al día) el mensaje diario de ORÍGEN para la persona. */
export const ensureDailyNotice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const today = new Date().toISOString().slice(0, 10);

    const { data: existing } = await supabaseAdmin
      .from("origen_notifications")
      .select("id")
      .eq("user_id", context.userId)
      .eq("kind", "diario")
      .gte("created_at", `${today}T00:00:00Z`)
      .maybeSingle();
    await ensureReminders(context.userId, today);
    if (existing) return { created: false };

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, display_name, intention, interests, current_stage, consecutive_days")
      .eq("id", context.userId)
      .maybeSingle();

    const name = (profile?.display_name || profile?.full_name || "").split(" ")[0] || "";
    let title = "Tu mensaje de hoy";
    let body =
      "Hoy da un paso pequeño en tu Camino. Un minuto de honestidad contigo vale más que un día entero de prisa.";

    try {
      const { aiJson } = await import("@/lib/ai-content.server");
      const generated = await aiJson<{ title: string; body: string }>(
        `Escribe el mensaje diario de ORÍGEN para ${name || "una persona"}.
Datos: intención "${profile?.intention ?? "sin definir"}", temas de interés ${JSON.stringify(profile?.interests ?? [])}, etapa ${profile?.current_stage ?? 1}, ${profile?.consecutive_days ?? 0} días seguidos.
Devuelve JSON con title (máx 45 caracteres, cálido y concreto) y body (2 frases, máx 220 caracteres, en segunda persona, sin emojis, sin promesas médicas).`,
      );
      if (generated.title) title = generated.title.slice(0, 60);
      if (generated.body) body = generated.body.slice(0, 400);
    } catch {
      /* usamos el mensaje por defecto */
    }

    const { error } = await supabaseAdmin
      .from("origen_notifications")
      .insert({ user_id: context.userId, kind: "diario", title, body, link: "/dashboard" });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { created: true };
  });

export const markNoticesRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ ids: z.array(z.string().uuid()).max(200) }).parse(input))
  .handler(async ({ data, context }) => {
    if (data.ids.length === 0) return { ok: true };
    const { error } = await context.supabase
      .from("origen_notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", data.ids)
      .is("read_at", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const REMINDERS: { type: string[]; title: string; body: string; link: string }[] = [
  { type: ["camino_dia", "stage_completed"], title: "Tu etapa de hoy en Camino ORÍGEN te espera", body: "Hay una lección nueva disponible. Son pocos minutos y sigues avanzando.", link: "/etapas" },
  { type: ["exercise_completed"], title: "Tus ejercicios del día están listos", body: "Completa la lección de hoy y suma progreso hacia tu próxima hoja de sanación.", link: "/ejercicios" },
  { type: ["palabra"], title: "Ya salió la Palabra del día", body: "Léela y juega con ella: cada acierto te acerca a una nueva hoja.", link: "/palabra" },
  { type: ["game_play", "juego"], title: "Tus juegos de hoy suman hojas", body: "Juega hoy y gana hojas para hablar con la mentora Ruth, Patrones familiares, Consulta de pareja o Dios te dice hoy.", link: "/juegos" },
  { type: ["programa_dia", "cristo_369", "manifest_audio"], title: "Tienes audio disponible en Visualízate", body: "Continúa con el audio que elegiste. Tu plan gratis incluye 3 audios; con Camino ORÍGEN se abren todos.", link: "/visualiza" },
];

/** Recordatorios automáticos: uno por sección pendiente al día, sin duplicar. */
async function ensureReminders(userId: string, today: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [activity, sent] = await Promise.all([
    supabaseAdmin.from("daily_activity").select("activity_type").eq("user_id", userId).eq("activity_date", today),
    supabaseAdmin.from("origen_notifications").select("title").eq("user_id", userId).eq("kind", "sistema").gte("created_at", `${today}T00:00:00Z`),
  ]);
  const done = new Set((activity.data ?? []).map((a) => a.activity_type));
  const already = new Set((sent.data ?? []).map((n) => n.title));
  const rows = REMINDERS.filter((r) => !r.type.some((t) => done.has(t)) && !already.has(r.title)).map((r) => ({
    user_id: userId, kind: "sistema", title: r.title, body: r.body, link: r.link,
  }));
  if (rows.length) await supabaseAdmin.from("origen_notifications").insert(rows);
}

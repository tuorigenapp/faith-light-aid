import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Actividad real y anónima de las últimas 24 horas.
 * Nunca inventa números: si no hay actividad suficiente, devuelve lista vacía.
 */
export const getLiveActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 86400000).toISOString();
    const sinceDate = since.slice(0, 10);

    const [nuevos, actividades, consultas, parejas, giros, diario, etapas] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabaseAdmin.from("daily_activity").select("user_id").gte("activity_date", sinceDate).limit(4000),
      supabaseAdmin.from("ministracion_lecturas").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabaseAdmin.from("pareja_lecturas").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabaseAdmin.from("wheel_spins").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabaseAdmin.from("journal_entries").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabaseAdmin.from("stage_rewards").select("id", { count: "exact", head: true }).gte("created_at", since),
    ]);

    const activos = new Set((actividades.data ?? []).map((a) => a.user_id)).size;

    const raw: { icon: string; text: string; count: number }[] = [
      { icon: "sparkles", text: `${nuevos.count ?? 0} personas empezaron su camino hoy`, count: nuevos.count ?? 0 },
      { icon: "users", text: `${activos} personas avanzaron hoy en ORÍGEN`, count: activos },
      { icon: "dove", text: `${consultas.count ?? 0} consultas «Dios te dice hoy» en las últimas 24 h`, count: consultas.count ?? 0 },
      { icon: "heart", text: `${parejas.count ?? 0} lecturas de pareja realizadas hoy`, count: parejas.count ?? 0 },
      { icon: "gift", text: `${giros.count ?? 0} personas giraron la ruleta hoy`, count: giros.count ?? 0 },
      { icon: "book", text: `${diario.count ?? 0} entradas de diario escritas hoy`, count: diario.count ?? 0 },
      { icon: "flag", text: `${etapas.count ?? 0} etapas completadas en las últimas 24 h`, count: etapas.count ?? 0 },
    ];

    // Umbral: por debajo de 3 no se muestra nada (mejor nada que un número bajo).
    return { messages: raw.filter((m) => m.count >= 3).map(({ icon, text }) => ({ icon, text })) };
  });

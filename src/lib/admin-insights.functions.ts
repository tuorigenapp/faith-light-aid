import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Verifica que quien llama sea administrador real (rol en base de datos). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

const PRICE: Record<string, number> = { premium: 14.99, anual: 5.99, camino: 14.99 };

const rangeSchema = z.object({ days: z.number().int().min(1).max(365).default(30) });

/** Ventas reales: suscripciones, ingresos del mes y serie diaria. */
export const adminSales = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => rangeSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date();
    since.setDate(since.getDate() - data.days);

    const [subs, profiles] = await Promise.all([
      supabaseAdmin
        .from("subscriptions")
        .select("user_id, plan, status, current_period_start, current_period_end, created_at")
        .order("created_at", { ascending: false })
        .limit(2000),
      supabaseAdmin.from("profiles").select("id, email, full_name, display_name").limit(3000),
    ]);

    const emailById = new Map(
      (profiles.data ?? []).map((p) => [p.id, p.email ?? p.display_name ?? p.full_name ?? "Sin correo"]),
    );
    const rows = (subs.data ?? []).filter((s) => new Date(s.created_at) >= since);

    const active = (subs.data ?? []).filter((s) => s.status === "active" && s.plan !== "free");
    const trials = (subs.data ?? []).filter((s) => s.status === "trialing");
    const canceled = (subs.data ?? []).filter((s) => s.status === "canceled");
    const mrr = active.reduce((sum, s) => sum + (PRICE[s.plan] ?? 0), 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthRevenue = (subs.data ?? [])
      .filter((s) => s.plan !== "free" && new Date(s.created_at) >= monthStart)
      .reduce((sum, s) => sum + (PRICE[s.plan] ?? 0), 0);

    const byDay = new Map<string, number>();
    for (let i = data.days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      byDay.set(d.toISOString().slice(0, 10), 0);
    }
    for (const s of rows) {
      if (s.plan === "free") continue;
      const key = s.created_at.slice(0, 10);
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }

    return {
      monthRevenue,
      mrr,
      activeCount: active.length,
      trialCount: trials.length,
      canceledCount: canceled.length,
      series: [...byDay.entries()].map(([day, value]) => ({ day: day.slice(5), value })),
      table: rows.slice(0, 200).map((s) => ({
        email: emailById.get(s.user_id) ?? "Sin correo",
        plan: s.plan,
        status: s.status,
        created_at: s.created_at,
        renews: s.current_period_end,
      })),
    };
  });

/** Uso real de la app: activos, secciones, horas y días. */
export const adminUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => rangeSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date();
    since.setDate(since.getDate() - data.days);

    const { data: acts, error } = await supabaseAdmin
      .from("daily_activity")
      .select("user_id, activity_date, activity_type, created_at")
      .gte("activity_date", since.toISOString().slice(0, 10))
      .limit(20000);
    if (error) throw new Error(error.message);

    const today = new Date().toISOString().slice(0, 10);
    const d7 = new Date();
    d7.setDate(d7.getDate() - 7);
    const d30 = new Date();
    d30.setDate(d30.getDate() - 30);

    const uniq = (list: typeof acts) => new Set((list ?? []).map((a) => a.user_id)).size;
    const rows = acts ?? [];

    const sections = new Map<string, number>();
    const hours = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}h`, value: 0 }));
    const weekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((name) => ({ name, value: 0 }));

    for (const a of rows) {
      sections.set(a.activity_type, (sections.get(a.activity_type) ?? 0) + 1);
      const created = new Date(a.created_at);
      hours[created.getHours()]!.value += 1;
      weekdays[created.getDay()]!.value += 1;
    }

    return {
      activeToday: uniq(rows.filter((a) => a.activity_date === today)),
      active7: uniq(rows.filter((a) => new Date(a.activity_date) >= d7)),
      active30: uniq(rows.filter((a) => new Date(a.activity_date) >= d30)),
      total: rows.length,
      sections: [...sections.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 12),
      hours,
      weekdays,
    };
  });

/** Explorador de contenido con conteos reales. */
export const adminContentTree = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [books, cats, audios, stages, exercises, devos] = await Promise.all([
      supabaseAdmin.from("library_items").select("id, title, category, required_plan").order("sort_order"),
      supabaseAdmin
        .from("manifest_categories")
        .select("id, title, group_key, is_published, required_plan")
        .order("sort_order"),
      supabaseAdmin.from("manifest_audios").select("id, category_id, day_index, title, is_published"),
      supabaseAdmin.from("stages").select("id, title").order("id"),
      supabaseAdmin.from("exercises").select("id, title, category").order("sort_order").limit(500),
      supabaseAdmin.from("daily_devotionals").select("id, day_of_year, word").order("day_of_year"),
    ]);

    return {
      books: books.data ?? [],
      categories: cats.data ?? [],
      audios: audios.data ?? [],
      stages: stages.data ?? [],
      exercises: exercises.data ?? [],
      devotionals: devos.data ?? [],
    };
  });

/** Publica o despublica una categoría o audio de Visualiza. */
export const adminTogglePublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        table: z.enum(["manifest_categories", "manifest_audios"]),
        id: z.string().min(1),
        isPublished: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from(data.table)
      .update({ is_published: data.isPublished })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Cambia el título de un elemento de contenido. */
export const adminRenameContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        table: z.enum(["manifest_categories", "manifest_audios", "library_items", "exercises", "stages"]),
        id: z.string().min(1),
        title: z.string().trim().min(2).max(160),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id: string | number = data.table === "stages" ? Number(data.id) : data.id;
    const { error } = await supabaseAdmin
      .from(data.table)
      .update({ title: data.title })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq("id", id as any);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Pide una copia de seguridad: envía un código de 6 dígitos al correo del admin. */
export const adminRequestBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { requestBackupCode } = await import("@/lib/admin-backup.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", context.userId)
      .maybeSingle();
    const email = profile?.email;
    if (!email) throw new Error("Tu perfil no tiene correo: agrégalo antes de pedir la copia.");

    return requestBackupCode(context.userId, email);
  });

/** Confirma el código y devuelve la copia de seguridad del contenido. */
export const adminConfirmBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ code: z.string().trim().length(6) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { confirmBackupCode } = await import("@/lib/admin-backup.server");
    return confirmBackupCode(context.userId, data.code);
  });

/** Historial de copias de seguridad. */
export const adminBackupHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("admin_backups")
      .select("id, email, size_bytes, status, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

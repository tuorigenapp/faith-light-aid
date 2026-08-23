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

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [profiles, subs, roles, activity] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select(
          "id, full_name, display_name, email, country, gems, consecutive_days, created_at, last_activity_at, excluded_from_metrics",
        )
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin.from("subscriptions").select("user_id, plan, status, current_period_end"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin
        .from("daily_activity")
        .select("user_id, activity_date")
        .order("activity_date", { ascending: false })
        .limit(4000),
    ]);

    const subByUser = new Map((subs.data ?? []).map((s) => [s.user_id, s]));
    const rolesByUser = new Map<string, string[]>();
    for (const r of roles.data ?? [])
      rolesByUser.set(r.user_id, [...(rolesByUser.get(r.user_id) ?? []), r.role as string]);
    const actCount = new Map<string, number>();
    for (const a of activity.data ?? [])
      actCount.set(a.user_id, (actCount.get(a.user_id) ?? 0) + 1);

    return (profiles.data ?? []).map((p) => ({
      id: p.id,
      name: p.display_name || p.full_name || null,
      email: p.email ?? null,
      country: p.country ?? null,
      leaves: Math.floor((p.gems ?? 0) / 100),
      streak: p.consecutive_days ?? 0,
      createdAt: p.created_at,
      lastActivityAt: p.last_activity_at ?? null,
      actions: actCount.get(p.id) ?? 0,
      plan: subByUser.get(p.id)?.plan ?? "explorador",
      planStatus: subByUser.get(p.id)?.status ?? "sin datos",
      periodEnd: subByUser.get(p.id)?.current_period_end ?? null,
      roles: rolesByUser.get(p.id) ?? [],
      isAdmin: (rolesByUser.get(p.id) ?? []).includes("admin"),
      excluded: !!p.excluded_from_metrics,
    }));
  });

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        email: z.string().trim().email().max(200),
        fullName: z.string().trim().min(2).max(120),
        plan: z.enum(["explorador", "puente", "camino"]).default("explorador"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const invited = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      data: { full_name: data.fullName },
    });

    let userId = invited.data?.user?.id ?? null;
    if (invited.error) {
      // Ya existía: lo buscamos en profiles para poder asignarle plan.
      const found = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", data.email)
        .maybeSingle();
      if (!found.data) throw new Error(invited.error.message);
      userId = found.data.id;
    }
    if (!userId) throw new Error("No se pudo crear el acceso.");

    if (data.plan !== "explorador") {
      await supabaseAdmin.from("subscriptions").upsert(
        {
          user_id: userId,
          plan: data.plan,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
        },
        { onConflict: "user_id" },
      );
    }

    return { userId, invited: !invited.error };
  });

export const adminSetPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        plan: z.enum(["explorador", "puente", "camino"]),
        months: z.number().int().min(1).max(36).default(12),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date();
    const end = new Date(now.getTime() + data.months * 30 * 86400000);
    const { error } = await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: data.userId,
        plan: data.plan,
        status: data.plan === "explorador" ? "canceled" : "active",
        current_period_start: now.toISOString(),
        current_period_end: data.plan === "explorador" ? null : end.toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("No puedes borrar tu propia cuenta.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ─────────── Roles del equipo (admin, marketing, soporte) ─────────── */

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "marketing", "soporte"]),
        grant: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId && data.role === "admin" && !data.grant)
      throw new Error("No puedes quitarte tu propio acceso de administración.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/** Excluye (o vuelve a incluir) una cuenta del conteo de métricas y ventas. */
export const adminSetExcluded = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid(), excluded: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ excluded_from_metrics: data.excluded })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ─────────── Ventas y uso real de la app ─────────── */

export const adminSalesReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [profiles, subs, activity] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, email, display_name, full_name, created_at, last_activity_at, excluded_from_metrics")
        .limit(2000),
      supabaseAdmin
        .from("subscriptions")
        .select("user_id, plan, status, created_at, current_period_end")
        .limit(2000),
      supabaseAdmin
        .from("daily_activity")
        .select("user_id, activity_type, activity_date, created_at")
        .order("created_at", { ascending: false })
        .limit(8000),
    ]);

    const excluded = new Set(
      (profiles.data ?? []).filter((p) => p.excluded_from_metrics).map((p) => p.id),
    );
    const people = (profiles.data ?? []).filter((p) => !excluded.has(p.id));
    const subsList = (subs.data ?? []).filter((s) => !excluded.has(s.user_id));
    const acts = (activity.data ?? []).filter((a) => !excluded.has(a.user_id));

    const price = (plan: string) => (plan === "annual" ? 71.88 : plan === "puente" ? 2.99 : 14.99);
    const paid = subsList.filter((s) => s.plan !== "explorador" && s.status === "active");
    const canceled = subsList.filter((s) => s.status !== "active" && s.plan !== "explorador");

    // Historial mensual de ventas (12 meses)
    const months: { month: string; ventas: number; ingresos: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const rows = subsList.filter(
        (s) => s.plan !== "explorador" && (s.created_at ?? "").slice(0, 7) === key,
      );
      months.push({
        month: key,
        ventas: rows.length,
        ingresos: Number(rows.reduce((sum, s) => sum + price(s.plan), 0).toFixed(2)),
      });
    }

    // Cuentas sin plan activo (oportunidad de venta)
    const paidIds = new Set(paid.map((s) => s.user_id));
    const sinPlan = people
      .filter((p) => !paidIds.has(p.id))
      .slice(0, 200)
      .map((p) => ({
        name: p.display_name || p.full_name || "Sin nombre",
        email: p.email ?? "—",
        createdAt: p.created_at,
        lastActivityAt: p.last_activity_at ?? null,
      }));

    // Horarios y días con más actividad + secciones más usadas
    const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}h`, value: 0 }));
    const byWeekday = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => ({
      day: d,
      value: 0,
    }));
    const byMonthUse: Record<string, number> = {};
    const bySection: Record<string, number> = {};
    for (const a of acts) {
      const at = new Date(a.created_at);
      byHour[at.getHours()]!.value += 1;
      byWeekday[at.getDay()]!.value += 1;
      const mk = (a.activity_date ?? "").slice(0, 7);
      if (mk) byMonthUse[mk] = (byMonthUse[mk] ?? 0) + 1;
      bySection[a.activity_type] = (bySection[a.activity_type] ?? 0) + 1;
    }
    const bestHour = [...byHour].sort((a, b) => b.value - a.value)[0]?.hour ?? "sin datos";
    const bestDay = [...byWeekday].sort((a, b) => b.value - a.value)[0]?.day ?? "sin datos";

    // Personas más activas (para saber a quién cuidar)
    const perUser = new Map<string, number>();
    for (const a of acts) perUser.set(a.user_id, (perUser.get(a.user_id) ?? 0) + 1);
    const nameOf = new Map(
      people.map((p) => [p.id, p.display_name || p.full_name || p.email || "Sin nombre"]),
    );
    const topUsers = [...perUser.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([id, n]) => ({ name: nameOf.get(id) ?? "Sin nombre", acciones: n }));

    return {
      totals: {
        personas: people.length,
        excluidas: excluded.size,
        activas: paid.length,
        canceladas: canceled.length,
        sinPlan: people.length - paidIds.size,
        ingresosMes: Number(paid.reduce((s, p) => s + price(p.plan) / (p.plan === "annual" ? 12 : 1), 0).toFixed(2)),
        ingresosTotales: Number(months.reduce((s, m) => s + m.ingresos, 0).toFixed(2)),
      },
      months,
      sinPlanList: sinPlan,
      byHour,
      byWeekday,
      byMonthUse: Object.entries(byMonthUse)
        .sort()
        .map(([month, value]) => ({ month, value })),
      bySection: Object.entries(bySection)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([name, value]) => ({ name, value })),
      bestHour,
      bestDay,
      topUsers,
    };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Verifica que quien llama sea administrador real (rol en base de datos). */
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
        .select("id, full_name, display_name, email, country, gems, consecutive_days, created_at, last_activity_at")
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
    const adminIds = new Set((roles.data ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
    const actCount = new Map<string, number>();
    for (const a of activity.data ?? []) actCount.set(a.user_id, (actCount.get(a.user_id) ?? 0) + 1);

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
      isAdmin: adminIds.has(p.id),
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
      const found = await supabaseAdmin.from("profiles").select("id").eq("email", data.email).maybeSingle();
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

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SPIN_COOLDOWN_MS, WHEEL_PRIZES, pickWeightedPrize, prizeByKey } from "@/lib/ruleta";

/** Estado del giro: si puede girar y cuánto falta (calculado contra la BD). */
export const getWheelState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("wheel_spins")
      .select("prize_key, prize_label, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(12);
    const rows = data ?? [];
    const last = rows[0];
    const lastAt = last ? Date.parse(last.created_at) : 0;
    const nextAt = lastAt ? lastAt + SPIN_COOLDOWN_MS : 0;
    return {
      canSpin: Date.now() >= nextAt,
      nextAt,
      serverNow: Date.now(),
      history: rows.map((r) => ({ key: r.prize_key, label: r.prize_label, at: r.created_at })),
    };
  });

/** Gira: elige premio en el servidor, lo guarda y acredita las hojas. */
export const spinWheel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: lastRows } = await supabaseAdmin
      .from("wheel_spins")
      .select("created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1);
    const lastAt = lastRows?.[0] ? Date.parse(lastRows[0].created_at) : 0;
    const nextAt = lastAt ? lastAt + SPIN_COOLDOWN_MS : 0;
    if (Date.now() < nextAt) {
      return { ok: false as const, reason: "cooldown" as const, nextAt, serverNow: Date.now() };
    }

    const { prize, index } = pickWeightedPrize();

    const { error: insertError } = await supabaseAdmin
      .from("wheel_spins")
      .insert({ user_id: context.userId, prize_key: prize.key, prize_label: prize.label });
    if (insertError) {
      return { ok: false as const, reason: "save_failed" as const, nextAt: 0, serverNow: Date.now() };
    }

    if (prize.points > 0) {
      await supabaseAdmin.from("gem_transactions").insert({
        user_id: context.userId,
        amount: prize.points,
        reason: `ruleta:${prize.key}`,
        meta: { prize: prize.label } as never,
      });
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("gems")
        .eq("id", context.userId)
        .maybeSingle();
      await supabaseAdmin
        .from("profiles")
        .update({ gems: (profile?.gems ?? 0) + prize.points })
        .eq("id", context.userId);
    }

    return {
      ok: true as const,
      index,
      prizeKey: prize.key,
      serverNow: Date.now(),
      nextAt: Date.now() + SPIN_COOLDOWN_MS,
    };
  });

/** Estadísticas de la ruleta para el panel de administración. */
export const getWheelStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("wheel_spins")
      .select("user_id, prize_key, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    const rows = data ?? [];
    const since24 = Date.now() - 86400000;
    const byPrize = WHEEL_PRIZES.map((p) => ({
      key: p.key,
      label: p.label,
      icon: p.icon,
      count: rows.filter((r) => r.prize_key === p.key).length,
    })).sort((a, b) => b.count - a.count);

    return {
      totalSpins: rows.length,
      uniqueUsers: new Set(rows.map((r) => r.user_id)).size,
      last24h: rows.filter((r) => Date.parse(r.created_at) >= since24).length,
      byPrize,
      recent: rows.slice(0, 12).map((r) => ({
        label: prizeByKey(r.prize_key).label,
        icon: prizeByKey(r.prize_key).icon,
        at: r.created_at,
      })),
    };
  });

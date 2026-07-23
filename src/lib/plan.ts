import { supabase } from "@/integrations/supabase/client";

export type PlanTier = "explorador" | "camino";

export const PLAN_LIMITS = {
  explorador: {
    chat_message_per_day: 1,
    pareja_read_per_month: 1,
    patron_read_per_month: 1,
    stages_unlocked: 1,
  },
  camino: {
    chat_message_per_day: Infinity,
    pareja_read_per_month: Infinity,
    patron_read_per_month: Infinity,
    stages_unlocked: Infinity,
  },
} as const;

export async function getUserPlan(userId: string): Promise<PlanTier> {
  const { data } = await supabase
    .from("subscriptions")
    .select("status, plan")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .maybeSingle();
  if (data && (data.plan === "camino" || data.plan === "annual" || data.plan === "monthly")) return "camino";
  return "explorador";
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export async function getDailyUsage(userId: string, activityType: string): Promise<number> {
  const { count } = await supabase
    .from("daily_activity")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("activity_type", activityType)
    .eq("activity_date", todayIso());
  return count ?? 0;
}

export async function logActivity(userId: string, activityType: string, metadata?: Record<string, unknown>) {
  await supabase.from("daily_activity").insert({
    user_id: userId,
    activity_type: activityType,
    activity_date: todayIso(),
    reference_id: crypto.randomUUID(),
    metadata: (metadata ?? {}) as never,
  });
}

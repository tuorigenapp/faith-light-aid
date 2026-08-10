import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { getUserPlan } from "@/lib/plan";
import { LIBRARY_RULES, weekStartIso } from "@/lib/biblioteca";

const TYPE = "ebook_unlock";

export function useBiblioteca() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["biblioteca", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [plan, rows] = await Promise.all([
        getUserPlan(user!.id),
        supabase
          .from("daily_activity")
          .select("reference_id, activity_date")
          .eq("user_id", user!.id)
          .eq("activity_type", TYPE),
      ]);
      const all = rows.data ?? [];
      const week = weekStartIso();
      const thisWeek = all.filter((r) => (r.activity_date ?? "") >= week);
      const limit = plan === "camino" ? LIBRARY_RULES.paidPerWeek : LIBRARY_RULES.freeTotal;
      const used = plan === "camino" ? thisWeek.length : all.length;
      return {
        plan,
        unlocked: new Set(all.map((r) => r.reference_id ?? "")),
        limit,
        used,
        remaining: Math.max(0, limit - used),
      };
    },
  });

  const unlock = async (bookId: string) => {
    if (!user) return false;
    const { error } = await supabase.from("daily_activity").insert({
      user_id: user.id,
      activity_type: TYPE,
      activity_date: new Date().toISOString().slice(0, 10),
      reference_id: bookId,
    });
    if (error) return false;
    await qc.invalidateQueries({ queryKey: ["biblioteca"] });
    return true;
  };

  return { ...q, state: q.data, unlock };
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Pendings = {
  notices: number;
  camino: boolean;
  ejercicios: boolean;
  palabra: boolean;
  visualiza: boolean;
  arbol: boolean;
  ruleta: boolean;
  comunidad: boolean;
  compras: boolean;
  transferencias: boolean;
};

/** Bolitas rojas: qué tiene pendiente la persona hoy. */
export function useOrigenPendings(userId?: string) {
  return useQuery({
    queryKey: ["origen-pendings", userId],
    enabled: !!userId,
    refetchInterval: 45000,
    queryFn: async (): Promise<Pendings> => {
      const today = new Date().toISOString().slice(0, 10);
      const [notices, activity, community, purchases, transfers, family, spins] = await Promise.all([
        supabase
          .from("origen_notifications")
          .select("id")
          .eq("user_id", userId!)
          .is("read_at", null)
          .limit(50),
        supabase
          .from("daily_activity")
          .select("activity_type")
          .eq("user_id", userId!)
          .eq("activity_date", today),
        supabase
          .from("community_notifications")
          .select("id")
          .eq("user_id", userId!)
          .is("read_at", null)
          .limit(1),
        supabase
          .from("purchase_requests")
          .select("id")
          .eq("user_id", userId!)
          .in("status", ["pendiente", "revision"])
          .limit(1),
        supabase
          .from("hoja_transfers")
          .select("id")
          .eq("user_id", userId!)
          .in("status", ["pending", "pendiente", "revision"])
          .limit(1),
        supabase.from("family_members").select("id").eq("user_id", userId!).limit(1),
        supabase
          .from("wheel_spins")
          .select("id")
          .eq("user_id", userId!)
          .gte("created_at", `${today}T00:00:00Z`)
          .limit(1),
      ]);

      const types = new Set((activity.data ?? []).map((a) => a.activity_type));
      const seen = (key: string) => types.has(`visto_${key}`);

      return {
        notices: (notices.data ?? []).length,
        camino: !seen("camino") && !types.has("camino_dia") && !types.has("stage_completed"),
        ejercicios: !seen("ejercicios") && !types.has("exercise_completed"),
        palabra: !seen("palabra") && !types.has("palabra"),
        visualiza: !seen("visualiza") && !types.has("programa_dia") && !types.has("cristo_369") && !types.has("manifest_audio"),
        arbol: !seen("arbol") && (family.data ?? []).length === 0,
        ruleta: !seen("ruleta") && (spins.data ?? []).length === 0,
        comunidad: (community.data ?? []).length > 0,
        compras: !seen("compras") && (purchases.data ?? []).length > 0,
        transferencias: !seen("transferencias") && (transfers.data ?? []).length > 0,
      };
    },
  });
}

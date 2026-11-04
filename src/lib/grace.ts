import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type GraceRow = {
  id: string; user_id: string; days: number; status: string; reason: string;
  starts_at: string | null; ends_at: string | null; purge_at: string | null; from_plan: string | null;
  admin_note: string | null; created_at: string;
};

export type GraceState =
  | { kind: "none" }
  | { kind: "requested"; row: GraceRow }
  | { kind: "active"; row: GraceRow; day: number; daysLeft: number; warn: boolean }
  | { kind: "locked"; row: GraceRow; purgeAt: Date; daysToPurge: number };

const DAY = 86_400_000;

/** Estado del período de gracia a partir de la fila guardada en el servidor. */
export function graceState(row: GraceRow | null | undefined, now: Date = new Date()): GraceState {
  if (!row) return { kind: "none" };
  if (row.status === "requested") return { kind: "requested", row };
  if (row.status !== "active" || !row.starts_at || !row.ends_at) return { kind: "none" };
  const start = new Date(row.starts_at).getTime();
  const end = new Date(row.ends_at).getTime();
  if (now.getTime() >= end) {
    const purgeAt = row.purge_at ? new Date(row.purge_at) : new Date(end + 30 * DAY);
    return { kind: "locked", row, purgeAt, daysToPurge: Math.max(0, Math.ceil((purgeAt.getTime() - now.getTime()) / DAY)) };
  }
  const day = Math.min(row.days, Math.floor((now.getTime() - start) / DAY) + 1);
  const daysLeft = Math.max(1, Math.ceil((end - now.getTime()) / DAY));
  // Aviso en los últimos 3 días: 5-7 (de 7) o 12-14 (de 14).
  return { kind: "active", row, day, daysLeft, warn: day >= row.days - 2 };
}

export function useGrace(userId: string | undefined) {
  return useQuery({
    queryKey: ["grace", userId],
    enabled: !!userId,
    refetchInterval: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("grace_periods").select("*").eq("user_id", userId!).maybeSingle();
      return (data as GraceRow | null) ?? null;
    },
  });
}

export function longDate(d: Date): string {
  return d.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
}

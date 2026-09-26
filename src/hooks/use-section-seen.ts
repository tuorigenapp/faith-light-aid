import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Secciones con bolita roja y las rutas que cuentan como "ya lo vi". */
export const SECTION_ROUTES: { key: string; prefixes: string[] }[] = [
  { key: "camino", prefixes: ["/etapas", "/caminos", "/camino-nuevo", "/categorias"] },
  { key: "ejercicios", prefixes: ["/ejercicios"] },
  { key: "palabra", prefixes: ["/palabra"] },
  { key: "visualiza", prefixes: ["/visualiza", "/programas"] },
  { key: "arbol", prefixes: ["/arbol"] },
  { key: "ruleta", prefixes: ["/ruleta"] },
  { key: "comunidad", prefixes: ["/comunidad"] },
  { key: "compras", prefixes: ["/comprarmonedas", "/historial"] },
  { key: "transferencias", prefixes: ["/historial"] },
  { key: "juegos", prefixes: ["/juegos"] },
];

export function sectionFor(pathname: string, search = "") {
  const keys = SECTION_ROUTES.filter((s) => s.prefixes.some((p) => pathname.startsWith(p))).map((s) => s.key);
  if (pathname.startsWith("/arbol") && search.includes("transferir")) keys.push("transferencias");
  return keys;
}

/**
 * Al entrar a una sección se marca como vista (en el servidor) y se leen
 * los avisos de ORÍGEN que apuntaban a esa sección.
 */
export function useSectionSeen(userId: string | undefined, pathname: string, search: string) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const keys = sectionFor(pathname, search);
    if (keys.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    let cancelled = false;
    (async () => {
      const now = new Date().toISOString();
      const prefixes = SECTION_ROUTES.filter((s) => keys.includes(s.key)).flatMap((s) => s.prefixes);
      const tasks: PromiseLike<unknown>[] = [];
      for (const key of keys) {
        const mark = `origen-seen-${userId}-${today}-${key}`;
        if (sessionStorage.getItem(mark)) continue;
        sessionStorage.setItem(mark, "1");
        tasks.push(
          supabase.from("daily_activity").insert({
            user_id: userId,
            activity_date: today,
            activity_type: `visto_${key}`,
          }),
        );
      }
      // Avisos de ORÍGEN que llevan a esta sección → leídos.
      const { data: unread } = await supabase
        .from("origen_notifications")
        .select("id, link")
        .eq("user_id", userId)
        .is("read_at", null)
        .limit(100);
      const ids = (unread ?? [])
        .filter((n) => n.link && prefixes.some((p) => (n.link as string).startsWith(p)))
        .map((n) => n.id);
      if (ids.length) tasks.push(supabase.from("origen_notifications").update({ read_at: now }).in("id", ids));
      if (keys.includes("comunidad")) {
        tasks.push(
          supabase.from("community_notifications").update({ read_at: now }).eq("user_id", userId).is("read_at", null),
        );
      }
      await Promise.all(tasks);
      if (cancelled) return;
      qc.invalidateQueries({ queryKey: ["origen-pendings"] });
      qc.invalidateQueries({ queryKey: ["community-notifications"] });
      qc.invalidateQueries({ queryKey: ["origen-notices"] });
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId, pathname, search, qc]);
}

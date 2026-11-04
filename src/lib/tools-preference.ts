import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Cómo prefiere recibir sus herramientas diarias (pregunta del onboarding). */
export type ToolsPref = "audio" | "practica" | "fe";

export function normalizePref(raw: unknown): ToolsPref | null {
  const v = String(raw ?? "").toLowerCase();
  if (!v) return null;
  if (v === "audio" || v === "musica" || v.includes("audio") || v.includes("música") || v.includes("musica")) return "audio";
  if (v === "practica" || v.includes("práctic") || v.includes("practic") || v.includes("ejercicio")) return "practica";
  if (v === "fe" || v.includes("fe") || v.includes("sabiduría")) return "fe";
  return null;
}

/** Elementos abiertos en el plan gratis dentro de cada método de Visualízalo. */
export function freeItemsFor(pref: ToolsPref | null): number {
  return pref ? 3 : 2;
}

export type Recommendation = { to: string; title: string; body: string; urgent?: boolean };

const COMMON: Recommendation[] = [
  { to: "/etapas", title: "Sigue tus 20 etapas", body: "Tu Camino ORÍGEN sigue intacto: un paso de 5 minutos hoy." },
  { to: "/arbol", title: "Completa tu árbol familiar", body: "Ver tres generaciones aclara de dónde viene lo que repites." },
  { to: "/comunidad", title: "Comenta en la comunidad", body: "Comparte un paso y gana hojas en la ruleta y los juegos." },
  { to: "/diario", title: "Escribe en tu diario", body: "Dos líneas sobre lo que sentiste hoy ya cuentan." },
  { to: "/consultas", title: "Haz una consulta", body: "Elige la que va con lo que estás viviendo ahora." },
];

/** Lo que tus mentoras te recomiendan según tu respuesta del onboarding. */
export function recommendationsFor(pref: ToolsPref | null): Recommendation[] {
  if (pref === "audio")
    return [
      { to: "/visualiza", title: "Escucha tus audios de Visualízalo", body: "Tienes abiertos hasta el día 3 de cada método: respiración y afirmaciones." },
      { to: "/palabra", title: "Lee la Palabra del día", body: "Un versículo para acompañar tu audio de hoy." },
      ...COMMON,
    ];
  if (pref === "practica")
    return [
      { to: "/ejercicios", title: "Haz tu ejercicio de hoy", body: "Práctica y reflexión: tienes abiertos los primeros 3 días de cada método." },
      { to: "/categorias", title: "Empieza un camino", body: "Cada camino abre sus primeros 3 días sin costo para ti." },
      { to: "/palabra", title: "Lee la Palabra del día", body: "Una reflexión corta antes de tu práctica." },
      ...COMMON,
    ];
  if (pref === "fe")
    return [
      { to: "/palabra", title: "Lee la Palabra del día", body: "Hoy es lo más importante para ti: empieza aquí.", urgent: true },
      { to: "/visualiza", title: "Enseñanzas de fe en Visualízalo", body: "Te abrimos 3 días de los métodos con enseñanza bíblica." },
      { to: "/ejercicios", title: "Haz tu ejercicio de hoy", body: "Reflexión práctica de 5 minutos." },
      ...COMMON,
    ];
  return COMMON;
}

export function useToolsPref(userId: string | undefined) {
  return useQuery({
    queryKey: ["tools-pref", userId],
    enabled: !!userId,
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<ToolsPref | null> => {
      const { data } = await supabase.from("intake_sessions").select("childhood").eq("user_id", userId!).maybeSingle();
      const fromDb = normalizePref((data?.childhood as { guia?: string } | null)?.guia);
      if (fromDb) return fromDb;
      try {
        return normalizePref(JSON.parse(localStorage.getItem("origen_preonboarding") || "{}").guia);
      } catch {
        return null;
      }
    },
  });
}

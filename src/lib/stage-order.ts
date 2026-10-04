import { appDayKey, appDayStart } from "@/lib/app-day";

export const KEY_TO_FOCUS: Record<string, string> = {
  familia: "restauración familiar",
  autoestima: "identidad",
  ansiedad: "sanidad emocional",
  espiritual: "reconexión",
  fe: "reconexión",
  habitos: "disciplina espiritual",
  proposito: "propósito",
  emocional: "sanidad emocional",
};

export function getRecommendedFocuses(intake: any): string[] {
  const plan = intake?.ai_plan ?? {};
  const raw = [intake?.primary_focus, ...(plan.recommended_categories ?? [])]
    .filter(Boolean)
    .map((x: string) => x.toLowerCase());
  const focuses = raw
    .flatMap((k: string) => [
      KEY_TO_FOCUS[k],
      ...Object.entries(KEY_TO_FOCUS)
        .filter(([key]) => k.includes(key))
        .map(([, value]) => value),
    ])
    .filter(Boolean);
  return Array.from(new Set(focuses.length ? focuses : ["reconexión", "sanidad emocional", "identidad"])).slice(0, 4);
}

export function orderStages<T extends { id: number; focus_area?: string | null }>(stages: T[], focuses: string[]): T[] {
  return [...stages].sort((a, b) => {
    const af = focuses.findIndex((f) => (a.focus_area ?? "").toLowerCase().includes(f));
    const bf = focuses.findIndex((f) => (b.focus_area ?? "").toLowerCase().includes(f));
    const ar = af === -1 ? 99 : af;
    const br = bf === -1 ? 99 : bf;
    return ar - br || a.id - b.id;
  });
}

export type StageState = "completed" | "open" | "locked-today" | "locked-sequential";

export type ProgressRow = { stage_id: number; status?: string | null; completed_at?: string | null };

/** ¿Se completó dentro del día actual de la app (reseteo 12:00 PM)? */
export function completedInAppDay(completedAt?: string | null) {
  if (!completedAt) return false;
  return new Date(completedAt).getTime() >= appDayStart().getTime();
}

/**
 * Estado de cada etapa según el día de la app (reseteo 12:00 de la noche).
 *
 * Reglas:
 *  - Una etapa completada queda completada.
 *  - Si ya completaste una etapa en este día de la app, las demás quedan
 *    en espera hasta la medianoche.
 *  - Si no, TODAS las etapas sin completar están abiertas hoy: el usuario
 *    elige cuál vivir (una por día).
 */
export function resolveStageStates(orderedIds: number[], progress: ProgressRow[]): Map<number, StageState> {
  const completed = new Set(progress.filter((p) => p.status === "completed").map((p) => p.stage_id));
  const doneToday = progress.some((p) => p.status === "completed" && completedInAppDay(p.completed_at));
  const states = new Map<number, StageState>();
  // Regla fija: solo UNA lección abierta por día (se abre a las 12:00 a. m.).
  let nextAssigned = false;
  for (const id of orderedIds) {
    if (completed.has(id)) {
      states.set(id, "completed");
      continue;
    }
    if (!nextAssigned) {
      nextAssigned = true;
      states.set(id, doneToday ? "locked-today" : "open");
    } else {
      states.set(id, "locked-sequential");
    }
  }
  return states;
}


export const currentAppDayKey = appDayKey;

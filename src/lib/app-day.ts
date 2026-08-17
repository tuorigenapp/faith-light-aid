/**
 * Día de la aplicación con reseteo a las 12:00 PM (mediodía).
 *
 * Regla: después de las 12:00 PM ya cuenta como el día siguiente.
 * Todo lo que sea "una vez al día" (hojas, chat, etapas, quiz) usa esto.
 */

const NOON = 12;

/** Inicio del día de la app (12:00 PM de hoy o de ayer). */
export function appDayStart(now: Date = new Date()): Date {
  const d = new Date(now);
  if (d.getHours() >= NOON) {
    d.setHours(NOON, 0, 0, 0);
  } else {
    d.setDate(d.getDate() - 1);
    d.setHours(NOON, 0, 0, 0);
  }
  return d;
}

/** Fin del día de la app (siguiente 12:00 PM). */
export function appDayEnd(now: Date = new Date()): Date {
  const d = appDayStart(now);
  d.setDate(d.getDate() + 1);
  return d;
}

export function appDayStartIso(now: Date = new Date()) {
  return appDayStart(now).toISOString();
}

/** Clave estable del día de la app: "2026-08-17". */
export function appDayKey(now: Date = new Date()): string {
  const d = appDayStart(now);
  d.setDate(d.getDate() + 1); // el día de la app nombra la jornada que empieza al mediodía
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Número de días de la app transcurridos desde una fecha. */
export function appDaysSince(from: string | Date): number {
  const start = appDayStart(new Date(from));
  const now = appDayStart();
  return Math.max(0, Math.round((now.getTime() - start.getTime()) / 86400000));
}

/** Cuenta regresiva legible hasta el próximo reseteo (12:00 PM). */
export function msUntilAppDayReset(now: Date = new Date()) {
  return Math.max(0, appDayEnd(now).getTime() - now.getTime());
}

export function formatCountdown(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/**
 * Recordatorios motivacionales de ORÍGEN.
 * Se muestran cada 2–3 horas mientras el usuario tiene la app abierta,
 * y como notificación del sistema si dio permiso. Nunca más de uno cada 2 horas.
 */
import { permissionState } from "@/lib/notifications";

export type Reminder = { title: string; body: string; url: string };

export const REMINDERS: Reminder[] = [
  { title: "¿Qué dice el cielo hoy sobre tu vida?", body: "Tu Palabra de hoy ya está lista. Dos minutos y cambia tu día.", url: "/palabra" },
  { title: "¿Por qué se repiten las mismas cosas?", body: "Descubre el patrón familiar que se está repitiendo en tu línea paterna o materna.", url: "/patrones" },
  { title: "¿Tu relación es deuda ancestral o propósito?", body: "La lectura de pareja te lo dice con nombre y apellido.", url: "/pareja" },
  { title: "Dios te dice hoy", body: "Pregunta lo que te arde. Recibe dictamen, señales y tu paso concreto.", url: "/ministracion" },
  { title: "Tu etapa del día te espera", body: "En «Mi camino ORÍGEN» te toca una sola etapa hoy. Ni más, ni menos.", url: "/etapas" },
  { title: "Tus categorías siguen abiertas", body: "Sanar al niño interior, Glow Up, Vuélvete magnético… avanza un día.", url: "/categorias" },
  { title: "Visualízalo y Vívelo", body: "Tu audio guiado del día: afirmación, identidad, gratitud y petición.", url: "/visualiza" },
  { title: "El ejercicio del día es corto", body: "5 minutos hoy valen más que una semana perfecta que nunca empieza.", url: "/ejercicios" },
  { title: "Escribe lo que no puedes decir", body: "Tu diario íntimo es solo tuyo. Sácalo del pecho y déjalo escrito.", url: "/diario" },
  { title: "Tu biblioteca digital te espera", body: "82 libros para tu proceso: identidad, perdón, propósito y prosperidad.", url: "/biblioteca" },
  { title: "¿Sin hojas de sanación?", body: "Juega y gana progreso hacia tu próxima hoja para seguir con tus consultas.", url: "/comprarmonedas" },
  { title: "Tu giro de hoy está disponible", body: "Gira la ruleta: siempre ganas algo. Una vez cada 24 horas.", url: "/ruleta" },
  { title: "Tu árbol quiere sanar", body: "Agrega a tu familia y mira qué se está repitiendo de generación en generación.", url: "/arbol" },
  { title: "La mentora está lista para ti", body: "Cuéntale dónde estás hoy. Te responde desde tu historia, no con frases hechas.", url: "/chat" },
  { title: "No pierdas tu racha", body: "Un paso hoy sostiene lo que empezaste. Tu constancia es la señal.", url: "/dashboard" },
];

const TOPIC_WORDS: Record<string, string[]> = {
  "/patrones": ["famil", "patr", "linaje", "padre", "madre", "repit"],
  "/pareja": ["pareja", "relaci", "amor", "matrimon", "narcis"],
  "/ministracion": ["dios", "fe", "respuesta", "guía", "proposit"],
  "/visualiza": ["paz", "ansied", "calma", "sueño", "abundan", "prosper"],
  "/categorias": ["niño", "autoestima", "glow", "valor", "depres", "pérdida", "duelo"],
  "/diario": ["emoc", "vacío", "tristeza", "llorar"],
  "/arbol": ["famil", "árbol", "herencia"],
};

/** Personalised pick: favours reminders matching the person's interests, never the page they are on, never twice in a row. */
export function pickReminder(interests: string, currentPath: string): Reminder {
  const text = interests.toLowerCase();
  const last = typeof window !== "undefined" ? localStorage.getItem("origen_reminder_lastUrl") : null;
  const pool = REMINDERS.filter((r) => r.url !== currentPath && r.url !== last);
  const scored = pool.map((r) => ({ r, score: (TOPIC_WORDS[r.url] ?? []).some((w) => text.includes(w)) ? 3 : 1 }));
  const total = scored.reduce((n, x) => n + x.score, 0);
  let roll = Math.random() * total;
  const chosen = scored.find((x) => (roll -= x.score) < 0)?.r ?? pool[0] ?? REMINDERS[0]!;
  if (typeof window !== "undefined") localStorage.setItem("origen_reminder_lastUrl", chosen.url);
  return chosen;
}

export async function pushReminder(r: Reminder) {
  if (permissionState() !== "granted") return;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    if (reg) {
      const options: NotificationOptions = {
        body: r.body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: `origen-reminder-${r.url}`,
        data: { url: r.url },
      };
      // @ts-expect-error renotify no está tipado en NotificationOptions estándar del DOM
      options.renotify = false;
      await reg.showNotification(`tuorigen.app · ${r.title}`, options);
    }
  } catch {
    /* noop */
  }
}

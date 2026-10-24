/**
 * Contenido y utilidades deterministas para los toasts de actividad social.
 * Las cifras se derivan de la fecha (día de la app) + franja horaria, siempre
 * crecientes durante el día, sin saltos inverosímiles y nunca inventando
 * nombres reales de usuarios.
 */

export type SocialProofMessage = { icon: string; text: string };

/** Nombres de pila + inicial (nunca apellidos completos ni personas reales). */
const FIRST_NAMES = [
  "Ana M.",
  "Carlos R.",
  "Sofía L.",
  "Miguel A.",
  "Valentina P.",
  "Diego F.",
  "Camila S.",
  "Andrés T.",
  "Lucía G.",
  "Javier N.",
  "Mariana O.",
  "Fernando B.",
  "Paola V.",
  "Ricardo D.",
  "Daniela H.",
];

// --------------------------- Números deterministas ---------------------------

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededFraction(seed: string): number {
  return (hashString(seed) % 10000) / 10000;
}

/**
 * Cifra determinista para `label` en el día `dayKey`, que crece de forma
 * monótona a lo largo del día (por franjas horarias) y cambia cada día.
 * Nunca baja durante el mismo día y nunca da saltos grandes de golpe.
 */
export function deterministicCount(
  label: string,
  opts: { min: number; max: number; dayKey: string; now?: Date },
): number {
  const { min, max, dayKey } = opts;
  const now = opts.now ?? new Date();
  const mid = min + (max - min) * 0.55;
  const base = min + seededFraction(`${label}|${dayKey}`) * (mid - min);

  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  const hourSlot = Math.floor(minutesSinceMidnight / 60); // 0..23
  const stepMax = (max - mid) / 24;

  let cumulative = 0;
  for (let h = 0; h <= hourSlot; h++) {
    cumulative += seededFraction(`${label}|${dayKey}|${h}`) * stepMax;
  }

  const value = Math.round(base + cumulative);
  return Math.min(max, Math.max(min, value));
}

/** Elige un nombre distinto para cada franja de ~2h, estable dentro del mismo día. */
function nameForSlot(label: string, dayKey: string, now: Date): string {
  const slot = Math.floor((now.getHours() * 60 + now.getMinutes()) / 120);
  const idx = hashString(`${label}|${dayKey}|name|${slot}`) % FIRST_NAMES.length;
  return FIRST_NAMES[idx]!;
}

// --------------------------- Pools de contenido ---------------------------

type Template =
  | { kind: "name"; icon: string; label: string; build: (name: string) => string }
  | {
      kind: "count";
      icon: string;
      label: string;
      min: number;
      max: number;
      build: (count: number) => string;
    };

const LANDING_TEMPLATES: Template[] = [
  {
    kind: "name",
    icon: "sparkles",
    label: "landing-start",
    build: (n) => `${n} acaba de empezar su Camino ORÍGEN`,
  },
  {
    kind: "count",
    icon: "users",
    label: "landing-diagnostico",
    min: 18,
    max: 52,
    build: (c) => `${c} personas hicieron su diagnóstico esta semana`,
  },
  {
    kind: "name",
    icon: "sun",
    label: "landing-palabra",
    build: (n) => `${n} desbloqueó su Palabra de hoy`,
  },
  {
    kind: "count",
    icon: "gift",
    label: "landing-prueba",
    min: 4,
    max: 13,
    build: (c) => `${c} personas activaron su prueba de 7 días hoy`,
  },
  {
    kind: "name",
    icon: "compass",
    label: "landing-camino",
    build: (n) => `${n} avanzó un día más en su Camino`,
  },
  {
    kind: "count",
    icon: "heart",
    label: "landing-activas",
    min: 9,
    max: 31,
    build: (c) => `${c} personas están activas en ORÍGEN ahora mismo`,
  },
  {
    kind: "name",
    icon: "eye",
    label: "landing-visualiza",
    build: (n) => `${n} terminó su ejercicio de Visualízalo y Vívelo`,
  },
];

const APP_TEMPLATES: Template[] = [
  { kind: "count", icon: "practice", label: "app-ejercicio", min: 14, max: 46, build: (c) => `${c} personas completaron su ejercicio de hoy` },
  { kind: "name", icon: "star", label: "app-camino", build: (n) => `${n} terminó un día más de su Camino ORÍGEN` },
  { kind: "count", icon: "headphones", label: "app-visualiza", min: 6, max: 22, build: (c) => `${c} personas escucharon un audio de Visualízalo y Vívelo esta mañana` },
  { kind: "name", icon: "cross", label: "app-palabra", build: (n) => `${n} recibió su Palabra de hoy` },
  { kind: "count", icon: "book", label: "app-diario", min: 5, max: 19, build: (c) => `${c} personas escribieron en su Diario hoy` },
  { kind: "name", icon: "butterfly", label: "app-arbol", build: (n) => `${n} sumó una hoja en su Árbol de Sanación` },
  { kind: "count", icon: "heartgem", label: "app-mentor", min: 4, max: 16, build: (c) => `${c} personas conversaron con la mentora hoy` },
  { kind: "name", icon: "couple", label: "app-pareja", build: (n) => `${n} abrió su Consulta de pareja` },
  { kind: "name", icon: "brain", label: "app-patrones", build: (n) => `${n} exploró sus patrones familiares` },
  { kind: "count", icon: "clouds", label: "app-ministracion", min: 3, max: 12, build: (c) => `${c} personas recibieron su «Dios te dice hoy»` },
  { kind: "name", icon: "star", label: "app-etapas", build: (n) => `${n} completó una etapa de Mi camino ORÍGEN` },
  { kind: "count", icon: "coin", label: "app-premios", min: 3, max: 11, build: (c) => `${c} personas ganaron una recompensa en Premios ORÍGEN` },
  { kind: "name", icon: "coin", label: "app-ruleta", build: (n) => `${n} giró la Ruleta y recibió una sorpresa` },
  { kind: "count", icon: "book", label: "app-biblioteca", min: 4, max: 15, build: (c) => `${c} personas leyeron un libro de la Biblioteca` },
  { kind: "name", icon: "practice", label: "app-juegos", build: (n) => `${n} terminó un juego de sanación` },
  { kind: "count", icon: "heart-purple", label: "app-comunidad", min: 5, max: 18, build: (c) => `${c} personas oraron por alguien en la Comunidad` },
  { kind: "name", icon: "heartgem", label: "app-mensajes", build: (n) => `${n} leyó su Mensaje ORÍGEN del día` },
];

function buildFromTemplate(t: Template, dayKey: string, now: Date): SocialProofMessage {
  if (t.kind === "name") {
    return { icon: t.icon, text: t.build(nameForSlot(t.label, dayKey, now)) };
  }
  const count = deterministicCount(t.label, { min: t.min, max: t.max, dayKey, now });
  return { icon: t.icon, text: t.build(count) };
}

/** Orden deterministamente distinto cada día, sin repetir consecutivos. */
function shuffledByDay<T>(items: T[], dayKey: string, salt: string): T[] {
  const withKeys = items.map((item, i) => ({
    item,
    key: seededFraction(`${salt}|${dayKey}|${i}`),
  }));
  withKeys.sort((a, b) => a.key - b.key);
  return withKeys.map((w) => w.item);
}

/**
 * Construye la lista de mensajes para una variante. Si se pasan `realMessages`
 * (datos reales agregados de la app), se intercalan con prioridad sobre las
 * cifras de respaldo, sin exponer nunca nombres reales.
 */
export function buildSocialProofMessages(
  variant: "landing" | "app",
  dayKey: string,
  realMessages?: SocialProofMessage[],
  now: Date = new Date(),
): SocialProofMessage[] {
  const templates = variant === "landing" ? LANDING_TEMPLATES : APP_TEMPLATES;
  const fallback = shuffledByDay(templates, dayKey, variant).map((t) =>
    buildFromTemplate(t, dayKey, now),
  );

  if (variant === "app" && realMessages && realMessages.length > 0) {
    const merged: SocialProofMessage[] = [];
    const max = Math.max(realMessages.length, fallback.length);
    for (let i = 0; i < max; i++) {
      if (realMessages[i]) merged.push(realMessages[i]!);
      if (fallback[i]) merged.push(fallback[i]!);
    }
    return merged;
  }

  return fallback;
}

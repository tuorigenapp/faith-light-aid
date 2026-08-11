import { supabase } from "@/integrations/supabase/client";

/**
 * Sistema de Hojas de Sanación (balanceo por micro-acciones + ponderación por sección).
 *
 * 1 hoja = 100 puntos internos.
 * Tope diario global: 0.333 hoja (33 puntos).
 * Tope por sección/módulo al día: 0.10 hoja (10 puntos).
 *
 * Puntuación por tipo de acción:
 *  - minor  (abrir pantalla, ver contenido corto)      → 0.01 hoja
 *  - medium (registro rápido, responder algo simple)   → 0.02 hoja
 *  - major  (terminar lección / módulo completo)       → 0.05 hoja
 *
 * Con estas reglas, alcanzar 1 hoja completa toma al menos 3 días.
 */
export const HOJA_POINTS = 100;
export const DAILY_CAP_POINTS = 33; // 0.333 hoja
export const SECTION_CAP_POINTS = 10; // 0.10 hoja

export type ActionLevel = "minor" | "medium" | "major";

export const ACTION_POINTS: Record<ActionLevel, number> = {
  minor: 1,
  medium: 2,
  major: 5,
};

export const LEAF_RULES_TEXT = [
  "Meta: 1.00 hoja de sanación.",
  "Máximo 0.333 hoja por día (se reinicia cada 24 h).",
  "Máximo 0.10 hoja por sección al día: interactúa en distintas secciones.",
  "Acciones pequeñas 0.01 · intermedias 0.02 · principales 0.05.",
  "Por eso completar 1 hoja toma al menos 3 días.",
] as const;

/** Formatea puntos internos como hojas (2 decimales). */
export function formatHojas(points: number | null | undefined) {
  return ((points ?? 0) / HOJA_POINTS).toFixed(2);
}

/** Hojas enteras disponibles (para gastar). */
export function wholeHojas(points: number | null | undefined) {
  return Math.floor((points ?? 0) / HOJA_POINTS);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function startOfDayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function slug(s: string) {
  return (s || "app")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 28);
}

export type LeafAwardResult = {
  granted: number;
  points: number;
  balance: number | null;
  capped: "none" | "daily" | "section";
  dailyRemaining: number;
  sectionRemaining: number;
};

async function todayTotals(section: string) {
  const { data } = await supabase
    .from("gem_transactions")
    .select("amount, reason")
    .gte("created_at", startOfDayIso())
    .gt("amount", 0);
  const rows = data ?? [];
  const daily = rows.reduce((a, r) => a + (r.amount ?? 0), 0);
  const sec = rows
    .filter((r) => (r.reason ?? "").startsWith(`leaf:${section}:`))
    .reduce((a, r) => a + (r.amount ?? 0), 0);
  return { daily, sec };
}

/**
 * Otorga hojas con topes diario y por sección.
 * `section` identifica el módulo (ej: "etapas", "ejercicios", "juegos", "chat").
 */
export async function awardLeaf(
  section: string,
  level: ActionLevel,
  label?: string,
  meta?: Record<string, unknown>,
): Promise<LeafAwardResult> {
  const sec = slug(section);
  const want = ACTION_POINTS[level];
  const { daily, sec: used } = await todayTotals(sec);
  const dailyRemaining = Math.max(0, DAILY_CAP_POINTS - daily);
  const sectionRemaining = Math.max(0, SECTION_CAP_POINTS - used);
  const granted = Math.max(0, Math.min(want, dailyRemaining, sectionRemaining));

  if (granted <= 0) {
    return {
      granted: 0,
      points: want,
      balance: null,
      capped: dailyRemaining <= 0 ? "daily" : "section",
      dailyRemaining,
      sectionRemaining,
    };
  }

  const { data, error } = await supabase.rpc("award_gems", {
    _amount: granted,
    _reason: `leaf:${sec}:${level}${label ? ` · ${label}` : ""}`,
    _meta: ({ ...(meta ?? {}), section: sec, level, day: todayIso() }) as never,
  });
  if (error) {
    console.error("[hojas] award failed", error);
    return { granted: 0, points: want, balance: null, capped: "none", dailyRemaining, sectionRemaining };
  }
  return {
    granted,
    points: want,
    balance: data as number,
    capped: granted < want ? (dailyRemaining <= granted ? "daily" : "section") : "none",
    dailyRemaining: dailyRemaining - granted,
    sectionRemaining: sectionRemaining - granted,
  };
}

/** Progreso del día para la interfaz. */
export async function getLeafDayProgress(section?: string) {
  const { daily, sec } = await todayTotals(slug(section ?? "app"));
  return {
    dailyPoints: daily,
    dailyCap: DAILY_CAP_POINTS,
    dailyRemaining: Math.max(0, DAILY_CAP_POINTS - daily),
    sectionPoints: sec,
    sectionCap: SECTION_CAP_POINTS,
  };
}

/**
 * Compatibilidad: las llamadas antiguas usaban montos grandes (15, 40, 50, 250…).
 * Ahora se traducen al nuevo balanceo con topes. Los montos negativos (gastos)
 * pasan directo sin topes.
 */
export async function awardGems(amount: number, reason: string, meta?: Record<string, unknown>) {
  if (amount < 0) {
    const { data, error } = await supabase.rpc("award_gems", {
      _amount: amount,
      _reason: reason,
      _meta: (meta ?? null) as never,
    });
    if (error) {
      console.error("[hojas] spend failed", error);
      return null;
    }
    return data as number;
  }
  const level: ActionLevel = amount <= 15 ? "minor" : amount <= 100 ? "medium" : "major";
  const section = (meta?.["section"] as string) ?? reason.split(/[:_·]/)[0] ?? "app";
  const r = await awardLeaf(section, level, reason, meta);
  return r.balance;
}

/** Costo en hojas de las consultas premium (1 hoja por consulta/respuesta). */
export const LEAF_COSTS = {
  chatReply: 1,
  parejaConsulta: 1,
  patronesConsulta: 1,
  ministracionConsulta: 1,
} as const;

export const GEM_REWARDS = {
  onboardingStep: 2,
  familyMember: 2,
  exerciseCompleted: 5,
  stageCompleted: 5,
  dailyDevotional: 1,
  manifestDay: 5,
} as const;

export const REWARDS = [
  {
    id: "call30",
    cost: 5000,
    title: "Llamada de 30 minutos",
    desc: "Sesión personal con un profesional.",
    tier: 3,
  },
  {
    id: "wa1w",
    cost: 10000,
    title: "1 semana de soporte por WhatsApp",
    desc: "Acompañamiento diario por 7 días.",
    tier: 2,
  },
  {
    id: "wa1m",
    cost: 20000,
    title: "1 mes de soporte interactivo",
    desc: "Acompañamiento profesional continuo.",
    tier: 1,
  },
];

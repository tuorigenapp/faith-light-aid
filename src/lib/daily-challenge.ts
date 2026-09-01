import { appDayKey } from "@/lib/app-day";

/**
 * Retos diarios 100% offline: cada día y cada nivel producen palabras y
 * formatos distintos, siempre iguales para el mismo día (sin internet).
 */

const BANK_POSITIVAS = [
  "PAZ", "FE", "AMOR", "LUZ", "PERDÓN", "CALMA", "VALOR", "GOZO", "LIBRE", "SANO",
  "FUERZA", "TERNURA", "ESPERANZA", "GRACIA", "CONFÍO", "RESPIRO", "SUELTO", "AVANZO",
  "MEREZCO", "PRESENTE", "ELIJO", "SEGURA", "SEGURO", "ABUNDANCIA", "CLARIDAD",
  "DESCANSO", "CUIDADO", "VERDAD", "PROPÓSITO", "RAÍZ", "SEMILLA", "NUEVO", "CAMINO",
  "ALEGRÍA", "DULZURA", "FIRMEZA", "HOGAR", "PERTENEZCO", "BASTA", "PUEDO",
  "LÍMITE", "VOZ", "CUERPO", "ALMA", "LIBERTAD", "AVANCE", "ORDEN", "SENTIDO",
  "ENTREGA", "PACIENCIA", "PLENITUD", "BONDAD",
];

const BANK_OSCURAS = [
  "CULPA", "MIEDO", "RENCOR", "VERGÜENZA", "CONTROL", "DUDA", "PRISA", "RUIDO",
  "OLVIDO", "EXCUSA", "CRÍTICA", "ANSIEDAD",
];

/** Semilla estable por día + juego + nivel. */
export function dailySeed(gameId: string, level = 1, day = appDayKey()) {
  let h = 2166136261;
  const s = `${day}|${gameId}|${level}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick(bank: string[], seed: number, count: number, extra: string[] = []) {
  const pool = Array.from(new Set([...extra.map((w) => w.toUpperCase()), ...bank])).filter(Boolean);
  const out: string[] = [];
  let s = seed;
  const used = new Set<number>();
  while (out.length < Math.min(count, pool.length)) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const i = s % pool.length;
    if (used.has(i)) continue;
    used.add(i);
    out.push(pool[i]!);
  }
  return out;
}

/** Palabras positivas del día para un juego y nivel. */
export function dailyWords(gameId: string, level = 1, count = 8, extra: string[] = []) {
  return pick(BANK_POSITIVAS, dailySeed(gameId, level), count, extra);
}

/** Palabras que hay que esquivar/descartar. */
export function dailyShadows(gameId: string, level = 1, count = 4) {
  return pick(BANK_OSCURAS, dailySeed(gameId, level) + 7, count);
}

const WRITING_PROMPTS = [
  "Escribe 3 líneas que empiecen con “Hoy elijo…” y dilas en voz alta.",
  "Escribe un párrafo corto sobre lo que sueltas hoy y por qué ya no te sirve.",
  "Escribe 4 líneas dirigidas a tu niño interior, con tu nombre al final.",
  "Escribe lo que agradeces de tu cuerpo en 3 frases completas.",
  "Escribe el límite que vas a poner esta semana y a quién se lo dirás.",
  "Escribe tu declaración de identidad: “Yo soy…” cinco veces, distinta cada vez.",
  "Escribe la carta de 5 líneas que nunca enviaste y ciérrala con perdón.",
];

/** Desafío de escritura del día (offline, cambia cada día). */
export function dailyWritingPrompt(level = 1) {
  const s = dailySeed("escribe", level);
  const base = WRITING_PROMPTS[s % WRITING_PROMPTS.length]!;
  const lines = 2 + level;
  return { prompt: base, minLines: Math.min(6, lines), words: dailyWords("escribe", level, 3 + level) };
}

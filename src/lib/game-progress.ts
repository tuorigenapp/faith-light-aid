import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Sistema único de niveles, rondas y guardado para las prácticas jugables.
 * 3 niveles obligatorios · rondas crecientes · reanudación exacta.
 */

export const ROUNDS_PER_LEVEL = [3, 4, 5] as const;
export const TOTAL_LEVELS = 3;
export const TOTAL_ROUNDS = ROUNDS_PER_LEVEL.reduce((a, b) => a + b, 0);

export type GameSave = { level: number; round: number; done?: boolean };

const PREFIX = "origen:game:";

export function readGameSave(key: string): GameSave | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const v = JSON.parse(raw) as GameSave;
    if (!v || typeof v.level !== "number" || typeof v.round !== "number") return null;
    return { level: Math.min(TOTAL_LEVELS, Math.max(1, v.level)), round: Math.max(1, v.round), done: !!v.done };
  } catch {
    return null;
  }
}

export function writeGameSave(key: string, save: GameSave) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(save));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function clearGameSave(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignorar */
  }
}

export function roundsIn(level: number) {
  return ROUNDS_PER_LEVEL[Math.min(TOTAL_LEVELS, Math.max(1, level)) - 1]!;
}

/** Rondas completadas antes de llegar a (nivel, ronda). */
export function roundsBefore(level: number, round: number) {
  let n = 0;
  for (let l = 1; l < level; l++) n += roundsIn(l);
  return n + (round - 1);
}

export type LevelsApi = {
  /** Nivel actual (1-3). */
  level: number;
  /** Ronda actual dentro del nivel (1-based). */
  round: number;
  /** Rondas del nivel actual. */
  roundsInLevel: number;
  /** Rondas completadas en todo el juego. */
  totalDone: number;
  /** Total de rondas del juego (12). */
  totalRounds: number;
  /** Verdadero mientras se muestra el aviso de nivel nuevo. */
  levelUp: boolean;
  /** Juego terminado: los 3 niveles completos. */
  finished: boolean;
  /** Marca la ronda actual como superada y avanza (nivel o final). */
  clearRound: () => void;
  /** Semilla estable por ronda para generar contenido variado. */
  seed: number;
  /** Ya se leyó el progreso guardado. */
  ready: boolean;
};

/**
 * Progresión con guardado automático. Si el usuario sale a mitad de la
 * actividad, al volver continúa en el mismo nivel y la misma ronda.
 */
export function useGameLevels(storageKey: string, onFinish?: () => void): LevelsApi {
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState(1);
  const [levelUp, setLevelUp] = useState(false);
  const [finished, setFinished] = useState(false);
  const [ready, setReady] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    const saved = readGameSave(storageKey);
    if (saved && !saved.done) {
      setLevel(saved.level);
      setRound(Math.min(saved.round, roundsIn(saved.level)));
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // El avance se calcula fuera de los actualizadores de estado (deben ser puros):
  // así nunca se pierde un cambio de nivel ni se queda un juego congelado.
  const clearRound = useCallback(() => {
    if (finishedRef.current) return;
    const max = roundsIn(level);
    if (round < max) {
      writeGameSave(storageKey, { level, round: round + 1 });
      setRound(round + 1);
      return;
    }
    if (level < TOTAL_LEVELS) {
      const nextLevel = level + 1;
      writeGameSave(storageKey, { level: nextLevel, round: 1 });
      setRound(1);
      setLevel(nextLevel);
      setLevelUp(true);
      window.setTimeout(() => setLevelUp(false), 1500);
      return;
    }
    finishedRef.current = true;
    writeGameSave(storageKey, { level: TOTAL_LEVELS, round: max, done: true });
    setFinished(true);
    onFinish?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, round, storageKey, onFinish]);

  const seed = roundsBefore(level, round) * 31 + level * 7 + round;

  return {
    level,
    round,
    roundsInLevel: roundsIn(level),
    totalDone: roundsBefore(level, round),
    totalRounds: TOTAL_ROUNDS,
    levelUp,
    finished,
    clearRound,
    seed,
    ready,
  };
}

/** Generador determinista por semilla (contenido estable al reanudar). */
export function seeded(seed: number) {
  let s = (seed || 1) % 233280;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

export function shuffleSeeded<T>(list: T[], seed: number): T[] {
  const rnd = seeded(seed);
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/* ─────────── Posición dentro de una etapa / step (reanudación) ─────────── */

const STEP_PREFIX = "origen:step:";

export function readStepPosition(key: string): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STEP_PREFIX + key);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function writeStepPosition(key: string, step: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STEP_PREFIX + key, String(step));
  } catch {
    /* ignorar */
  }
}

export function clearStepPosition(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STEP_PREFIX + key);
  } catch {
    /* ignorar */
  }
}

/**
 * Recuerda en qué step iba el usuario dentro de una etapa y lo restaura.
 * Devuelve [step, setStep].
 */
export function useResumableStep(key: string, max: number): [number, (n: number) => void] {
  const [step, setStepState] = useState(1);
  useEffect(() => {
    const saved = readStepPosition(key);
    if (saved && saved <= max) setStepState(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const setStep = useCallback(
    (n: number) => {
      const v = Math.min(Math.max(1, n), max);
      setStepState(v);
      writeStepPosition(key, v);
    },
    [key, max],
  );
  return [step, setStep];
}

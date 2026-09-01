import { useCallback, useEffect, useState } from "react";
import { appDayKey } from "@/lib/app-day";

/**
 * Regla común de todos los juegos: mínimo 5 partidas ganadas en el día
 * (sin límite de tiempo) para liberar la hoja de sanación diaria.
 * Todo se guarda en el dispositivo: funciona sin internet.
 */
export const MIN_PLAYS = 5;

type PlayState = { day: string; plays: number; learned: string[]; awarded?: boolean };

const KEY = (gameId: string) => `origen:plays:${gameId}`;

function read(gameId: string): PlayState {
  const empty: PlayState = { day: appDayKey(), plays: 0, learned: [] };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY(gameId));
    if (!raw) return empty;
    const v = JSON.parse(raw) as PlayState;
    if (!v || v.day !== appDayKey()) return empty;
    return { day: v.day, plays: v.plays ?? 0, learned: v.learned ?? [], awarded: !!v.awarded };
  } catch {
    return empty;
  }
}

function write(gameId: string, s: PlayState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY(gameId), JSON.stringify(s));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function useGamePlays(gameId: string) {
  const [state, setState] = useState<PlayState>({ day: appDayKey(), plays: 0, learned: [] });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(read(gameId));
    setReady(true);
  }, [gameId]);

  /** Registra una partida ganada y las palabras que acertó/memorizó. */
  const addPlay = useCallback(
    (learned: string[] = []) => {
      const cur = read(gameId);
      const next: PlayState = {
        day: appDayKey(),
        plays: cur.plays + 1,
        learned: Array.from(new Set([...cur.learned, ...learned.map((w) => w.toUpperCase())])),
        awarded: cur.awarded,
      };
      write(gameId, next);
      setState(next);
      return next;
    },
    [gameId],
  );

  const markAwarded = useCallback(() => {
    const cur = read(gameId);
    const next = { ...cur, awarded: true };
    write(gameId, next);
    setState(next);
  }, [gameId]);

  return {
    ready,
    plays: state.plays,
    learned: state.learned,
    awarded: !!state.awarded,
    unlocked: state.plays >= MIN_PLAYS,
    remaining: Math.max(0, MIN_PLAYS - state.plays),
    addPlay,
    markAwarded,
  };
}

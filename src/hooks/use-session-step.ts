import { useCallback, useEffect, useState } from "react";

/** Keeps a step (or any small value) per page in sessionStorage so "Volver" returns to the same screen. */
export function useSessionState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`ss:${key}`);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch { /* ignore */ }
  }, [key]);
  const set = useCallback((v: T) => {
    setValue(v);
    try { sessionStorage.setItem(`ss:${key}`, JSON.stringify(v)); } catch { /* ignore */ }
  }, [key]);
  return [value, set] as const;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Asistente de voz de ORÍGEN (accesibilidad).
 *
 * Arquitectura: la IA genera el TEXTO; este módulo solo lo convierte en voz.
 * El motor de voz es el del propio dispositivo (SpeechSynthesis), que funciona
 * sin conexión cuando la voz instalada es local (`voice.localService`).
 * Si no hay voz en español disponible, no se rompe nada: el modo voz queda
 * marcado como no disponible y la app sigue funcionando con texto.
 */

const KEY = "origen:voz";

export type VoiceApi = {
  /** El usuario activó el modo voz. */
  enabled: boolean;
  toggle: () => void;
  setEnabled: (v: boolean) => void;
  /** Existe una voz en español en el dispositivo. */
  available: boolean;
  /** La voz elegida es local (funciona sin internet). */
  offline: boolean;
  /** Lee un texto (solo si el modo voz está activo). */
  speak: (text: string) => void;
  /** Lee un texto aunque el modo voz esté apagado (botón "Escuchar"). */
  speakNow: (text: string) => void;
  stop: () => void;
  speaking: boolean;
};

const Ctx = createContext<VoiceApi | null>(null);

/** Elige la voz femenina española más cálida disponible, priorizando locales. */
function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const es = voices.filter((v) => /^es/i.test(v.lang));
  if (!es.length) return null;
  const femaleHints = /(mónica|monica|paulina|helena|lucía|lucia|sabina|female|mujer|elvira|conchita|laura|marisol|esperanza)/i;
  const score = (v: SpeechSynthesisVoice) =>
    (v.localService ? 4 : 0) + (femaleHints.test(v.name) ? 3 : 0) + (/es-(MX|US|CO|AR|CL|PE)/i.test(v.lang) ? 1 : 0);
  return [...es].sort((a, b) => score(b) - score(a))[0] ?? null;
}

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    try {
      setEnabledState(window.localStorage.getItem(KEY) === "1");
    } catch {
      /* sin almacenamiento */
    }
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => setVoice(pickVoice(window.speechSynthesis.getVoices()));
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    try {
      window.localStorage.setItem(KEY, v ? "1" : "0");
    } catch {
      /* ignorar */
    }
    if (!v && typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const speakNow = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const clean = (text ?? "").replace(/\s+/g, " ").trim();
      if (!clean) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean.slice(0, 600));
      if (voice) u.voice = voice;
      u.lang = voice?.lang ?? "es-ES";
      u.rate = 0.94; // tranquila, no apurada
      u.pitch = 1.12; // femenina, joven-adulta
      u.volume = 1;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    },
    [voice],
  );

  const speak = useCallback((text: string) => { if (enabled) speakNow(text); }, [enabled, speakNow]);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const value = useMemo<VoiceApi>(
    () => ({
      enabled,
      toggle: () => setEnabled(!enabled),
      setEnabled,
      available: !!voice,
      offline: !!voice?.localService,
      speak,
      speakNow,
      stop,
      speaking,
    }),
    [enabled, setEnabled, voice, speak, speakNow, stop, speaking],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVoice(): VoiceApi {
  const ctx = useContext(Ctx);
  if (ctx) return ctx;
  // Fallback seguro si el provider no está montado
  return {
    enabled: false,
    toggle: () => {},
    setEnabled: () => {},
    available: false,
    offline: false,
    speak: () => {},
    speakNow: () => {},
    stop: () => {},
    speaking: false,
  };
}

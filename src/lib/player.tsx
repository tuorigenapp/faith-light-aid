import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type Track = {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  cover?: string | null;
};

type PlayerState = {
  current: Track | null;
  queue: Track[];
  isPlaying: boolean;
  position: number;
  duration: number;
  play: (track: Track, queue?: Track[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  close: () => void;
};

const Ctx = createContext<PlayerState | null>(null);

/**
 * Reproductor global estilo Spotify: el audio vive fuera de las páginas,
 * así sigue sonando al navegar y en segundo plano (pantalla bloqueada).
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const indexOfCurrent = current ? queue.findIndex((t) => t.id === current.id) : -1;

  const playTrack = useCallback((track: Track, nextQueue?: Track[]) => {
    setQueue(nextQueue && nextQueue.length ? nextQueue : [track]);
    setCurrent(track);
    setPosition(0);
    setIsPlaying(true);
  }, []);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    if (el.paused) void el.play().catch(() => setIsPlaying(false));
    else el.pause();
  }, [current]);

  const goTo = useCallback(
    (delta: number) => {
      if (indexOfCurrent < 0 || queue.length === 0) return;
      const nextIndex = (indexOfCurrent + delta + queue.length) % queue.length;
      const track = queue[nextIndex];
      if (track) {
        setCurrent(track);
        setPosition(0);
        setIsPlaying(true);
      }
    },
    [indexOfCurrent, queue],
  );

  const next = useCallback(() => goTo(1), [goTo]);
  const prev = useCallback(() => goTo(-1), [goTo]);

  const seek = useCallback((seconds: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = seconds;
    setPosition(seconds);
  }, []);

  const close = useCallback(() => {
    audioRef.current?.pause();
    setCurrent(null);
    setQueue([]);
    setIsPlaying(false);
  }, []);

  /* Cargar y reproducir cuando cambia la pista */
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    if (el.src !== current.url) {
      el.src = current.url;
      el.load();
    }
    if (isPlaying) void el.play().catch(() => setIsPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  /* Metadatos para la pantalla de bloqueo / auriculares */
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator) || !current) return;
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({
      title: current.title,
      artist: current.subtitle ?? "ORÍGEN",
      album: "Visualízalo y Vívelo",
      artwork: current.cover ? [{ src: current.cover, sizes: "512x512", type: "image/png" }] : [],
    });
    ms.setActionHandler("play", () => audioRef.current?.play());
    ms.setActionHandler("pause", () => audioRef.current?.pause());
    ms.setActionHandler("nexttrack", next);
    ms.setActionHandler("previoustrack", prev);
    return () => {
      ms.setActionHandler("nexttrack", null);
      ms.setActionHandler("previoustrack", null);
    };
  }, [current, next, prev]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [isPlaying]);

  const value = useMemo<PlayerState>(
    () => ({ current, queue, isPlaying, position, duration, play: playTrack, toggle, next, prev, seek, close }),
    [current, queue, isPlaying, position, duration, playTrack, toggle, next, prev, seek, close],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onEnded={() => (queue.length > 1 ? next() : setIsPlaying(false))}
        className="hidden"
      />
    </Ctx.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlayer debe usarse dentro de PlayerProvider");
  return ctx;
}

/** Reproductor opcional: devuelve null fuera del provider (para páginas públicas). */
export function usePlayerOptional() {
  return useContext(Ctx);
}

export function fmtTime(s: number) {
  if (!Number.isFinite(s) || s <= 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

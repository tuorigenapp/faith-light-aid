/**
 * Pausa universal para los juegos: congela el reloj de animación de la página
 * (requestAnimationFrame y performance.now) para que, al reanudar, cada juego
 * siga exactamente donde estaba, sin saltos de tiempo ni obstáculos de golpe.
 */
let installed = false;
let paused = false;
let pausedAt = 0;
let offset = 0;
let queue: FrameRequestCallback[] = [];
let realRaf: typeof window.requestAnimationFrame;
let realNow: () => number;

export function installGamePause() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  realRaf = window.requestAnimationFrame.bind(window);
  realNow = performance.now.bind(performance);
  performance.now = () => (paused ? pausedAt : realNow()) - offset;
  window.requestAnimationFrame = (cb: FrameRequestCallback) => {
    if (paused) {
      queue.push(cb);
      return 0;
    }
    return realRaf((t) => cb(t - offset));
  };
}

export function uninstallGamePause() {
  if (!installed) return;
  resumeGames();
  window.requestAnimationFrame = realRaf;
  performance.now = realNow;
  installed = false;
  offset = 0;
}

export function pauseGames() {
  if (!installed || paused) return;
  paused = true;
  pausedAt = realNow();
}

export function resumeGames() {
  if (!installed || !paused) return;
  offset += realNow() - pausedAt;
  paused = false;
  const pending = queue;
  queue = [];
  pending.forEach((cb) => realRaf((t) => cb(t - offset)));
}

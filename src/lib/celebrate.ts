/** Celebraciones solo en hitos reales. Confetti liviano en canvas, sin librerías. */
const COLORS = ["#7C5CFF", "#F5C77E", "#9C86FF", "#FFE3B0", "#5FD3A0"];

export function celebrate(durationMs = 1600) {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:9999";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.remove();

  const pieces = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.4,
    r: 3 + Math.random() * 5,
    vy: 2 + Math.random() * 3.5,
    vx: -1 + Math.random() * 2,
    rot: Math.random() * Math.PI,
    vr: -0.15 + Math.random() * 0.3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
  }));

  const start = performance.now();
  function frame(now: number) {
    const t = now - start;
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      ctx!.fillStyle = p.color;
      ctx!.globalAlpha = Math.max(0, 1 - t / durationMs);
      ctx!.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
      ctx!.restore();
    }
    if (t < durationMs) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}

const KEY = "origen_celebrated";

/** Celebra una sola vez por hito (persistido en el navegador). */
export function celebrateOnce(milestone: string) {
  if (typeof window === "undefined") return false;
  const done: string[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
  if (done.includes(milestone)) return false;
  done.push(milestone);
  localStorage.setItem(KEY, JSON.stringify(done));
  celebrate();
  return true;
}

export function milestoneMessage(streak: number): string | null {
  if (streak === 1) return "¡Primer día! Hoy empezó tu camino de vuelta a casa.";
  if (streak === 7) return "7 días seguidos. Lo que antes abandonabas, hoy lo sostuviste.";
  if (streak === 30) return "30 días. Esto ya no es intento: es tu nueva forma de vivir.";
  if (streak === 100) return "100 días. Rompiste el ciclo. Tu descendencia lo va a notar.";
  return null;
}

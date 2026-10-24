import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { X, Sparkles } from "lucide-react";
import { getWheelState } from "@/lib/ruleta.functions";
import { appDayKey } from "@/lib/app-day";
import origenIcon from "@/assets/logo-origen.png";

const MAX_PER_DAY = 3;
const GAP_MS = 2 * 60 * 60 * 1000; // entre apariciones, al menos 2 horas

/** Invita a girar la ruleta hasta 3 veces al día mientras el giro de hoy siga disponible. */
export function RoulettePrompt({ userId }: { userId?: string }) {
  const readState = useServerFn(getWheelState);
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    if (/^\/(ruleta|onboarding|auth|comunidad)/.test(pathname)) return;
    const key = `origen-ruleta-prompt-${userId}-${appDayKey()}`;
    let info: { n: number; at: number } = { n: 0, at: 0 };
    try { info = JSON.parse(localStorage.getItem(key) || '{"n":0,"at":0}'); } catch { /* sin almacenamiento */ }
    if (info.n >= MAX_PER_DAY || Date.now() - info.at < GAP_MS) return;
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const s = await readState();
        if (!alive || s.nextAt > Date.now()) return;
        localStorage.setItem(key, JSON.stringify({ n: info.n + 1, at: Date.now() }));
        setOpen(true);
      } catch { /* sin conexión: lo intentamos en la próxima visita */ }
    }, 4000);
    return () => { alive = false; clearTimeout(t); };
  }, [userId, pathname, readState]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-foreground/40 p-5 animate-in fade-in" role="dialog" aria-modal="true" aria-label="Ruleta del día">
      <div className="relative w-full max-w-[340px] rounded-[16px] bg-card p-6 text-center shadow-elevated animate-in zoom-in-95">
        <button onClick={() => setOpen(false)} aria-label="Cerrar" className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full text-muted-foreground">
          <X className="h-5 w-5" />
        </button>
        <img src={origenIcon} alt="ORÍGEN" width={72} height={72} className="mx-auto h-[72px] w-[72px] rounded-full animate-breathe" />
        <h2 className="mt-3 font-display text-[22px] font-extrabold">Tu giro de hoy te espera</h2>
        <p className="mt-1 text-[14.5px] text-muted-foreground">Siempre ganas algo. Solo toma unos segundos.</p>
        <Link to="/ruleta" onClick={() => setOpen(false)} className="btn-primary-gradient mt-5 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[12px] text-[16px] font-bold text-primary-foreground">
          <Sparkles className="h-5 w-5" /> Girar la ruleta
        </Link>
        <button onClick={() => setOpen(false)} className="mt-2 min-h-11 w-full text-[14px] font-semibold text-muted-foreground">Más tarde</button>
      </div>
    </div>
  );
}

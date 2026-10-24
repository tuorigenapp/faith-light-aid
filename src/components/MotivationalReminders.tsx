import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, BellRing, Sparkles, X } from "lucide-react";
import { enablePush, permissionState } from "@/lib/notifications";
import { pickReminder, pushReminder, type Reminder } from "@/lib/motivational-reminders";
import { useAuth } from "@/lib/use-auth";
import { useProfile } from "@/hooks/use-profile";

const FIRST_MS = 45_000;
const GAP_MS = 6 * 60_000;
const VISIBLE_MS = 9_000;

/**
 * Recomendaciones continuas estilo tienda: una tarjeta dentro de la app cada pocos minutos
 * mientras la persona navega, y notificación del teléfono cuando la app queda en segundo plano.
 */
export function MotivationalReminders() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [current, setCurrent] = useState<Reminder | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const pathRef = useRef(path);
  pathRef.current = path;
  const interests = [profile?.intention ?? "", ...((profile?.interests as string[] | null) ?? [])].join(" ");
  const interestsRef = useRef(interests);
  interestsRef.current = interests;

  useEffect(() => {
    if (!user) return;
    let hide: ReturnType<typeof setTimeout>;
    const fire = () => {
      const r = pickReminder(interestsRef.current, pathRef.current);
      // Con permiso concedido el recordatorio sale como notificación real del teléfono/navegador.
      if (permissionState() === "granted") { pushReminder(r).catch(() => undefined); return; }
      if (document.hidden) return;
      setCurrent(r);
      clearTimeout(hide);
      hide = setTimeout(() => setCurrent(null), VISIBLE_MS);
    };
    const first = setTimeout(fire, FIRST_MS);
    const loop = setInterval(fire, GAP_MS);
    return () => { clearTimeout(first); clearInterval(loop); clearTimeout(hide); };
  }, [user]);

  if (!current) return null;
  return (
    <div role="status" className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+64px)] z-[70] mx-auto max-w-md motion-safe:animate-in motion-safe:slide-in-from-top-4">
      <div className="flex items-start gap-3 rounded-[16px] border border-border bg-card p-3 shadow-[0_8px_30px_rgba(30,25,20,.14)]">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-primary">Recomendado para ti</p>
          <p className="text-[15px] font-bold leading-tight">{current.title}</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{current.body}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link to={current.url} onClick={() => setCurrent(null)} className="inline-flex min-h-11 items-center gap-1 rounded-[12px] bg-primary px-4 text-[14px] font-semibold text-primary-foreground active:scale-[.97]">Ver ahora <ArrowRight className="h-4 w-4" /></Link>
            {permissionState() === "default" && user && (
              <button type="button" onClick={async () => { const r = await enablePush(user.id); setNote(r.message); }} className="inline-flex min-h-11 items-center gap-1 rounded-[12px] bg-primary/10 px-3 text-[13px] font-semibold text-primary active:scale-[.97]"><BellRing className="h-4 w-4" /> Recibir en mi teléfono</button>
            )}
          </div>
          {note && <p className="mt-1 text-[12px] text-muted-foreground">{note}</p>}
        </div>
        <button onClick={() => setCurrent(null)} aria-label="Cerrar recomendación" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground"><X className="h-5 w-5" /></button>
      </div>
    </div>
  );
}

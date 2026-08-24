import { useEffect } from "react";
import { nextReminder, pushReminder } from "@/lib/motivational-reminders";
import { useAuth } from "@/lib/use-auth";

/**
 * Programador silencioso de recordatorios motivacionales.
 * NO renderiza nada ni muestra toasts/banners in-app: solo dispara
 * notificaciones del sistema (barra de notificaciones del teléfono)
 * a través del Service Worker.
 */
export function MotivationalReminders() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fire = () => {
      if (document.hidden) return;
      const r = nextReminder();
      if (!r) return;
      pushReminder(r).catch(() => undefined);
    };

    const first = setTimeout(fire, 60000);
    const loop = setInterval(fire, 15 * 60 * 1000);
    return () => { clearTimeout(first); clearInterval(loop); };
  }, [user]);

  return null;
}

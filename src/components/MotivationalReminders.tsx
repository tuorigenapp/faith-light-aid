import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { nextReminder, pushReminder } from "@/lib/motivational-reminders";
import { useAuth } from "@/lib/use-auth";

/** Recordatorios motivacionales cada 2–3 horas sobre todas las secciones de la app. */
export function MotivationalReminders() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fire = () => {
      if (document.hidden) return;
      const r = nextReminder();
      if (!r) return;
      toast(r.title, {
        description: r.body,
        duration: 9000,
        action: {
          label: "Ir ahora",
          onClick: () => navigate({ to: r.url }),
        },
      });
      pushReminder(r).catch(() => undefined);
    };

    const first = setTimeout(fire, 60000);
    const loop = setInterval(fire, 15 * 60 * 1000);
    return () => { clearTimeout(first); clearInterval(loop); };
  }, [user, navigate]);

  return null;
}

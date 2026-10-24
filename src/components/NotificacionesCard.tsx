import { useEffect, useState } from "react";
import { Bell, BellOff, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";
import { disablePush, enablePush, getPrefs, hasPushSubscription, permissionState, setEmailEnabled } from "@/lib/notifications";
import { Button } from "@/components/ui/button";

const AVISOS = [
  "Palabra del día lista",
  "Tu siguiente día del camino te espera",
  "Racha en riesgo hoy",
  "Tu consulta está lista",
  "Aviso antes del cobro de la prueba",
  "Te extrañamos (3 días sin entrar)",
];

export function NotificacionesCard() {
  const { user } = useAuth();
  const [push, setPush] = useState(false);
  const [email, setEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const supported = permissionState() !== "unsupported";

  useEffect(() => {
    if (!user) return;
    Promise.all([getPrefs(user.id), hasPushSubscription()]).then(([p, registered]) => {
      setPush(!!p.push_enabled && registered);
      setEmail(p.email_enabled !== false);
    }).catch(() => toast.error("No pudimos cargar tus preferencias. Intenta de nuevo."));
  }, [user]);

  async function togglePush() {
    if (!user || busy) return;
    setBusy(true);
    try {
    if (push) {
      await disablePush(user.id);
      setPush(false);
      toast("Notificaciones desactivadas");
    } else {
      const res = await enablePush(user.id);
      setPush(res.ok);
      res.ok ? toast.success(res.message) : toast.error(res.message);
    }
    } catch { toast.error("No pudimos guardar el cambio de avisos. Intenta de nuevo."); }
    finally { setBusy(false); }
  }

  async function toggleEmail() {
    if (!user) return;
    const next = !email;
    setEmail(next);
    await setEmailEnabled(user.id, next);
    toast(next ? "Correos activados" : "Correos desactivados");
  }

  return (
    <section className="rounded-[16px] border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-primary/10 text-primary">
          <Bell className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-[17px] font-bold">Avisos fuera de ORÍGEN</h3>
          <p className="text-[13px] text-muted-foreground">Recomendaciones diarias, incluso con la app cerrada.</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Button
          variant={push ? "secondary" : "default"}
          onClick={togglePush}
          disabled={!supported || busy}
          className={`flex min-h-[52px] w-full items-center justify-between rounded-[12px] px-4 text-sm font-semibold transition disabled:opacity-60 ${
            push ? "bg-primary/10 text-primary" : "btn-primary-gradient"
          }`}
        >
          <span className="flex items-center gap-2">
            {push ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            {push ? "Desactivar avisos externos" : "Activar avisos en este dispositivo"}
          </span>
        </Button>
        <p className="text-[13px] text-muted-foreground">Debes permitir las notificaciones del navegador. En iPhone, agrega ORÍGEN a tu pantalla de inicio; la entrega depende del dispositivo y sus ajustes.</p>
        {!supported && (
          <p className="text-[12px] text-muted-foreground">
            Tu navegador no permite notificaciones. Ábrela desde Chrome o Safari actualizado.
          </p>
        )}

        <button
          onClick={toggleEmail}
          className="flex min-h-[52px] w-full items-center justify-between rounded-[12px] border border-border/60 bg-background px-4 text-sm font-semibold"
        >
          <span className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" /> Recordatorios por correo
          </span>
          <span className={`h-6 w-11 rounded-full p-0.5 transition ${email ? "bg-primary" : "bg-secondary"}`}>
            <span className={`block h-5 w-5 rounded-full bg-card transition ${email ? "translate-x-5" : ""}`} />
          </span>
        </button>
      </div>

      <ul className="mt-4 space-y-1.5">
        {AVISOS.map((a) => (
          <li key={a} className="flex items-start gap-2 text-[13px] text-muted-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {a}
          </li>
        ))}
      </ul>
    </section>
  );
}

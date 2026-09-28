import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, Camera, Check, Loader2, Mail, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { enablePush, permissionState } from "@/lib/notifications";

const DONE_KEY = "origen_tour_done";

const SLIDES = [
  {
    emoji: "🌿",
    title: "Tus hojas de sanación",
    body: "Cada acción real te acerca a una hoja. Con hojas abres consultas, la mentora y recompensas.",
  },
  {
    emoji: "🗺️",
    title: "Tu camino, un día a la vez",
    body: "En «Mi camino ORÍGEN» y en cada categoría avanzas un día por jornada. Nada de atracones.",
  },
  {
    emoji: "📖",
    title: "La Palabra de hoy",
    body: "Enseñanza, reflexión para ti y para tu familia, quiz y una imagen para descargar y compartir.",
  },
  {
    emoji: "🕊️",
    title: "La mentora te acompaña",
    body: "Consultas de pareja, patrones familiares y «Dios te dice hoy», con historial y PDF.",
  },
];

type Phase = "slides" | "avisos" | "perfil" | "correo" | "listo";

export function GuidedTour() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>("slides");

  const { data: profile } = useProfile();
  // Si la persona ya tiene su perfil registrado, el tour no vuelve a aparecer
  // en ningún dispositivo.
  const alreadyRegistered = !!profile?.profile_completed_at;

  useEffect(() => {
    if (alreadyRegistered) {
      localStorage.setItem(DONE_KEY, "1");
      setOpen(false);
      return;
    }
    if (localStorage.getItem(DONE_KEY) !== "1") setOpen(true);
  }, [alreadyRegistered]);

  function finish() {
    localStorage.setItem(DONE_KEY, "1");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-end bg-foreground/65 p-0 backdrop-blur-md sm:place-items-center sm:p-6">
      {/* luz sobre la guía, opacidad y desenfoque en todo lo demás */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(60% 45% at 50% 62%, rgba(255,255,255,.28) 0%, transparent 70%)" }}
      />
      <div className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[20px] bg-card p-6 shadow-[0_0_0_1px_rgba(124,92,255,.35),0_18px_60px_rgba(124,92,255,.45)] animate-in slide-in-from-bottom sm:max-w-[420px] sm:rounded-[16px]">
        {phase === "slides" && (
          <SlidesStep
            i={i}
            onNext={() => (i === SLIDES.length - 1 ? setPhase("avisos") : setI(i + 1))}
            onSkipToRequired={() => setPhase("avisos")}
          />
        )}
        {phase === "avisos" && <AvisosStep onDone={() => setPhase("perfil")} />}
        {phase === "perfil" && <PerfilStep onDone={() => setPhase("correo")} />}
        {phase === "correo" && <CorreoStep email={user?.email ?? ""} confirmed={!!user?.email_confirmed_at} onDone={() => setPhase("listo")} />}
        {phase === "listo" && (
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-[16px] bg-primary/10 text-4xl">🎉</div>
            <h2 className="mt-4 font-display text-[22px] font-bold leading-tight">Todo listo, tu camino empieza hoy</h2>
            <p className="mx-auto mt-2 max-w-[34ch] text-[15px] leading-relaxed text-muted-foreground">
              Te acompañaremos con avisos, tu Palabra del día y tu etapa diaria.
            </p>
            <button
              onClick={finish}
              className="btn-primary-gradient mt-6 min-h-[52px] w-full rounded-full text-[16px] font-semibold transition active:scale-[.97]"
            >
              Entrar a ORÍGEN
            </button>
          </div>
        )}

        {phase !== "slides" && phase !== "listo" && (
          <Progress phase={phase} />
        )}
      </div>
    </div>
  );
}

function Progress({ phase }: { phase: Phase }) {
  const order: Phase[] = ["avisos", "perfil", "correo"];
  const idx = order.indexOf(phase);
  return (
    <div className="mt-5 flex items-center justify-center gap-1.5">
      {order.map((p, n) => (
        <span key={p} className={`h-1.5 rounded-full transition-all ${n === idx ? "w-6 bg-primary" : n < idx ? "w-3 bg-primary/50" : "w-1.5 bg-secondary"}`} />
      ))}
    </div>
  );
}

function StepShell({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-[16px] bg-primary/10 text-primary">{icon}</div>
      <h2 className="mt-4 font-display text-[22px] font-bold leading-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-[34ch] text-[15px] leading-relaxed text-muted-foreground">{body}</p>
      <div className="mt-5 text-left">{children}</div>
      <p className="mt-3 text-[12px] text-muted-foreground">Paso obligatorio · toma 20 segundos</p>
    </div>
  );
}

function SlidesStep({ i, onNext, onSkipToRequired }: { i: number; onNext: () => void; onSkipToRequired: () => void }) {
  const s = SLIDES[i]!;
  const last = i === SLIDES.length - 1;
  return (
    <>
      <div className="flex justify-end">
        <button onClick={onSkipToRequired} aria-label="Ir a la configuración" className="grid h-11 w-11 place-items-center rounded-full hover:bg-secondary">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-[16px] bg-primary/10 text-4xl">{s.emoji}</div>
        <h2 className="mt-4 font-display text-[22px] font-bold leading-tight">{s.title}</h2>
        <p className="mx-auto mt-2 max-w-[34ch] text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
      </div>
      <div className="mt-6 flex justify-center gap-1.5">
        {SLIDES.map((_, n) => (
          <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? "w-6 bg-primary" : "w-1.5 bg-secondary"}`} />
        ))}
      </div>
      <button
        onClick={onNext}
        className="btn-primary-gradient mt-5 min-h-[52px] w-full rounded-full text-[16px] font-semibold transition active:scale-[.97]"
      >
        {last ? "Configurar mi cuenta" : "Siguiente"}
      </button>
    </>
  );
}

function AvisosStep({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [state, setState] = useState<NotificationPermission | "unsupported">("default");
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);

  useEffect(() => setState(permissionState()), []);

  async function activar() {
    if (!user || busy) return;
    setBusy(true);
    const res = await enablePush(user.id).catch(() => ({ ok: false, message: "No pudimos activar los avisos." }));
    setBusy(false);
    setTried(true);
    setState(permissionState());
    if (res.ok) {
      toast.success("Avisos activados");
      onDone();
    } else {
      toast.error(res.message);
    }
  }

  const granted = state === "granted";

  return (
    <StepShell
      icon={<BellRing className="h-7 w-7" />}
      title="Activa tus avisos"
      body="Te recordamos tu Palabra del día, tu etapa y tu racha. Sin esto, el camino se te olvida."
      children={
        <div className="space-y-2">
          {granted ? (
            <div className="flex items-center gap-2 rounded-[12px] bg-primary/10 p-4 text-sm font-semibold text-primary">
              <Check className="h-4 w-4" /> Avisos activados en este dispositivo
            </div>
          ) : (
            <button
              onClick={activar}
              disabled={busy}
              className="btn-primary-gradient inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full text-[16px] font-semibold disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bell className="h-5 w-5" />}
              Activar mis avisos
            </button>
          )}
          <button
            onClick={onDone}
            disabled={!granted && !tried && state !== "unsupported"}
            className="min-h-11 w-full rounded-full text-sm font-medium text-muted-foreground disabled:opacity-40"
          >
            {granted ? "Continuar" : "Mi navegador no lo permite, continuar"}
          </button>
        </div>
      }
    />
  );
}

function PerfilStep({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const n = [data?.display_name, data?.full_name].find((v) => v && !/^invitado_/i.test(v));
        if (n) setName(n);
        if (data?.avatar_url) setPhoto(data.avatar_url);
      });
  }, [user]);

  async function pick(file: File) {
    if (!user) return;
    setBusy(true);
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    setBusy(false);
    if (error) return toast.error("No pudimos subir tu foto. Intenta con otra imagen.");
    setPhoto(path);
    setPreview(URL.createObjectURL(file));
    toast.success("Foto lista");
  }

  async function save() {
    if (!user || busy) return;
    if (name.trim().length < 2) return toast.error("Escribe tu nombre para personalizar tu camino.");
    if (!photo) return toast.error("Agrega tu foto: es parte de tu proceso de identidad.");
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name.trim(), avatar_url: photo, profile_completed_at: new Date().toISOString() })
      .eq("id", user.id);
    setBusy(false);
    if (error) return toast.error("No pudimos guardar tus datos. Intenta de nuevo.");
    toast.success("Perfil completo");
    onDone();
  }

  return (
    <StepShell
      icon={<ShieldCheck className="h-7 w-7" />}
      title="Completa tus datos"
      body="Tu nombre y tu rostro acompañan cada etapa. Así la app te habla a ti, no a un usuario más."
      children={
        <div className="space-y-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-[12px] border-[1.5px] border-border bg-background p-3 text-left"
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary">
              {preview ? <img src={preview} alt="Tu foto" className="h-full w-full object-cover" /> : photo ? <Check className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
            </span>
            <span className="text-sm font-semibold">
              {photo ? "Foto agregada · cambiar" : "Agregar mi foto de perfil"}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void pick(f); }}
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="¿Cómo quieres que te llamemos?"
            className="min-h-[52px] w-full rounded-[10px] border-[1.5px] border-border bg-background px-4 text-[15px] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20"
          />
          <button
            onClick={save}
            disabled={busy}
            className="btn-primary-gradient inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full text-[16px] font-semibold disabled:opacity-60"
          >
            {busy && <Loader2 className="h-5 w-5 animate-spin" />} Guardar y continuar
          </button>
        </div>
      }
    />
  );
}

function CorreoStep({ email, confirmed, onDone }: { email: string; confirmed: boolean; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function resend() {
    if (!email || busy) return;
    setBusy(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setBusy(false);
    if (error) return toast.error("No pudimos reenviar el correo. Escríbenos a soporte.");
    setSent(true);
    toast.success("Te enviamos el correo de confirmación");
  }

  return (
    <StepShell
      icon={<Mail className="h-7 w-7" />}
      title="Confirma tu correo"
      body="Es lo que protege tu progreso, tus hojas y tus consultas si cambias de teléfono."
      children={
        <div className="space-y-2">
          <div className="rounded-[12px] border-[1.5px] border-border bg-background p-4 text-sm">
            <p className="font-semibold">{email || "Tu correo"}</p>
            <p className="mt-1 text-muted-foreground">
              {confirmed ? "Correo confirmado ✅" : sent ? "Revisa tu bandeja (y la carpeta de spam)." : "Aún sin confirmar."}
            </p>
          </div>
          {!confirmed && (
            <button
              onClick={resend}
              disabled={busy}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-primary/10 text-[15px] font-semibold text-primary disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Enviarme el correo de confirmación
            </button>
          )}
          <button
            onClick={onDone}
            className="btn-primary-gradient min-h-[52px] w-full rounded-full text-[16px] font-semibold"
          >
            {confirmed ? "Continuar" : "Ya lo confirmé, continuar"}
          </button>
        </div>
      }
    />
  );
}

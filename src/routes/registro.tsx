import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo-origen.png";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "Crea tu cuenta ORÍGEN — empieza tu camino hoy" },
      { name: "description", content: "Crea tu cuenta en 30 segundos y responde 6 preguntas cortas para recibir tu camino de sanación personalizado." },
      { property: "og:title", content: "Crea tu cuenta ORÍGEN" },
      { property: "og:description", content: "Responde 6 preguntas cortas y recibe tu camino de sanación personalizado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegistroPage,
});

function RegistroPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState(false);

  function goOnboarding() {
    try {
      localStorage.setItem("origen_pending_onboarding", "1");
    } catch {
      /* noop */
    }
    navigate({ to: "/onboarding", search: { skipIntro: true } });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    try { localStorage.setItem("origen_pending_onboarding", "1"); } catch { /* no storage */ }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth`, data: { full_name: fullName, pre_onboarding: (() => { try { return JSON.parse(localStorage.getItem("origen_preonboarding") || "{}"); } catch { return {}; } })() } },
    });
    if (error) {
      setLoading(false);
      try { localStorage.removeItem("origen_pending_onboarding"); } catch { /* no storage */ }
      return toast.error(error.message);
    }
    if (!data.session) {
      setLoading(false);
      setConfirmation(true);
      toast.success("Revisa tu correo para confirmar el acceso.");
      return;
    }
    setLoading(false);
    toast.success("¡Bienvenida! Vamos con tus preguntas.");
    goOnboarding();
  }

  async function google() {
    setLoading(true);
    try {
      localStorage.setItem("origen_pending_onboarding", "1");
    } catch {
      /* noop */
    }
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setLoading(false);
      toast.error("No se pudo continuar con Google");
      return;
    }
    if (result.redirected) return;
    goOnboarding();
  }

  return (
    <main className="min-h-dvh bg-aura-top px-4 py-8">
      <div className="mx-auto w-full max-w-[420px]">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="" width={40} height={40} className="h-10 w-10 rounded-[12px] object-contain" />
          <span className="font-display text-[17px] font-bold">ORÍGEN</span>
        </Link>

        <h1 className="mt-7 font-display text-[30px] font-extrabold leading-[1.15]">
          Crea tu cuenta y<br />empieza tu camino
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Después te haremos 6 preguntas cortas para armar tu plan real.
        </p>

        <button
          onClick={google}
          disabled={loading}
          className="mt-6 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-border bg-card text-[15px] font-semibold disabled:opacity-60"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continuar con Google
        </button>

        <div className="my-5 flex items-center gap-3 text-[12px] font-semibold text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> O CON TU CORREO <span className="h-px flex-1 bg-border" />
        </div>

        {confirmation && <div role="status" className="mt-5 rounded-2xl border border-primary/25 bg-primary/5 p-5 text-sm"><p className="font-bold text-primary">Confirma tu correo para continuar</p><p className="mt-2 text-muted-foreground">Enviamos un enlace a {email}. Revisa también spam o promociones; abre el enlace en el mismo navegador. Si no llega, usa el botón de reenviar.</p><button type="button" className="mt-3 min-h-11 font-bold text-primary underline" onClick={async () => { const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${window.location.origin}/auth` } }); if (error) toast.error(error.message); else toast.success("Enlace de confirmación reenviado."); }}>Reenviar confirmación</button></div>}
        <form onSubmit={submit} className="grid gap-3">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">¿Cómo te llamas?</span>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} maxLength={80} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">Tu correo</span>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">Crea una contraseña</span>
            <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-1 inline-flex h-[56px] w-full items-center justify-center gap-2 rounded-[12px] bg-primary text-[17px] font-bold text-primary-foreground shadow-[0_4px_14px_rgba(124,92,255,.28)] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            Empezar mis preguntas <ArrowRight className="h-4.5 w-4.5" />
          </button>
        </form>

        <p className="mt-4 inline-flex items-center gap-2 text-[12.5px] text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" /> Tus respuestas son privadas y solo tú las ves.
        </p>
        <p className="mt-5 text-center text-[13px] text-muted-foreground">
          ¿Ya tienes cuenta? <Link to="/auth" className="font-bold text-primary">Inicia sesión</Link>
        </p>
      </div>
    </main>
  );
}

const inputCls =
  "h-[52px] w-full rounded-[10px] border-[1.5px] border-border bg-card px-3.5 text-[15px] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo-origen.png";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "ORIGEN — Sana tu historia y vive tu propósito" },
      { name: "description", content: "Descubre el patrón que se repite en tu historia y comienza tu camino de sanación con ORIGEN en menos de 3 minutos." },
      { property: "og:title", content: "ORIGEN — Sana tu historia y vive tu propósito" },
      { property: "og:description", content: "Descubre tu patrón familiar y comienza tu transformación hoy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Entry,
});

function Entry() {
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const rand = Math.random().toString(36).slice(2, 10);
        const email = `invitado_${Date.now()}_${rand}@origen.test`;
        const password = `Prueba_${rand}${Math.random().toString(36).slice(2, 8)}!A9`;
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) { navigate({ to: "/auth", replace: true }); return; }
        const { error: sErr } = await supabase.auth.signInWithPassword({ email, password });
        if (sErr) { navigate({ to: "/auth", replace: true }); return; }
      }
      try { localStorage.setItem("origen_pending_onboarding", "1"); } catch { /* noop */ }
      navigate({ to: "/onboarding", replace: true });
    })();
  }, [navigate]);

  return (
    <main
      className="min-h-dvh grid place-items-center px-6"
      style={{ background: "radial-gradient(120% 100% at 50% 0%, #EFE7FF 0%, #FBFAFF 55%, #FDEEF7 100%)" }}
    >
      <div className="text-center">
        <div className="relative flex items-center justify-center">
          <span className="splash-ring" />
          <span className="splash-ring" style={{ animationDelay: "0.6s" }} />
          <img src={logo} alt="ORIGEN" width={160} height={160} className="relative z-10 w-40 h-40 object-contain splash-breathe" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold text-[#1B1930]">Preparando tu espacio…</h1>
        <p className="mt-2 text-sm text-[#6B6A85]">Tu camino comienza en unos segundos</p>
      </div>
    </main>
  );
}

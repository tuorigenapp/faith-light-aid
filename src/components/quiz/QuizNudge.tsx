import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { BellRing, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { nudgeQuestion } from "@/lib/quiz-origen";
import { enablePush, permissionState, pushSupported, showLocalNotification } from "@/lib/notifications";
import logo from "@/assets/logo-origen.png";

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Aviso tipo notificación con una pregunta del Quiz Bíblico Diario (1 vez al día).
 * Si las notificaciones del teléfono están apagadas, primero invita a activarlas.
 */
export function QuizNudge() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [mode, setMode] = useState<null | "permit" | "quiz">(null);
  const [busy, setBusy] = useState(false);
  const n = nudgeQuestion(today());

  useEffect(() => {
    if (!user || pathname.startsWith("/quiz") || pathname.startsWith("/onboarding")) return;
    const key = `origen-quiz-nudge-${user.id}-${today()}`;
    if (localStorage.getItem(key)) return;
    const t = setTimeout(() => {
      localStorage.setItem(key, "1");
      const perm = permissionState();
      if (pushSupported() && perm === "default") setMode("permit");
      else {
        setMode("quiz");
        if (perm === "granted" && document.visibilityState === "hidden") void showLocalNotification({ kind: "palabra", title: "Quiz Bíblico Diario", body: n.q.q });
      }
    }, 25_000);
    return () => clearTimeout(t);
  }, [user?.id, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  async function permit() {
    if (!user) return;
    setBusy(true);
    const r = await enablePush(user.id);
    setBusy(false);
    toast[r.ok ? "success" : "error"](r.message);
    setMode("quiz");
  }

  async function answer(k: 0 | 1) {
    if (!user) return;
    await supabase.from("quiz_answers").insert({ user_id: user.id, question_id: n.q.id, answer: n.options[k], correct: k === n.correctIndex, source: "nudge", level: 0 });
    toast[k === n.correctIndex ? "success" : "message"](k === n.correctIndex ? "¡Gloria! Respuesta correcta" : `La respuesta era: ${n.options[n.correctIndex]}`);
    setMode(null);
    nav({ to: "/quiz" });
  }

  if (!mode) return null;
  return (
    <div className="fixed inset-x-3 top-3 z-[60] mx-auto max-w-md overflow-hidden rounded-[16px] bg-card shadow-elevated" role="dialog" aria-label={mode === "quiz" ? "Quiz Bíblico Diario" : "Activar notificaciones"} style={{ animation: "slide-in-from-top .35s ease-out both" }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <img src={logo} alt="" className="h-9 w-9 rounded-[10px] object-contain" />
        <p className="flex-1 text-[15px] font-semibold">ORÍGEN</p>
        <button onClick={() => setMode(null)} aria-label="Cerrar" className="grid h-11 w-11 place-items-center rounded-full"><X className="h-5 w-5" /></button>
      </div>
      {mode === "permit" ? (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <p className="text-center font-display text-[19px] font-bold leading-snug">Permite que ORÍGEN te envíe tu quiz y versículo diario</p>
          <p className="mt-1 text-center text-[13px] text-muted-foreground">Te llegan aunque estés fuera de la app.</p>
          <button onClick={permit} disabled={busy} className="mt-3 flex h-14 w-full items-center justify-between rounded-[12px] bg-muted px-4 text-[16px] font-semibold">
            <span className="flex items-center gap-2"><BellRing className="h-5 w-5 text-primary" />Permitir</span>
            <span className="relative h-7 w-12 rounded-full bg-cta-green/80"><span className="absolute right-1 top-1 h-5 w-5 rounded-full bg-card" /></span>
          </button>
        </div>
      ) : (
        <div className="mx-3 mb-3 rounded-[12px] border-2 border-primary/25 bg-primary/5 p-4">
          <p className="text-center font-display text-[18px] font-extrabold">Quiz Bíblico Diario</p>
          <p className="mt-2 text-center text-[16px] font-semibold leading-snug">{n.q.q}</p>
          <div className="mt-3 grid gap-2">
            {n.options.map((o, k) => (
              <button key={o} onClick={() => answer(k as 0 | 1)} className="flex min-h-12 items-center gap-3 rounded-[12px] bg-primary px-4 text-left text-[15px] font-semibold text-primary-foreground active:scale-[.98]">
                <span className="font-bold">{k === 0 ? "A:" : "B:"}</span><span className="flex-1 text-center">{o}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

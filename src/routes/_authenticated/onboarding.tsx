import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Loader2, Lock, User as UserIcon, Heart, DollarSign, Brain, Sprout, Mountain, HandHeart } from "lucide-react";
import { awardGems, GEM_REWARDS } from "@/lib/gems";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Bienvenido — Reconectando" }] }),
  component: Onboarding,
});

type Impact = { relaciones: string; prosperidad: string; emociones: string };
type Strengths = { adaptarte: string; resistir: string; ayudar: string };
type AIResult = {
  pattern_name: string;
  pattern_summary: string;
  impact: Impact;
  strengths: Strengths;
  primary_focus: string;
  recommended_categories: string[];
  closure_reflection: string;
  welcome_message: string;
  needs_more: false | string;
};

const TOTAL_STEPS = 6;

function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState<1 | -1>(1);

  const [name, setName] = useState("");
  const [raices, setRaices] = useState("");
  const [recuerdos, setRecuerdos] = useState("");

  const [processing, setProcessing] = useState(false);
  const [ai, setAi] = useState<AIResult | null>(null);
  const [analysisLine, setAnalysisLine] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: intake }, { data: profile }] = await Promise.all([
        supabase.from("intake_sessions").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("full_name, display_name").eq("id", user.id).maybeSingle(),
      ]);
      if (intake?.status === "completed") {
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      const g = (intake?.genealogy as Record<string, string>) ?? {};
      const c = (intake?.childhood as Record<string, string>) ?? {};
      setRaices(g.raices ?? "");
      setRecuerdos(c.recuerdos ?? "");
      setName(profile?.display_name || profile?.full_name || "");
      setLoading(false);
    })();
  }, [user, navigate]);

  const lines = [
    "Leyendo tus respuestas…",
    "Encontrando patrones…",
    "Conectando tu experiencia…",
    "Analizando emociones…",
    "Detectando fortalezas…",
    "Preparando tu diagnóstico personalizado…",
  ];

  useEffect(() => {
    if (step !== 4 || !processing) return;
    setAnalysisLine(0);
    const id = setInterval(() => setAnalysisLine((n) => Math.min(n + 1, lines.length - 1)), 1100);
    return () => clearInterval(id);
  }, [step, processing, lines.length]);

  async function persist(extra: Record<string, unknown> = {}) {
    if (!user) return;
    await supabase.from("intake_sessions").upsert({
      user_id: user.id,
      stage: step,
      genealogy: { raices },
      childhood: { recuerdos },
      ...extra,
    }, { onConflict: "user_id" });
  }

  async function goNext() {
    if (step === 1) {
      if (!name.trim()) return toast.error("Escribe cómo quieres que te llamemos");
      await supabase.from("profiles").update({ display_name: name.trim(), full_name: name.trim() }).eq("id", user!.id);
      await awardGems(GEM_REWARDS.onboardingStep, "Paso 1 completado");
      setDir(1); setStep(2);
    } else if (step === 2) {
      if (raices.trim().length < 8) return toast.error("Cuéntanos con al menos una frase");
      await persist();
      await awardGems(GEM_REWARDS.onboardingStep, "Paso 2 completado");
      setDir(1); setStep(3);
    } else if (step === 3) {
      if (recuerdos.trim().length < 8) return toast.error("Cuéntanos con al menos una frase");
      await persist();
      await awardGems(GEM_REWARDS.onboardingStep, "Paso 3 completado");
      setDir(1); setStep(4);
      await runAnalysis();
    } else if (step === 5) {
      setDir(1); setStep(6);
    } else if (step === 6) {
      await complete();
    }
  }

  async function runAnalysis() {
    setProcessing(true);
    try {
      const r = await fetch("/api/intake-closure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, genealogy: { raices }, childhood: { recuerdos } }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Error");
      // ensure minimum time so the analysis screen doesn't flash
      await new Promise((res) => setTimeout(res, 3800));
      setAi(j);
      await persist({ ai_plan: j, ai_summary: j.pattern_summary, primary_focus: j.primary_focus });
      setDir(1); setStep(5);
    } catch (e) {
      toast.error((e as Error).message);
      setDir(-1); setStep(3);
    } finally {
      setProcessing(false);
    }
  }

  async function complete() {
    if (!user || !ai) return;
    await persist({ status: "completed", closure_completed_at: new Date().toISOString(), ai_plan: ai });
    await awardGems(500, "Onboarding completo");
    toast.success(`¡Bienvenido${name ? ", " + name : ""}!`);
    navigate({ to: "/dashboard", replace: true });
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* Ambient blurred lights */}
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-32 w-[34rem] h-[34rem] rounded-full blur-[110px]"
        style={{ background: "radial-gradient(circle, rgba(124,92,255,0.18), transparent 65%)" }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-32 w-[36rem] h-[36rem] rounded-full blur-[110px]"
        style={{ background: "radial-gradient(circle, rgba(245,139,203,0.16), transparent 65%)" }} />
      <div aria-hidden className="pointer-events-none absolute top-1/3 right-1/4 w-[22rem] h-[22rem] rounded-full blur-[110px]"
        style={{ background: "radial-gradient(circle, rgba(97,168,255,0.10), transparent 65%)" }} />

      <div className="relative z-10 mx-auto max-w-lg px-5 pt-10 pb-16 min-h-screen flex flex-col">
        {/* Progress header (hidden on analysis step) */}
        {step !== 4 && (
          <div className="mb-8">
            <div className="text-center text-[13px] font-medium text-[#64667A]">Paso {step} de {TOTAL_STEPS}</div>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    i + 1 <= step ? "w-8 bg-gradient-primary" : "w-5 bg-[#ECEEF5]"
                  )} />
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 flex items-start justify-center">
          <div
            key={step}
            className={cn(
              "w-full",
              dir === 1
                ? "animate-in fade-in slide-in-from-right-6 duration-300"
                : "animate-in fade-in slide-in-from-left-6 duration-300"
            )}
          >
            {step === 1 && <Screen1 name={name} setName={setName} onNext={goNext} />}
            {step === 2 && <Screen2 value={raices} setValue={setRaices} onNext={goNext} onBack={() => { setDir(-1); setStep(1); }} />}
            {step === 3 && <Screen3 value={recuerdos} setValue={setRecuerdos} onNext={goNext} onBack={() => { setDir(-1); setStep(2); }} />}
            {step === 4 && <Screen4 line={lines[analysisLine]} />}
            {step === 5 && ai && <Screen5 ai={ai} onNext={goNext} />}
            {step === 6 && ai && <Screen6 ai={ai} onNext={goNext} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────── Shared building blocks ────────── */

function AuraIcon({ children, tint = "purple" }: { children: React.ReactNode; tint?: "purple" | "blue" | "pink" }) {
  const bg =
    tint === "blue"
      ? "radial-gradient(circle, rgba(97,168,255,0.35), rgba(97,168,255,0) 65%)"
      : tint === "pink"
        ? "radial-gradient(circle, rgba(245,139,203,0.38), rgba(245,139,203,0) 65%)"
        : "radial-gradient(circle, rgba(124,92,255,0.35), rgba(124,92,255,0) 65%)";
  return (
    <div className="relative mx-auto w-32 h-32 grid place-items-center">
      <div aria-hidden className="absolute inset-0 rounded-full blur-2xl animate-glow" style={{ background: bg }} />
      <div className="relative w-24 h-24 rounded-full bg-white shadow-soft grid place-items-center animate-breathe">
        {children}
      </div>
    </div>
  );
}

function ScreenCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] bg-white shadow-soft p-7 md:p-9 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {children}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full h-14 rounded-[18px] btn-primary-gradient font-semibold text-[15px] tracking-tight text-white inline-flex items-center justify-center gap-2 disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function BackLink({ onBack }: { onBack?: () => void }) {
  if (!onBack) return null;
  return (
    <button onClick={onBack} className="inline-flex items-center gap-1 text-[13px] text-[#64667A] hover:text-[#1B1B27] transition-colors mb-4">
      <ArrowLeft className="w-4 h-4" /> Atrás
    </button>
  );
}

function PrivacyNote() {
  return (
    <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-[#64667A]">
      <Lock className="w-3.5 h-3.5" /> Solo tú podrás leer esto.
    </div>
  );
}

/* ────────── Screens ────────── */

function Screen1({ name, setName, onNext }: { name: string; setName: (s: string) => void; onNext: () => void }) {
  return (
    <ScreenCard>
      <AuraIcon tint="purple">
        <svg viewBox="0 0 24 24" className="w-11 h-11" fill="none" stroke="url(#g1)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7C5CFF" /><stop offset="1" stopColor="#F58BCB" />
            </linearGradient>
          </defs>
          <path d="M12 3c1.8 2.5 1.8 5 0 7.5-1.8-2.5-1.8-5 0-7.5Z" />
          <path d="M4.5 10.5c2.9-.5 5.1.7 6.5 3.2-2.9.5-5.1-.7-6.5-3.2Z" />
          <path d="M19.5 10.5c-2.9-.5-5.1.7-6.5 3.2 2.9.5 5.1-.7 6.5-3.2Z" />
          <path d="M8 17c1.4-1.6 3.3-2.2 4-2.2s2.6.6 4 2.2c-1.4 1.7-3.3 2.3-4 2.3s-2.6-.6-4-2.3Z" />
          <circle cx="12" cy="13.7" r="1.4" />
        </svg>
      </AuraIcon>
      <h1 className="text-center font-display font-extrabold text-[34px] leading-[1.1] mt-6 text-[#1B1B27]">
        Bienvenido <span className="text-[#F58BCB]">♡</span>
      </h1>
      <p className="text-center text-[15px] text-[#64667A] mt-4 leading-relaxed">
        Este recorrido dura menos de 3 minutos.<br />
        Cada respuesta nos ayudará a comprender mejor tu historia.
      </p>
      <p className="text-center text-[13px] text-[#7C5CFF] font-medium mt-3">No existen respuestas correctas.</p>

      <div className="mt-8 rounded-[18px] border border-[#ECEEF5] bg-white px-4 py-4 shadow-[0_2px_10px_rgba(22,25,45,0.03)]">
        <div className="flex items-center gap-2 text-[#7C5CFF]">
          <UserIcon className="w-4 h-4" />
          <span className="text-[13px] font-semibold text-[#1B1B27]">¿Cómo quieres que te llamemos?</span>
        </div>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Escribe tu nombre"
          className="mt-2 h-11 border-0 shadow-none bg-transparent px-0 text-[16px] focus-visible:ring-0"
        />
      </div>

      <div className="mt-7">
        <PrimaryButton onClick={onNext}>Continuar <ArrowRight className="w-4 h-4" /></PrimaryButton>
      </div>
    </ScreenCard>
  );
}

function Screen2({ value, setValue, onNext, onBack }: { value: string; setValue: (s: string) => void; onNext: () => void; onBack?: () => void }) {
  return (
    <>
      <BackLink onBack={onBack} />
      <ScreenCard>
        <AuraIcon tint="purple">
          <svg viewBox="0 0 24 24" className="w-11 h-11" fill="none" stroke="url(#g2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#7C5CFF" /><stop offset="1" stopColor="#61A8FF" />
              </linearGradient>
            </defs>
            <path d="M12 3v18" />
            <path d="M12 8c-2-2-5-2-7 0" /><path d="M12 8c2-2 5-2 7 0" />
            <path d="M12 12c-3-2-6-2-8 0" /><path d="M12 12c3-2 6-2 8 0" />
            <path d="M9 21h6" />
          </svg>
        </AuraIcon>
        <h2 className="text-center font-display font-extrabold text-[30px] mt-6 text-[#1B1B27]">Tus raíces 🌿</h2>
        <p className="text-center text-[14px] text-[#64667A] mt-3 leading-relaxed">
          Las historias familiares pueden influir en cómo vivimos hoy.
        </p>
        <p className="text-center font-display font-semibold text-[16px] mt-5 text-[#1B1B27]">
          ¿Qué patrones has observado repetirse en tu familia o linaje?
        </p>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Escribe con libertad…"
          className="mt-5 min-h-36 rounded-[18px] border-[#ECEEF5] bg-white text-[15px] resize-none focus-visible:ring-2 focus-visible:ring-[#7C5CFF]/25 focus-visible:border-[#7C5CFF]"
        />
        <div className="mt-5 flex items-center justify-between gap-3">
          <PrivacyNote />
          <button onClick={onNext} className="h-12 px-6 rounded-[18px] btn-primary-gradient font-semibold text-[14px] text-white inline-flex items-center gap-2">
            Continuar <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </ScreenCard>
    </>
  );
}

function Screen3({ value, setValue, onNext, onBack }: { value: string; setValue: (s: string) => void; onNext: () => void; onBack?: () => void }) {
  return (
    <>
      <BackLink onBack={onBack} />
      <ScreenCard>
        <AuraIcon tint="pink">
          <svg viewBox="0 0 24 24" className="w-11 h-11" fill="none" stroke="url(#g3)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="g3" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#7C5CFF" /><stop offset="1" stopColor="#F58BCB" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="6.5" r="2" />
            <path d="M8 21c0-3 1.8-5 4-5s4 2 4 5" />
            <path d="M5 14c1.5-2 4-3 7-3s5.5 1 7 3" />
            <path d="M3 20c2-3 6-5 9-5s7 2 9 5" opacity=".3" />
          </svg>
        </AuraIcon>
        <h2 className="text-center font-display font-extrabold text-[30px] mt-6 text-[#1B1B27]">
          Tus primeros recuerdos <span className="text-[#F58BCB]">♡</span>
        </h2>
        <p className="text-center text-[14px] text-[#64667A] mt-3 leading-relaxed">
          A veces un recuerdo explica más que cientos de palabras.
        </p>
        <p className="text-center font-display font-semibold text-[16px] mt-5 text-[#1B1B27]">
          ¿Qué experiencia marcó tu infancia de manera profunda?
        </p>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Escribe con libertad…"
          className="mt-5 min-h-36 rounded-[18px] border-[#ECEEF5] bg-white text-[15px] resize-none focus-visible:ring-2 focus-visible:ring-[#7C5CFF]/25 focus-visible:border-[#7C5CFF]"
        />
        <div className="mt-5 flex items-center justify-between gap-3">
          <PrivacyNote />
          <button onClick={onNext} className="h-12 px-6 rounded-[18px] btn-primary-gradient font-semibold text-[14px] text-white inline-flex items-center gap-2">
            Continuar <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </ScreenCard>
    </>
  );
}

function Screen4({ line }: { line: string }) {
  return (
    <div className="pt-14 text-center">
      <div className="relative mx-auto w-40 h-40 grid place-items-center">
        <div aria-hidden className="absolute inset-0 rounded-full blur-3xl animate-glow"
          style={{ background: "radial-gradient(circle, rgba(124,92,255,0.35), rgba(245,139,203,0.25) 40%, transparent 70%)" }} />
        <div className="relative w-28 h-28 rounded-full bg-white shadow-soft animate-breathe"
          style={{ background: "radial-gradient(circle at 30% 30%, #ffffff, #F4F6FF 60%, #E9E4FF 100%)" }} />
      </div>
      <h2 className="mt-8 font-display font-extrabold text-[26px] text-[#1B1B27]">Analizando tu historia…</h2>
      <div className="mt-6 h-6">
        <p key={line} className="text-[14px] text-[#64667A] animate-in fade-in slide-in-from-bottom-2 duration-500">
          {line}
        </p>
      </div>
    </div>
  );
}

function Screen5({ ai, onNext }: { ai: AIResult; onNext: () => void }) {
  return (
    <div>
      <p className="text-center text-[12px] tracking-widest font-semibold text-[#7C5CFF] uppercase mt-2">
        Tu patrón principal ✨
      </p>
      <h2 className="text-center font-display font-extrabold text-[30px] mt-3 text-gradient-emotional">
        {ai.pattern_name}
      </h2>

      <div className="mt-6 rounded-[24px] bg-[#F7F8FD] p-5">
        <p className="text-[14px] leading-relaxed text-[#1B1B27]">
          <span className="text-[#7C5CFF] font-bold">“</span>
          {ai.pattern_summary}
          <span className="text-[#7C5CFF] font-bold">”</span>
        </p>
      </div>

      <p className="mt-7 font-display font-semibold text-[15px] text-[#1B1B27]">Cómo afecta hoy</p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <ImpactCard icon={<Heart className="w-5 h-5" />} tint="pink" title="Relaciones" text={ai.impact.relaciones} />
        <ImpactCard icon={<DollarSign className="w-5 h-5" />} tint="purple" title="Prosperidad" text={ai.impact.prosperidad} />
        <ImpactCard icon={<Brain className="w-5 h-5" />} tint="blue" title="Emociones" text={ai.impact.emociones} />
      </div>

      <div className="mt-8">
        <PrimaryButton onClick={onNext}>Continuar <ArrowRight className="w-4 h-4" /></PrimaryButton>
      </div>
    </div>
  );
}

function ImpactCard({ icon, tint, title, text }: { icon: React.ReactNode; tint: "pink" | "purple" | "blue"; title: string; text: string }) {
  const color = tint === "pink" ? "#F58BCB" : tint === "blue" ? "#61A8FF" : "#7C5CFF";
  const bg = tint === "pink" ? "#FFF1F8" : tint === "blue" ? "#EEF5FF" : "#F1EDFF";
  return (
    <div className="rounded-[20px] bg-white border border-[#ECEEF5] p-3.5 text-center">
      <div className="mx-auto w-10 h-10 rounded-2xl grid place-items-center" style={{ background: bg, color }}>
        {icon}
      </div>
      <div className="mt-2 text-[12px] font-semibold" style={{ color }}>{title}</div>
      <p className="mt-1 text-[11px] leading-snug text-[#64667A]">{text}</p>
    </div>
  );
}

function Screen6({ ai, onNext }: { ai: AIResult; onNext: () => void }) {
  return (
    <div>
      <p className="text-[12px] tracking-widest font-semibold text-[#43C78E] uppercase">Lo positivo ♡</p>
      <h2 className="font-display font-extrabold text-[26px] mt-2 text-[#1B1B27]">
        Toda herida también desarrolla fortalezas.
      </h2>
      <p className="text-[14px] text-[#64667A] mt-2">Has aprendido a…</p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <StrengthCard icon={<Sprout className="w-5 h-5" />} tint="blue" title="Adaptarte" text={ai.strengths.adaptarte} />
        <StrengthCard icon={<Mountain className="w-5 h-5" />} tint="purple" title="Resistir" text={ai.strengths.resistir} />
        <StrengthCard icon={<HandHeart className="w-5 h-5" />} tint="pink" title="Ayudar a otros" text={ai.strengths.ayudar} />
      </div>

      <div className="mt-8 rounded-[24px] bg-[#F7F8FD] p-6">
        <p className="text-[12px] tracking-widest font-semibold text-[#7C5CFF] uppercase">Tu camino ✨</p>
        <h3 className="mt-2 font-display font-bold text-[20px] text-[#1B1B27]">Aquí empieza el verdadero cambio.</h3>
        <p className="mt-3 text-[14px] leading-relaxed text-[#64667A]">
          No prometemos milagros. Te acompañaremos con herramientas prácticas para ayudarte a comprender tu historia,
          fortalecer tu bienestar emocional y avanzar paso a paso hacia una vida con mayor claridad y equilibrio.
        </p>
        <p className="mt-4 text-[13px] italic text-[#7C5CFF]">{ai.welcome_message}</p>
      </div>

      <div className="mt-8">
        <PrimaryButton onClick={onNext}>Comenzar mi transformación ✨</PrimaryButton>
      </div>
    </div>
  );
}

function StrengthCard({ icon, tint, title, text }: { icon: React.ReactNode; tint: "pink" | "purple" | "blue"; title: string; text: string }) {
  const color = tint === "pink" ? "#F58BCB" : tint === "blue" ? "#61A8FF" : "#7C5CFF";
  const bg = tint === "pink" ? "#FFF1F8" : tint === "blue" ? "#EEF5FF" : "#F1EDFF";
  return (
    <div className="rounded-[20px] bg-white border border-[#ECEEF5] p-3.5 text-center">
      <div className="mx-auto w-10 h-10 rounded-2xl grid place-items-center" style={{ background: bg, color }}>
        {icon}
      </div>
      <div className="mt-2 text-[12px] font-semibold text-[#1B1B27]">{title}</div>
      <p className="mt-1 text-[11px] leading-snug text-[#64667A]">{text}</p>
    </div>
  );
}

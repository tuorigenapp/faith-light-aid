import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Heart, Sparkles, HandHeart, Loader2, ShieldCheck, Gem } from "lucide-react";
import { awardGems, GEM_REWARDS } from "@/lib/gems";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Bienvenida — Reconectando" }] }),
  component: Onboarding,
});

type Step = {
  key: string;
  section: "genealogy" | "childhood";
  emoji: string;
  label: string;
  placeholder: string;
};

const STEPS: Step[] = [
  { key: "relaciones", section: "genealogy", emoji: "🌳", label: "Pensando en 3-4 familiares (abuelos, padres, tíos, sobrinos): ¿qué patrones repetidos ves en sus relaciones o forma de amar?", placeholder: "Escribe con sinceridad. Ejemplo: mi mamá y mi abuela vivieron relaciones donde daban todo y recibían poco…" },
  { key: "miedos", section: "genealogy", emoji: "😰", label: "¿Qué miedos, traumas o creencias limitantes se repiten en tu familia?", placeholder: "Ejemplo: miedo a la escasez, a quedarse solo, a fallar…" },
  { key: "crisis", section: "genealogy", emoji: "⛓️", label: "¿Qué crisis (adicción, ruina, divorcio, enfermedad, abandono, etc.) se han repetido de generación en generación?", placeholder: "Menciona 2-3 concretas que veas repetirse…" },
  { key: "recuerdos", section: "childhood", emoji: "🧒", label: "¿Cuáles son los recuerdos más marcados de tu infancia (buenos o dolorosos)?", placeholder: "Nadie más lo verá. Escribe con confianza…" },
  { key: "heridas", section: "childhood", emoji: "💔", label: "¿Qué herida emocional cargas desde niño(a) que aún no has soltado?", placeholder: "Describe la herida con tus propias palabras…" },
  { key: "creencias", section: "childhood", emoji: "💭", label: "¿Qué creencias sobre ti, sobre Dios o sobre la vida aprendiste de niño(a) y hoy quieres cambiar?", placeholder: "Ejemplo: 'no soy suficiente', 'Dios está lejos', 'tengo que ganarme el amor'…" },
];

function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [step, setStep] = useState(-1); // -1 = welcome/name, 0..N-1 = questions, N = generating, N+1 = closure
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [rewarded, setRewarded] = useState<Record<string, boolean>>({});
  const [ai, setAi] = useState<{ summary: string; primary_focus: string; recommended_categories: string[]; closure_prayer: string; welcome_message: string; needs_more: false | string } | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: intake }, { data: profile }] = await Promise.all([
        supabase.from("intake_sessions").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("full_name, display_name").eq("id", user.id).maybeSingle(),
      ]);
      if (intake?.status === "completed") { navigate({ to: "/dashboard", replace: true }); return; }
      const genealogy = (intake?.genealogy as Record<string, string>) ?? {};
      const childhood = (intake?.childhood as Record<string, string>) ?? {};
      setAnswers({ ...genealogy, ...childhood });
      setName(profile?.display_name || profile?.full_name || "");
      if (intake?.ai_plan) { setAi(intake.ai_plan as never); setStep(STEPS.length + 1); }
      else if (intake?.stage === 2) setStep(3);
      else setStep(-1);
      setLoading(false);
    })();
  }, [user, navigate]);

  const current = step >= 0 && step < STEPS.length ? STEPS[step] : null;
  const progress = step < 0 ? 5 : step >= STEPS.length ? 100 : Math.round(((step + 1) / (STEPS.length + 1)) * 90 + 5);

  async function persist(stageNumber: number, extra: Record<string, unknown> = {}) {
    if (!user) return;
    const genealogy: Record<string, string> = {};
    const childhood: Record<string, string> = {};
    for (const s of STEPS) {
      const v = answers[s.key] ?? "";
      if (s.section === "genealogy") genealogy[s.key] = v; else childhood[s.key] = v;
    }
    await supabase.from("intake_sessions").upsert({
      user_id: user.id, stage: stageNumber, genealogy, childhood, ...extra,
    }, { onConflict: "user_id" });
  }

  async function saveName() {
    if (!user) return;
    const clean = name.trim();
    if (!clean) return toast.error("Escribe tu nombre para comenzar");
    await supabase.from("profiles").update({ display_name: clean, full_name: clean }).eq("id", user.id);
    setStep(0);
  }

  async function goNext() {
    if (!current) return;
    const v = (answers[current.key] ?? "").trim();
    if (v.length < 8) return toast.error("Responde con al menos una frase completa. Tu sinceridad importa.");
    if (!rewarded[current.key]) {
      await awardGems(GEM_REWARDS.onboardingStep, `Paso completado: ${current.emoji}`);
      setRewarded({ ...rewarded, [current.key]: true });
    }
    if (step === STEPS.length - 1) {
      await persist(2);
      await generateClosure();
    } else {
      await persist(current.section === "genealogy" && STEPS[step + 1].section === "childhood" ? 2 : 1);
      setStep(step + 1);
    }
  }

  async function generateClosure() {
    setProcessing(true);
    setStep(STEPS.length);
    try {
      const genealogy: Record<string, string> = {};
      const childhood: Record<string, string> = {};
      for (const s of STEPS) {
        const v = answers[s.key] ?? "";
        if (s.section === "genealogy") genealogy[s.key] = v; else childhood[s.key] = v;
      }
      const r = await fetch("/api/intake-closure", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ genealogy, childhood }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Error");
      setAi(j);
      await persist(3, { ai_plan: j, ai_summary: j.summary, primary_focus: j.primary_focus });
      setStep(STEPS.length + 1);
    } catch (e) { toast.error((e as Error).message); setStep(STEPS.length - 1); }
    setProcessing(false);
  }

  async function completeIntake() {
    if (!user || !ai) return;
    await persist(3, { status: "completed", closure_completed_at: new Date().toISOString(), ai_plan: ai });
    await awardGems(500, "Bienvenida completa 🎉");
    toast.success("Bienvenido(a) a tu programa personalizado");
    navigate({ to: "/dashboard", replace: true });
  }

  if (loading) return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:p-10 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          {step < 0 ? "Bienvenida" : step >= STEPS.length ? "Cierre" : `Paso ${step + 1} de ${STEPS.length}`}
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-extrabold">
          <Gem className="w-3.5 h-3.5" /> +{Object.keys(rewarded).length * GEM_REWARDS.onboardingStep}
        </div>
      </div>
      <Progress value={progress} className="mb-8 h-2" />

      {/* WELCOME */}
      {step === -1 && (
        <Card className="p-6 md:p-10 rounded-[2rem] shadow-soft text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-6xl mb-3 animate-bounce">✨</div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-[11px] font-black uppercase tracking-widest"><ShieldCheck className="w-3.5 h-3.5" /> 100% privado</div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl mt-4">Antes de comenzar</h1>
          <p className="text-muted-foreground mt-3">Vamos a personalizar tu programa contigo. Toma 3 minutos, con sinceridad. Cada paso te da <span className="font-bold text-primary">gemas de sanación 💎</span>.</p>
          <div className="mt-6 text-left">
            <label className="text-sm font-semibold">¿Cómo quieres que te llamemos?</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" className="mt-2 rounded-2xl h-12" />
          </div>
          <Button onClick={saveName} className="mt-6 w-full h-13 rounded-full bg-primary font-bold text-base">Comenzar mi camino <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </Card>
      )}

      {/* QUESTION STEPS */}
      {current && (
        <Card key={current.key} className="p-6 md:p-10 rounded-[2rem] shadow-soft animate-in fade-in slide-in-from-right-4 duration-400">
          <div className="text-[11px] font-black uppercase tracking-widest text-primary">
            {current.section === "genealogy" ? "🌳 Tu árbol genealógico" : "🧒 Tu infancia"}
          </div>
          <div className="mt-4 flex items-start gap-4">
            <div className="text-5xl md:text-6xl animate-[bounce_1.6s_ease-in-out_infinite]" aria-hidden>{current.emoji}</div>
            <h2 className="font-display font-bold text-xl md:text-2xl leading-tight">{current.label}</h2>
          </div>
          <Textarea
            value={answers[current.key] ?? ""}
            onChange={(e) => setAnswers({ ...answers, [current.key]: e.target.value })}
            placeholder={current.placeholder}
            className="mt-5 min-h-32 md:min-h-40 rounded-2xl text-base"
            autoFocus
          />
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Nada de lo que escribas se comparte con nadie.
          </div>
          <div className="mt-6 flex items-center gap-3">
            {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)} className="rounded-full"><ArrowLeft className="w-4 h-4 mr-1" /> Atrás</Button>}
            <Button onClick={goNext} className="flex-1 h-12 rounded-full bg-primary font-bold">
              {step === STEPS.length - 1 ? <>Generar mi diagnóstico <Sparkles className="w-4 h-4 ml-2" /></> : <>Continuar +{GEM_REWARDS.onboardingStep} 💎 <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </div>
        </Card>
      )}

      {/* GENERATING */}
      {step === STEPS.length && processing && (
        <Card className="p-10 rounded-[2rem] shadow-soft text-center">
          <div className="text-6xl mb-4 animate-pulse">🕊️</div>
          <h2 className="font-display font-bold text-2xl">Analizando tu historia…</h2>
          <p className="mt-2 text-muted-foreground">Identificando el patrón espiritual de tu linaje.</p>
          <Loader2 className="w-6 h-6 animate-spin mx-auto mt-6 text-primary" />
        </Card>
      )}

      {/* CLOSURE */}
      {step > STEPS.length && ai && (
        <div className="space-y-5 animate-in fade-in duration-500">
          <Card className="p-6 md:p-8 rounded-[2rem] shadow-glow bg-gradient-to-br from-primary/10 via-background to-gold/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center"><HandHeart className="w-6 h-6" /></div>
              <div>
                <div className="text-[11px] uppercase tracking-widest text-primary font-black">Cierre y solución</div>
                <h2 className="font-display font-bold text-2xl">Tu diagnóstico personalizado</h2>
              </div>
            </div>
            {ai.needs_more && <p className="mt-4 text-sm text-destructive">⚠ Falta detalle: {ai.needs_more}</p>}
            <div className="mt-5">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Patrón identificado</div>
              <p className="mt-2 text-sm md:text-base leading-relaxed whitespace-pre-line">{ai.summary}</p>
            </div>
            <div className="mt-5 grid sm:grid-cols-2 gap-3">
              <div className="rounded-2xl bg-background/60 p-4 border border-border">
                <div className="text-[11px] uppercase tracking-widest text-primary font-bold">Enfoque</div>
                <div className="font-display font-bold text-lg mt-1 capitalize">{ai.primary_focus}</div>
              </div>
              <div className="rounded-2xl bg-background/60 p-4 border border-border">
                <div className="text-[11px] uppercase tracking-widest text-gold font-bold">Áreas recomendadas</div>
                <div className="text-sm mt-1">{(ai.recommended_categories ?? []).join(" · ")}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 md:p-8 rounded-[2rem] shadow-soft border-l-4 border-l-gold">
            <div className="text-[11px] uppercase tracking-widest text-gold font-bold flex items-center gap-2"><Heart className="w-4 h-4" /> Oración de cierre — perdona, suelta, avanza</div>
            <p className="mt-3 text-base md:text-lg leading-relaxed whitespace-pre-line italic">{ai.closure_prayer}</p>
          </Card>

          <Card className="p-5 rounded-[1.7rem] bg-primary text-primary-foreground text-center">
            <p className="text-sm leading-relaxed">{ai.welcome_message}</p>
            <Button onClick={completeIntake} disabled={!!ai.needs_more} className="mt-4 rounded-full bg-gold text-gold-foreground hover:bg-gold/90 h-12 px-8 font-bold">
              Cerrar ciclo y entrar (+500 💎) <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

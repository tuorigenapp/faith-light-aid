import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowRight, Heart, Sparkles, TreeDeciduous, Baby, HandHeart, Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Bienvenida — Reconectando" }] }),
  component: Onboarding,
});

const GENE_Q = [
  { key: "relaciones", label: "Pensando en 3-4 familiares (abuelos, padres, tíos, sobrinos): ¿qué patrones repetidos ves en sus relaciones, hábitos o forma de amar?" },
  { key: "miedos", label: "¿Qué miedos, traumas o creencias limitantes se repiten en tu familia?" },
  { key: "crisis", label: "¿Qué crisis (adicción, ruina económica, divorcio, enfermedad, abandono, etc.) se han repetido de generación en generación?" },
];
const CHILD_Q = [
  { key: "recuerdos", label: "¿Cuáles son los recuerdos más marcados de tu infancia (buenos o dolorosos)? Escribe con confianza, nadie más lo verá." },
  { key: "heridas", label: "¿Qué herida emocional cargas desde niño(a) que aún no has soltado?" },
  { key: "creencias", label: "¿Qué creencias sobre ti mismo(a), sobre Dios o sobre la vida aprendiste en tu infancia y hoy quieres cambiar?" },
];

function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState(1);
  const [gen, setGen] = useState<Record<string, string>>({});
  const [child, setChild] = useState<Record<string, string>>({});
  const [ai, setAi] = useState<{ summary: string; primary_focus: string; recommended_categories: string[]; closure_prayer: string; welcome_message: string; needs_more: false | string } | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("intake_sessions").select("*").eq("user_id", user.id).maybeSingle();
      if (data?.status === "completed") { navigate({ to: "/dashboard", replace: true }); return; }
      if (data) {
        setStage(data.stage ?? 1);
        setGen((data.genealogy as any) ?? {});
        setChild((data.childhood as any) ?? {});
        if (data.ai_plan) setAi(data.ai_plan as any);
      }
      setLoading(false);
    })();
  }, [user, navigate]);

  async function saveDraft(nextStage: number, extra: Partial<{ genealogy: any; childhood: any; ai_plan: any; ai_summary: string; primary_focus: string; status: string; closure_completed_at: string }> = {}) {
    if (!user) return;
    await supabase.from("intake_sessions").upsert({
      user_id: user.id,
      stage: nextStage,
      genealogy: gen,
      childhood: child,
      ...extra,
    }, { onConflict: "user_id" });
  }

  async function nextFromGen() {
    for (const q of GENE_Q) if (!(gen[q.key] ?? "").trim()) return toast.error("Responde las 3 preguntas con sinceridad.");
    await saveDraft(2);
    setStage(2);
  }

  async function generateClosure() {
    for (const q of CHILD_Q) if (!(child[q.key] ?? "").trim()) return toast.error("Responde las 3 preguntas con sinceridad.");
    setProcessing(true);
    try {
      const r = await fetch("/api/intake-closure", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ genealogy: gen, childhood: child }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Error");
      setAi(j);
      await saveDraft(3, { ai_plan: j, ai_summary: j.summary, primary_focus: j.primary_focus });
      setStage(3);
    } catch (e) { toast.error((e as Error).message); }
    setProcessing(false);
  }

  async function completeIntake() {
    if (!user || !ai) return;
    await saveDraft(3, { status: "completed", closure_completed_at: new Date().toISOString(), ai_plan: ai, ai_summary: ai.summary, primary_focus: ai.primary_focus });
    toast.success("Bienvenido(a) a tu programa personalizado");
    navigate({ to: "/dashboard", replace: true });
  }

  if (loading) return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const progress = stage === 1 ? 33 : stage === 2 ? 66 : 100;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:p-10 pb-24">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-1.5 text-xs font-bold uppercase tracking-widest"><ShieldCheck className="w-3.5 h-3.5" /> 100% privado · no se comparte</div>
        <h1 className="font-display font-extrabold text-3xl md:text-5xl mt-4">Antes de comenzar</h1>
        <p className="text-muted-foreground mt-2">Este proceso identifica el patrón espiritual y emocional de tu linaje para personalizar tu programa.</p>
      </div>
      <Progress value={progress} className="mb-8" />

      {stage === 1 && (
        <Card className="p-6 md:p-8 rounded-[2rem] shadow-soft">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary grid place-items-center"><TreeDeciduous className="w-6 h-6" /></div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-primary font-extrabold">Etapa 1 de 3</div>
              <h2 className="font-display font-bold text-2xl">Patrón del árbol genealógico</h2>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">Basándonos en tus familiares (no importa si son abuelo, abuela, padre, madre, tío, tía, sobrino, sobrina), responde con sinceridad. Esto crea tu programa de reconectar tu espíritu con Dios.</p>
          <div className="mt-6 space-y-6">
            {GENE_Q.map((q) => (
              <div key={q.key}>
                <label className="font-medium text-sm">{q.label}</label>
                <Textarea value={gen[q.key] ?? ""} onChange={(e) => setGen({ ...gen, [q.key]: e.target.value })} className="mt-2 min-h-28 rounded-2xl" placeholder="Sé específico y sincero..." />
              </div>
            ))}
          </div>
          <Button onClick={nextFromGen} className="mt-8 w-full rounded-full h-12 bg-primary">Continuar a la infancia <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </Card>
      )}

      {stage === 2 && (
        <Card className="p-6 md:p-8 rounded-[2rem] shadow-soft">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gold/15 text-gold grid place-items-center"><Baby className="w-6 h-6" /></div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-gold font-extrabold">Etapa 2 de 3</div>
              <h2 className="font-display font-bold text-2xl">Tu infancia</h2>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">Sin tabúes, sin miedo, nadie te juzga. Nada de lo que escribas se comparte con otras personas.</p>
          <div className="mt-6 space-y-6">
            {CHILD_Q.map((q) => (
              <div key={q.key}>
                <label className="font-medium text-sm">{q.label}</label>
                <Textarea value={child[q.key] ?? ""} onChange={(e) => setChild({ ...child, [q.key]: e.target.value })} className="mt-2 min-h-28 rounded-2xl" placeholder="Con toda confianza..." />
              </div>
            ))}
          </div>
          <div className="mt-8 flex gap-3">
            <Button variant="ghost" onClick={() => setStage(1)} className="rounded-full">Atrás</Button>
            <Button onClick={generateClosure} disabled={processing} className="flex-1 rounded-full h-12 bg-primary">
              {processing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analizando con IA...</> : <>Generar mi cierre y solución <Sparkles className="w-4 h-4 ml-2" /></>}
            </Button>
          </div>
        </Card>
      )}

      {stage === 3 && ai && (
        <div className="space-y-5">
          <Card className="p-6 md:p-8 rounded-[2rem] shadow-glow bg-gradient-to-br from-primary/8 via-background to-gold/6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center"><HandHeart className="w-6 h-6" /></div>
              <div>
                <div className="text-[11px] uppercase tracking-widest text-primary font-extrabold">Etapa 3 de 3 · Cierre y solución</div>
                <h2 className="font-display font-bold text-2xl">Tu diagnóstico personalizado</h2>
              </div>
            </div>
            {ai.needs_more && <p className="mt-4 text-sm text-destructive">⚠ La IA necesita más detalle: {ai.needs_more}. Vuelve atrás y amplía tus respuestas.</p>}
            <div className="mt-5">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Resumen del patrón identificado</div>
              <p className="mt-2 text-sm md:text-base leading-relaxed whitespace-pre-line">{ai.summary}</p>
            </div>
            <div className="mt-5 grid sm:grid-cols-2 gap-3">
              <div className="rounded-2xl bg-background/60 p-4 border border-border">
                <div className="text-[11px] uppercase tracking-widest text-primary font-bold">Enfoque principal</div>
                <div className="font-display font-bold text-lg mt-1 capitalize">{ai.primary_focus}</div>
              </div>
              <div className="rounded-2xl bg-background/60 p-4 border border-border">
                <div className="text-[11px] uppercase tracking-widest text-gold font-bold">Categorías recomendadas</div>
                <div className="text-sm mt-1">{(ai.recommended_categories ?? []).join(" · ")}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 md:p-8 rounded-[2rem] shadow-soft border-l-4 border-l-gold">
            <div className="text-[11px] uppercase tracking-widest text-gold font-bold flex items-center gap-2"><Heart className="w-4 h-4" /> Ritual de cierre — perdona, suelta, avanza</div>
            <p className="scripture mt-3 text-base md:text-lg leading-relaxed whitespace-pre-line">{ai.closure_prayer}</p>
            <p className="text-sm text-muted-foreground mt-4">Repite esta oración en voz alta. Al terminar, presiona el botón para cerrar el ciclo y entrar a tu programa personalizado.</p>
          </Card>

          <Card className="p-5 rounded-[1.7rem] bg-primary text-primary-foreground text-center">
            <p className="text-sm leading-relaxed">{ai.welcome_message}</p>
            <Button onClick={completeIntake} disabled={!!ai.needs_more} className="mt-4 rounded-full bg-gold text-gold-foreground hover:bg-gold/90 h-12 px-8 font-bold">
              Cerrar ciclo y comenzar mi programa <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

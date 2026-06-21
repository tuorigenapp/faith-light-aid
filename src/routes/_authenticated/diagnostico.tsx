import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/diagnostico")({
  head: () => ({ meta: [{ title: "Diagnóstico Espiritual — Reconectando" }] }),
  component: Diagnostico,
});

const QUESTIONS = [
  { key: "emocional", label: "¿Cómo describes tu estado emocional ahora?", min: "Muy difícil", max: "En paz" },
  { key: "espiritual", label: "¿Qué tan conectado(a) te sientes con Dios?", min: "Muy lejos", max: "Muy cerca" },
  { key: "familia", label: "¿Cómo están tus relaciones familiares?", min: "Quebradas", max: "Sanas" },
  { key: "autoestima", label: "¿Cómo está tu autoestima?", min: "Muy baja", max: "Saludable" },
  { key: "ansiedad", label: "¿Qué nivel de ansiedad o miedo experimentas?", min: "Constante", max: "Casi nunca" },
  { key: "fe", label: "¿Qué tan fuerte sientes tu fe?", min: "Casi nula", max: "Firme" },
  { key: "habitos", label: "¿Tus hábitos diarios te edifican?", min: "Me dañan", max: "Me edifican" },
  { key: "proposito", label: "¿Sientes que tienes propósito de vida?", min: "Sin rumbo", max: "Claro" },
];

function Diagnostico() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [context, setContext] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const total = QUESTIONS.length;
  const current = QUESTIONS[step];
  const value = answers[current?.key] ?? 5;

  function setVal(v: number) { setAnswers(prev => ({ ...prev, [current.key]: v })); }

  async function submit() {
    if (!user) return;
    setSubmitting(true);
    const scores = answers;
    const avg = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
    const level = avg < 4 ? "En proceso de sanidad" : avg < 7 ? "En crecimiento" : "Caminando firme";

    const lows = QUESTIONS.filter(q => (scores[q.key] ?? 5) < 5).map(q => q.key);
    const highs = QUESTIONS.filter(q => (scores[q.key] ?? 5) >= 7).map(q => q.key);

    const recommended = avg < 4 ? "basico" : avg < 7 ? "avanzado" : "anual";

    const summary = `Tu diagnóstico inicial muestra un nivel "${level}". ${lows.length ? `Áreas a fortalecer: ${lows.join(", ")}.` : ""} ${highs.length ? `Fortalezas: ${highs.join(", ")}.` : ""} Te recomendamos comenzar por la Etapa 1 y dialogar con el Consultor IA.`;

    const { error } = await supabase.from("diagnostic_results").insert({
      user_id: user.id,
      answers: { scores, context },
      scores,
      level,
      strengths: highs,
      weaknesses: lows,
      risks: lows.includes("ansiedad") ? ["ansiedad elevada"] : [],
      recommended_plan: recommended,
      ai_summary: summary,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Diagnóstico completado");
    navigate({ to: "/etapas" });
  }

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl">Diagnóstico Espiritual Inicial</h1>
      <p className="text-muted-foreground mt-2 text-sm">Responde con honestidad. Esto nos ayudará a personalizar tu camino.</p>

      <Progress value={((step + 1) / (total + 1)) * 100} className="mt-6" />
      <div className="text-xs text-muted-foreground mt-2">Pregunta {Math.min(step + 1, total + 1)} de {total + 1}</div>

      <Card className="mt-6 p-8">
        {step < total ? (
          <>
            <h2 className="font-display text-xl">{current.label}</h2>
            <div className="mt-8">
              <Slider value={[value]} min={1} max={10} step={1} onValueChange={(v) => setVal(v[0])} />
              <div className="flex justify-between text-xs text-muted-foreground mt-3">
                <span>{current.min}</span>
                <span className="text-gold font-medium">{value} / 10</span>
                <span>{current.max}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display text-xl">¿Hay algo más que quieras compartir?</h2>
            <p className="text-sm text-muted-foreground mt-1">Opcional. Lo que escribas es privado.</p>
            <Textarea value={context} onChange={e => setContext(e.target.value)} className="mt-4 min-h-32" placeholder="Ej. Estoy atravesando un momento difícil con..." />
          </>
        )}
        <div className="flex justify-between mt-8">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(s => s - 1)}>Atrás</Button>
          {step < total ? (
            <Button onClick={() => setStep(s => s + 1)} className="bg-primary">Continuar</Button>
          ) : (
            <Button onClick={submit} disabled={submitting} className="bg-gold text-gold-foreground hover:bg-gold/90">
              {submitting ? "Procesando..." : "Ver mi plan"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

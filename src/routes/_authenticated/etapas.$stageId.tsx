import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Check, CheckCircle2, Lightbulb, ListChecks, Lock, MessageCircle, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import heroImg from "@/assets/spiritual-hero.jpg";
import dailyImg from "@/assets/daily-devotional.jpg";
import stageImg from "@/assets/stage-journey.jpg";
import exerciseImg from "@/assets/prayer-exercise.jpg";

export const Route = createFileRoute("/_authenticated/etapas/$stageId")({
  head: () => ({ meta: [{ title: "Detalle de etapa — Reconectando" }] }),
  component: StageDetail,
});

const IMAGE_MAP: Record<string, string> = { hero: heroImg, daily: dailyImg, journey: stageImg, exercise: exerciseImg };

function StageDetail() {
  const { stageId } = useParams({ from: "/_authenticated/etapas/$stageId" });
  const { user } = useAuth();
  const qc = useQueryClient();
  const id = Number(stageId);
  const [notes, setNotes] = useState("");
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);

  const { data } = useQuery({
    queryKey: ["stage", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [stage, progress, allProgress, diagnostic, stages] = await Promise.all([
        supabase.from("stages").select("*").eq("id", id).maybeSingle(),
        supabase.from("stage_progress").select("*").eq("user_id", user!.id).eq("stage_id", id).maybeSingle(),
        supabase.from("stage_progress").select("stage_id,status").eq("user_id", user!.id),
        supabase.from("diagnostic_results").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("stages").select("id,focus_area").order("id"),
      ]);
      return { stage: stage.data, progress: progress.data, allProgress: allProgress.data ?? [], diagnostic: diagnostic.data, stages: stages.data ?? [] };
    },
  });

  useEffect(() => {
    if (data?.progress) {
      setNotes(data.progress.notes ?? "");
      setCompletedTasks((data.progress.completed_tasks as number[]) ?? []);
    }
  }, [data?.progress]);

  if (!data?.stage) return <div className="p-10">Cargando...</div>;
  const stage = data.stage;
  const tasks = ((stage.tasks as string[]) ?? []).filter(Boolean);
  const solutionSteps = ((stage.solution_steps as string[]) ?? []).filter(Boolean);
  const image = IMAGE_MAP[stage.image_key ?? "journey"] ?? stageImg;
  const orderedStageIds = orderStageIds(data.stages ?? [], getRecommendedFocuses(data.diagnostic));
  const currentIndex = orderedStageIds.indexOf(id);
  const previousId = orderedStageIds[currentIndex - 1];
  const previousCompleted = currentIndex <= 0 || (data.allProgress ?? []).some((p: any) => p.stage_id === previousId && p.status === "completed");
  const currentCompleted = data.progress?.status === "completed";

  function toggle(i: number) {
    setCompletedTasks(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  }

  async function save(complete = false) {
    if (!user) return;
    if (complete && !allDone) return toast.error("Completa las tareas antes de marcar la etapa como finalizada.");
    const { error } = await supabase.from("stage_progress").upsert({
      user_id: user.id,
      stage_id: id,
      notes,
      completed_tasks: completedTasks,
      status: complete ? "completed" : "in_progress",
      completed_at: complete ? new Date().toISOString() : null,
    }, { onConflict: "user_id,stage_id" });
    if (error) return toast.error(error.message);
    await supabase.from("daily_activity").upsert({
      user_id: user.id,
      activity_date: new Date().toISOString().slice(0, 10),
      activity_type: complete ? "stage_completed" : "stage_progress",
      reference_id: String(id),
      metadata: { title: stage.title },
    }, { onConflict: "user_id,activity_date,activity_type,reference_id" });
    toast.success(complete ? "¡Etapa completada y guardada!" : "Progreso guardado");
    qc.invalidateQueries({ queryKey: ["stage"] });
    qc.invalidateQueries({ queryKey: ["etapas"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  const allDone = tasks.length === 0 || completedTasks.length === tasks.length;

  if (!previousCompleted && !currentCompleted) {
    return (
      <div className="px-4 py-6 md:p-10 max-w-3xl mx-auto mobile-safe-bottom lg:pb-10">
        <Link to="/etapas" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="w-4 h-4" />Volver</Link>
        <Card className="p-8 text-center rounded-[2rem] shadow-soft">
          <div className="w-16 h-16 rounded-3xl bg-muted text-muted-foreground grid place-items-center mx-auto"><Lock className="w-7 h-7" /></div>
          <h1 className="font-display font-bold text-2xl mt-4">Esta etapa aún está bloqueada</h1>
          <p className="text-muted-foreground mt-2">Termina la etapa anterior para continuar tu proceso en orden.</p>
          <Link to="/etapas"><Button className="mt-6 rounded-full bg-primary">Ver etapas disponibles</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:p-10 max-w-5xl mx-auto mobile-safe-bottom lg:pb-10">
      <Link to="/etapas" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="w-4 h-4" />Volver a etapas</Link>

      <section className="relative overflow-hidden rounded-[2rem] text-primary-foreground shadow-glow min-h-[330px] flex items-end p-6 md:p-8">
        <img src={image} alt={stage.title} width={1024} height={1024} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/35 to-transparent" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-background/15 border border-primary-foreground/20 backdrop-blur-xl px-3 py-1 text-xs font-bold text-gold"><Sparkles className="w-3.5 h-3.5" /> Etapa {stage.id} · {stage.focus_area ?? "restauración"}</div>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl mt-4">{stage.title}</h1>
          <p className="text-primary-foreground/82 mt-2 max-w-2xl">{stage.subtitle}</p>
          <p className="scripture text-gold mt-4 max-w-2xl">“{stage.scripture}” — {stage.scripture_reference}</p>
        </div>
      </section>

      <div className="mt-5 grid lg:grid-cols-[1.05fr_0.95fr] gap-5">
        <div className="space-y-5">
          <Card className="p-6 rounded-[1.7rem] shadow-soft">
            <div className="flex items-center gap-2 text-primary font-bold"><Lightbulb className="w-5 h-5" /> Explicación y consejo</div>
            <h2 className="font-display font-bold text-2xl mt-3">¿Qué trabaja esta etapa?</h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">{stage.deep_explanation || stage.reflection}</p>
            {stage.recommended_action && <div className="mt-5 rounded-3xl bg-secondary/70 p-4 text-sm"><span className="font-bold text-foreground">Consejo práctico:</span> {stage.recommended_action}</div>}
          </Card>

          <Card className="p-6 rounded-[1.7rem] shadow-soft">
            <div className="flex items-center gap-2 text-primary font-bold"><ListChecks className="w-5 h-5" /> Solución paso a paso</div>
            <div className="mt-5 space-y-3">
              {solutionSteps.map((s, i) => (
                <div key={i} className="flex gap-3">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-bold">{i + 1}</span>
                  <p className="text-sm leading-relaxed pt-1">{s}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 rounded-[1.7rem] bg-gold/8 border-gold/30 shadow-soft">
            <h2 className="font-display font-bold text-xl">Oración guiada</h2>
            <p className="scripture mt-3 leading-relaxed">{stage.prayer}</p>
          </Card>
        </div>

        <div className="space-y-5">
          {tasks.length > 0 && (
            <Card className="p-6 rounded-[1.7rem] shadow-soft">
              <h2 className="font-display font-bold text-xl">Tareas espirituales</h2>
              <p className="text-sm text-muted-foreground mt-1">Marca cada acción. La app la guardará para recordar lo realizado.</p>
              <div className="mt-5 space-y-3">
                {tasks.map((t, i) => (
                  <label key={i} className="flex items-start gap-3 cursor-pointer rounded-2xl border border-border p-3 hover:bg-muted/50">
                    <Checkbox checked={completedTasks.includes(i)} onCheckedChange={() => toggle(i)} className="mt-1" />
                    <span className={completedTasks.includes(i) ? "line-through text-muted-foreground" : "text-sm leading-relaxed"}>{t}</span>
                  </label>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6 rounded-[1.7rem] shadow-soft">
            <h2 className="font-display font-bold text-xl">Notas personales</h2>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-3 min-h-36 rounded-2xl" placeholder="Lo que Dios te muestra, decisiones, emociones o próximos pasos..." />
          </Card>

          <div className="grid gap-3">
            <Button variant="outline" onClick={() => save(false)} className="rounded-full h-12">Guardar progreso</Button>
            <Button onClick={() => save(true)} disabled={!allDone} className="rounded-full h-12 bg-primary">
              {currentCompleted ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {currentCompleted ? "Etapa completada" : "Marcar como completada"}
            </Button>
            <Link to="/chat" className="block"><Button variant="secondary" className="rounded-full h-12 w-full"><MessageCircle className="w-4 h-4 mr-2" /> Hablar con el consultor IA</Button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const KEY_TO_FOCUS: Record<string, string> = {
  familia: "restauración familiar",
  autoestima: "identidad",
  ansiedad: "sanidad emocional",
  espiritual: "reconexión",
  fe: "reconexión",
  habitos: "disciplina espiritual",
  proposito: "propósito",
  emocional: "sanidad emocional",
};

function getRecommendedFocuses(diagnostic: any): string[] {
  const weaknesses: string[] = diagnostic?.weaknesses ?? [];
  const focuses = weaknesses.map((k) => KEY_TO_FOCUS[k]).filter(Boolean);
  return Array.from(new Set(focuses.length ? focuses : ["reconexión", "sanidad emocional", "identidad"])).slice(0, 4);
}

function orderStageIds(stages: any[], focuses: string[]) {
  return [...stages].sort((a, b) => {
    const af = focuses.findIndex((f) => (a.focus_area ?? "").toLowerCase().includes(f));
    const bf = focuses.findIndex((f) => (b.focus_area ?? "").toLowerCase().includes(f));
    const ar = af === -1 ? 99 : af;
    const br = bf === -1 ? 99 : bf;
    return ar - br || a.id - b.id;
  }).map((s) => s.id);
}
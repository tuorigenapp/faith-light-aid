import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/etapas/$stageId")({
  head: () => ({ meta: [{ title: "Etapa — Reconectando" }] }),
  component: StageDetail,
});

function StageDetail() {
  const { stageId } = useParams({ from: "/_authenticated/etapas/$stageId" });
  const { user } = useAuth();
  const qc = useQueryClient();
  const id = Number(stageId);
  const [notes, setNotes] = useState("");
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);

  const { data } = useQuery({
    queryKey: ["stage", id, user?.id],
    queryFn: async () => {
      const [stage, progress] = await Promise.all([
        supabase.from("stages").select("*").eq("id", id).maybeSingle(),
        user ? supabase.from("stage_progress").select("*").eq("user_id", user.id).eq("stage_id", id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      return { stage: stage.data, progress: progress.data };
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
  const tasks = (stage.tasks as string[]) ?? [];

  function toggle(i: number) {
    setCompletedTasks(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  }

  async function save(complete = false) {
    if (!user) return;
    const { error } = await supabase.from("stage_progress").upsert({
      user_id: user.id, stage_id: id,
      notes, completed_tasks: completedTasks,
      status: complete ? "completed" : "in_progress",
      completed_at: complete ? new Date().toISOString() : null,
    }, { onConflict: "user_id,stage_id" });
    if (error) return toast.error(error.message);
    toast.success(complete ? "¡Etapa completada!" : "Progreso guardado");
    qc.invalidateQueries({ queryKey: ["stage"] });
    qc.invalidateQueries({ queryKey: ["etapas"] });
  }

  const allDone = tasks.length > 0 && completedTasks.length === tasks.length;

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <Link to="/etapas" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="w-4 h-4" />Volver a etapas</Link>

      <div className="rounded-3xl bg-divine text-white p-8">
        <div className="text-[10px] uppercase tracking-widest text-gold">Etapa {stage.id}</div>
        <h1 className="font-display text-3xl mt-2">{stage.title}</h1>
        <p className="text-white/75 mt-2">{stage.subtitle}</p>
        <p className="scripture text-gold mt-4">"{stage.scripture}" — {stage.scripture_reference}</p>
      </div>

      <Card className="p-7 mt-6">
        <h2 className="font-display text-xl">Reflexión</h2>
        <p className="text-muted-foreground mt-3 leading-relaxed">{stage.reflection}</p>
      </Card>

      <Card className="p-7 mt-4 bg-gold/5 border-gold/30">
        <h2 className="font-display text-xl">Oración guiada</h2>
        <p className="scripture mt-3 text-foreground/90 leading-relaxed">{stage.prayer}</p>
      </Card>

      {tasks.length > 0 && (
        <Card className="p-7 mt-4">
          <h2 className="font-display text-xl">Tareas espirituales</h2>
          <div className="mt-4 space-y-3">
            {tasks.map((t, i) => (
              <label key={i} className="flex items-start gap-3 cursor-pointer">
                <Checkbox checked={completedTasks.includes(i)} onCheckedChange={() => toggle(i)} className="mt-1" />
                <span className={completedTasks.includes(i) ? "line-through text-muted-foreground" : ""}>{t}</span>
              </label>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-7 mt-4">
        <h2 className="font-display text-xl">Notas personales</h2>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-3 min-h-32" placeholder="Lo que el Espíritu Santo te habla en esta etapa..." />
      </Card>

      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={() => save(false)}>Guardar progreso</Button>
        <Button onClick={() => save(true)} disabled={!allDone} className="bg-gold text-gold-foreground hover:bg-gold/90">
          <Check className="w-4 h-4 mr-2" />Marcar etapa completada
        </Button>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, CheckCircle2, Clock, Flame, History, Pause, Play, X } from "lucide-react";
import { toast } from "sonner";
import exerciseImg from "@/assets/prayer-exercise.jpg";
import dailyImg from "@/assets/daily-devotional.jpg";
import stageImg from "@/assets/stage-journey.jpg";
import heroImg from "@/assets/spiritual-hero.jpg";
import { cn } from "@/lib/utils";
import { WordSearch } from "@/components/WordSearch";
import { StageQuiz } from "@/components/StageQuiz";
import { getStageContent } from "@/lib/stage-content";

const CAT_TO_FOCUS: Record<string, string> = {
  perdon: "restauración familiar",
  familiar: "restauración familiar",
  sanidad: "sanidad emocional",
  ansiedad: "sanidad emocional",
  pensamientos: "sanidad emocional",
  identidad: "identidad",
  fe: "reconexión",
  gratitud: "reconexión",
  biblia: "reconexión",
  proposito: "propósito",
};

export const Route = createFileRoute("/_authenticated/ejercicios")({
  head: () => ({ meta: [{ title: "Ejercicios diarios — Reconectando" }] }),
  component: Ejercicios,
});

const CATS = ["hoy", "realizados", "todos", "perdon", "gratitud", "sanidad", "identidad", "fe", "familiar", "ansiedad", "proposito", "pensamientos", "biblia"];
const IMAGE_MAP: Record<string, string> = { exercise: exerciseImg, daily: dailyImg, journey: stageImg, hero: heroImg };

function todayIndex() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return ((Math.floor((now.getTime() - start.getTime()) / 86400000) - 1) % 7) + 1;
}

function Ejercicios() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [cat, setCat] = useState("hoy");
  const [active, setActive] = useState<any | null>(null);
  const [notes, setNotes] = useState("");

  const { data } = useQuery({
    queryKey: ["exercises", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [exercises, completions] = await Promise.all([
        supabase.from("exercises").select("*").order("sort_order"),
        supabase.from("exercise_completions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      ]);
      return { exercises: exercises.data ?? [], completions: completions.data ?? [] };
    },
  });

  const completionMap = new Map((data?.completions ?? []).map((c: any) => [c.exercise_id, c]));
  const filtered = useMemo(() => {
    const all = data?.exercises ?? [];
    if (cat === "hoy") return all.filter((e: any) => e.day_index === todayIndex());
    if (cat === "realizados") return all.filter((e: any) => completionMap.has(e.id));
    if (cat === "todos") return all;
    return all.filter((e: any) => e.category === cat);
  }, [cat, data?.exercises, data?.completions]);

  async function complete(activeNotes: string) {
    if (!user || !active) return;
    const already = completionMap.get(active.id);
    const payload = { user_id: user.id, exercise_id: active.id, notes: activeNotes || null };
    const { error } = already
      ? await supabase.from("exercise_completions").update({ notes: activeNotes || already.notes || null }).eq("id", already.id)
      : await supabase.from("exercise_completions").insert(payload);
    if (error) return toast.error(error.message);
    await supabase.from("daily_activity").upsert({
      user_id: user.id,
      activity_date: new Date().toISOString().slice(0, 10),
      activity_type: "exercise_completed",
      reference_id: active.id,
      metadata: { title: active.title },
    }, { onConflict: "user_id,activity_date,activity_type,reference_id" });
    toast.success("Ejercicio completado y guardado");
    setActive(null);
    setNotes("");
    qc.invalidateQueries({ queryKey: ["exercises"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  return (
    <div className="px-4 py-6 md:p-10 max-w-6xl mx-auto mobile-safe-bottom lg:pb-10">
      <section className="relative overflow-hidden rounded-[2rem] p-6 md:p-8 text-primary-foreground min-h-64 flex items-end shadow-glow">
        <img src={exerciseImg} alt="Ejercicios espirituales" width={1024} height={1024} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/35 to-transparent" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-background/15 border border-primary-foreground/20 backdrop-blur-xl px-3 py-1 text-xs font-bold text-gold"><CalendarDays className="w-3.5 h-3.5" /> Ejercicios que cambian por día</div>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl mt-4">Prácticas con temporizador</h1>
          <p className="mt-2 text-primary-foreground/82 max-w-2xl">Cada ejercicio completado queda guardado en tu historial para volver a verlo cuando quieras.</p>
        </div>
      </section>

      <Tabs value={cat} onValueChange={setCat} className="mt-6 overflow-x-auto pb-1">
        <TabsList className="inline-flex w-max h-12 rounded-full bg-muted p-1">
          {CATS.map(c => <TabsTrigger key={c} value={c} className="capitalize rounded-full px-4">{c}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((e: any) => {
          const done = completionMap.has(e.id);
          const image = IMAGE_MAP[e.image_key ?? "exercise"] ?? exerciseImg;
          return (
            <Card key={e.id} className={cn("overflow-hidden rounded-[1.7rem] shadow-soft hover:border-primary transition-colors cursor-pointer", done && "border-accent bg-accent/8")} onClick={() => { setActive(e); setNotes(completionMap.get(e.id)?.notes ?? ""); }}>
              <div className="relative h-40">
                <img src={image} alt={e.title} width={1024} height={1024} loading="lazy" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
                <div className="absolute top-3 left-3 rounded-full bg-background/85 px-3 py-1 text-xs font-bold capitalize">{e.category}</div>
                {done && <div className="absolute top-3 right-3 rounded-full bg-accent text-accent-foreground px-3 py-1 text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Hecho</div>}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display font-bold text-xl leading-tight">{e.title}</h3>
                  <div className="shrink-0 rounded-2xl bg-primary/10 text-primary px-2.5 py-1 text-xs font-bold">Día {e.day_index ?? "—"}</div>
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{e.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{e.duration_minutes ?? 5} min</span>
                  <span className="capitalize flex items-center gap-1.5"><Flame className="w-3.5 h-3.5" />{e.difficulty}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && <Card className="mt-6 p-8 text-center rounded-[1.7rem]"><History className="w-8 h-8 mx-auto text-muted-foreground" /><p className="mt-3 text-muted-foreground">Aún no hay ejercicios en esta sección.</p></Card>}

      {active && (
        <ExerciseModal active={active} completed={completionMap.has(active.id)} notes={notes} setNotes={setNotes} onClose={() => setActive(null)} onComplete={complete} />
      )}
    </div>
  );
}

function ExerciseModal({ active, completed, notes, setNotes, onClose, onComplete }: any) {
  const duration = (active.duration_minutes ?? 5) * 60;
  const [seconds, setSeconds] = useState(duration);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setSeconds(duration);
    setRunning(false);
  }, [active.id, duration]);

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (seconds === 0 && running) {
      setRunning(false);
      toast.success("Temporizador finalizado");
    }
  }, [seconds, running]);

  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  const steps = ((active.steps as string[]) ?? []).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm grid place-items-end sm:place-items-center p-0 sm:p-4" onClick={onClose}>
      <Card className="max-w-2xl w-full max-h-[92vh] overflow-y-auto rounded-t-[2rem] sm:rounded-[2rem] shadow-glow" onClick={e => e.stopPropagation()}>
        <div className="relative h-44">
          <img src={IMAGE_MAP[active.image_key ?? "exercise"] ?? exerciseImg} alt={active.title} className="h-full w-full object-cover rounded-t-[2rem]" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 to-transparent rounded-t-[2rem]" />
          <Button variant="secondary" size="icon" className="absolute top-3 right-3 rounded-full" onClick={onClose}><X className="w-4 h-4" /></Button>
          <div className="absolute bottom-4 left-5 right-5 text-primary-foreground">
            <div className="text-xs uppercase tracking-widest text-gold font-bold">{active.category}</div>
            <h2 className="font-display font-extrabold text-2xl mt-1">{active.title}</h2>
          </div>
        </div>
        <div className="p-5 sm:p-7">
          <p className="text-muted-foreground text-sm leading-relaxed">{active.description}</p>
          {active.scripture && <p className="scripture mt-3 text-sm">“{active.scripture}”</p>}

          <div className="mt-6 rounded-[1.7rem] bg-secondary/70 p-5 text-center">
            <div className="font-display font-extrabold text-5xl tabular-nums">{mins}:{secs}</div>
            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={() => setRunning(!running)} className="rounded-full bg-primary min-w-32">{running ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}{running ? "Pausar" : "Iniciar"}</Button>
              <Button variant="outline" onClick={() => { setSeconds(duration); setRunning(false); }} className="rounded-full">Reiniciar</Button>
            </div>
          </div>

          <ol className="mt-6 space-y-3 text-sm">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3 rounded-2xl border border-border p-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-bold">{i + 1}</span>
                <span className="leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-5 rounded-2xl min-h-24" placeholder="Notas de lo que sentiste, oraste o recibiste..." />

          {/* Bloque interactivo: quiz + sopa */}
          <div className="mt-6 space-y-4">
            <ExerciseInteractive exerciseId={active.id} category={active.category} />
          </div>

          <div className="flex gap-2 mt-5">
            <Button variant="ghost" onClick={onClose} className="flex-1 rounded-full">Cerrar</Button>
            <Button onClick={() => onComplete(notes)} className="flex-1 rounded-full bg-primary"><Check className="w-4 h-4 mr-2" />{completed ? "Actualizar" : "Completar"}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ExerciseInteractive({ exerciseId, category }: { exerciseId: string; category: string }) {
  const focus = CAT_TO_FOCUS[category] ?? "reconexión";
  const seed = exerciseId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const content = getStageContent(focus, seed);
  return (
    <>
      <div className="rounded-2xl bg-brand-soft p-4">
        <div className="text-[11px] uppercase tracking-widest font-bold text-primary">Sabías que…</div>
        <p className="text-sm mt-1 leading-relaxed">{content.tips[0].body}</p>
      </div>
      <StageQuiz items={content.quiz.slice(0, 2)} storageKey={`ex-${exerciseId}`} gemsPerCorrect={10} />
      <WordSearch words={content.words.slice(0, 6)} storageKey={`ex-${exerciseId}`} gemsReward={25} />
    </>
  );
}
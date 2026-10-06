import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Check, Lock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { appDayKey, APP_DAY_RESET_LABEL } from "@/lib/app-day";
import { useCustomCaminos } from "@/hooks/use-content-overrides";
import { WordSearch } from "@/components/WordSearch";
import { StageQuiz } from "@/components/StageQuiz";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/camino-nuevo/$slug")({
  head: () => ({
    meta: [
      { title: "Camino ORÍGEN — Nuevo camino guiado" },
      { name: "description", content: "Etapas, lecciones, juegos y afirmaciones creados para tu proceso de sanación." },
      { property: "og:title", content: "Camino ORÍGEN — Nuevo camino guiado" },
      { property: "og:description", content: "Un camino de sanación con lecciones diarias y juegos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CaminoNuevo,
});

function CaminoNuevo() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useCustomCaminos();
  const camino = data?.find((c) => c.slug === slug);
  const [stage, setStage] = useState(0);
  const [lesson, setLesson] = useState(0);
  const qc = useQueryClient();
  const progress = useQuery({
    queryKey: ["camino-nuevo-progress", slug],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("daily_activity").select("reference_id, activity_date")
        .eq("user_id", u.user!.id).eq("activity_type", "camino_nuevo_lesson").like("reference_id", `${slug}:%`);
      return data ?? [];
    },
  });
  const doneKeys = new Set((progress.data ?? []).map((r) => r.reference_id));
  const doneToday = (progress.data ?? []).some((r) => r.activity_date === appDayKey());
  const flat = (camino?.content.stages ?? []).flatMap((s, si) => (s.lessons ?? []).map((_, li) => `${si}:${li}`));
  const nextIdx = flat.findIndex((k) => !doneKeys.has(`${slug}:${k}`));
  const stateOf = (si: number, li: number): "done" | "open" | "locked" => {
    const k = `${si}:${li}`;
    if (doneKeys.has(`${slug}:${k}`)) return "done";
    return flat[nextIdx] === k && !doneToday ? "open" : "locked";
  };
  useEffect(() => {
    if (!progress.data || nextIdx < 0) return;
    const [si, li] = flat[nextIdx].split(":").map(Number);
    setStage(si); setLesson(li);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.data]);
  async function finishLesson() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("daily_activity").insert({
      user_id: u.user.id, activity_type: "camino_nuevo_lesson", activity_date: appDayKey(), reference_id: `${slug}:${stage}:${lesson}`,
    });
    qc.invalidateQueries({ queryKey: ["camino-nuevo-progress", slug] });
  }

  if (isLoading) {
    return <div className="mx-auto max-w-lg px-4 pt-4"><div className="h-48 animate-pulse rounded-[16px] bg-muted" /></div>;
  }
  if (!camino) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-10 text-center">
        <h1 className="font-display text-[22px] font-bold">Este camino aún no está disponible</h1>
        <Link to="/categorias" className="mt-4 inline-flex min-h-12 items-center rounded-[12px] bg-primary px-5 font-semibold text-primary-foreground">Ver otros caminos</Link>
      </div>
    );
  }
  const stages = camino.content.stages ?? [];
  const st = stateOf(stage, lesson);
  const current = st === "locked" ? undefined : stages[stage]?.lessons?.[lesson];

  return (
    <div className="mx-auto max-w-lg px-4 pb-16 pt-3 lg:max-w-[900px]">
      <Link to="/categorias" className="inline-flex min-h-11 items-center gap-1 text-[14px] font-semibold text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Categorías
      </Link>
      <header className="overflow-hidden rounded-[16px] border border-border bg-card shadow-soft">
        {camino.cover_url && <img src={camino.cover_url} alt={camino.title} className="h-44 w-full object-cover" />}
        <div className="p-5">
          <h1 className="font-display text-[26px] font-extrabold leading-tight">{camino.title}</h1>
          {camino.subtitle && <p className="mt-1 text-[14px] text-muted-foreground">{camino.subtitle}</p>}
        </div>
      </header>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {stages.map((s, i) => (
          <button
            key={i}
            onClick={() => { setStage(i); setLesson(0); }}
            className={cn("min-h-10 shrink-0 rounded-full border px-4 text-[13px] font-semibold",
              i === stage ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground")}
          >
            Etapa {i + 1}
          </button>
        ))}
      </div>
      <h2 className="mt-3 font-display text-[19px] font-bold">{stages[stage]?.title}</h2>
      <div className="mt-2 grid gap-2">
        {(stages[stage]?.lessons ?? []).map((l, i) => (
          <button key={i} onClick={() => setLesson(i)}
            className={cn("flex min-h-12 items-center gap-3 rounded-[12px] border bg-card px-3 text-left text-[14px] font-semibold",
              i === lesson ? "border-2 border-primary" : "border-border", stateOf(stage, i) === "locked" && "opacity-60")}>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
              {stateOf(stage, i) === "done" ? <Check className="h-4 w-4" /> : stateOf(stage, i) === "locked" ? <Lock className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
            </span>
            {/^(Día|Cierre)/.test(l.title) ? l.title : `Día ${i + 1}: ${l.title}`}
          </button>
        ))}
      </div>

      {st === "locked" && (
        <div className="mt-5 flex items-center gap-3 rounded-[16px] border border-border bg-card p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-primary/10 text-primary"><Lock className="h-5 w-5" /></span>
          <p className="text-[14px] text-muted-foreground">{doneToday ? `Ya hiciste tu lección de hoy. La siguiente se abre a las ${APP_DAY_RESET_LABEL}.` : "Completa primero la lección anterior. Se abre una lección por día."}</p>
        </div>
      )}
      {current && (
        <section key={`${stage}-${lesson}`} className="mt-5 space-y-4">
          <div className="rounded-[16px] border border-border bg-card p-5 shadow-soft">
            <p className="whitespace-pre-line text-[15px] leading-relaxed">{current.lesson}</p>
          </div>
          <div className="rounded-[16px] bg-primary/10 p-5">
            <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-primary"><Sparkles className="h-4 w-4" /> Afirmación</p>
            <p className="mt-1 font-display text-[18px] font-bold">{current.affirmation}</p>
          </div>
          {current.tasks?.length > 0 && (
            <ul className="space-y-2 rounded-[16px] border border-border bg-card p-5">
              {current.tasks.map((t, i) => (
                <li key={i} className="flex gap-2 text-[14px]">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Check className="h-3.5 w-3.5" /></span>{t}
                </li>
              ))}
            </ul>
          )}
          {current.search_words?.length > 0 && (
            <WordSearch words={current.search_words} storageKey={`cn-${camino.slug}-${stage}-${lesson}`} gemsReward={5} />
          )}
          {current.quiz?.length > 0 && (
            <StageQuiz
              storageKey={`cnq-${camino.slug}-${stage}-${lesson}`}
              gemsPerCorrect={2}
              items={current.quiz.map((q) => ({ q: q.question, options: q.options, correct: q.correctIndex, tip: "" }))}
            />
          )}
          {st === "open" ? (
            <button onClick={() => void finishLesson()} className="min-h-14 w-full rounded-[12px] bg-primary text-[16px] font-semibold text-primary-foreground shadow-soft">Terminé la lección de hoy</button>
          ) : (
            <p className="flex items-center justify-center gap-2 text-[14px] font-semibold text-primary"><Check className="h-4 w-4" /> Lección completada</p>
          )}
        </section>
      )}
    </div>
  );
}

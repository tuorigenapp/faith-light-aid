import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, BookOpen, Check, Sparkles } from "lucide-react";
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
  const current = stages[stage]?.lessons?.[lesson];

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
              i === lesson ? "border-2 border-primary" : "border-border")}>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary"><BookOpen className="h-4 w-4" /></span>
            {l.title}
          </button>
        ))}
      </div>

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
        </section>
      )}
    </div>
  );
}

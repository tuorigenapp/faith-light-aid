import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, Medal, Puzzle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { quizRound } from "@/lib/quiz-origen";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz Bíblico Diario — ORÍGEN" },
      { name: "description", content: "Cinco preguntas rápidas de la Biblia para mantener tu fe activa cada día." },
      { property: "og:title", content: "Quiz Bíblico Diario — ORÍGEN" },
      { property: "og:description", content: "Responde 5 preguntas y sube de nivel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuizPage,
});

const today = () => new Date().toISOString().slice(0, 10);
const LEVELS_TO_PRIZE = 3;

function QuizPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: done, isLoading } = useQuery({
    queryKey: ["quiz-rounds", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase.from("quiz_answers").select("id", { count: "exact", head: true }).eq("user_id", user!.id).eq("source", "app");
      return Math.floor((count ?? 0) / 5);
    },
  });
  const [extra, setExtra] = useState(0);
  const level = (done ?? 0) + 1 + extra;
  const round = useMemo(() => quizRound(today(), level), [level]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const finished = results.length === 5;

  async function choose(k: number) {
    if (picked !== null || !user) return;
    const q = round[i]!;
    const ok = k === q.answer;
    setPicked(k);
    await supabase.from("quiz_answers").insert({ user_id: user.id, level, question_id: q.id, answer: q.options[k]!, correct: ok, source: "app" });
    setTimeout(() => {
      setResults((r) => [...r, ok]);
      setPicked(null);
      setI((n) => n + 1);
    }, 1100);
  }

  function nextLevel() {
    setExtra((e) => e + 1);
    setI(0);
    setResults([]);
    qc.invalidateQueries({ queryKey: ["quiz-rounds", user?.id] });
  }

  if (isLoading) return <div className="mx-auto max-w-md p-4"><div className="h-80 animate-pulse rounded-[16px] bg-muted" /></div>;

  if (finished) {
    const score = results.filter(Boolean).length;
    const good = score >= 3;
    const toPrize = LEVELS_TO_PRIZE - ((level - 1) % LEVELS_TO_PRIZE) - 1;
    const r = 70, c = 2 * Math.PI * r;
    return (
      <main className="mx-auto min-h-dvh max-w-md px-4 pb-10 pt-4">
        <Header />
        <div className="relative mx-auto mt-8 h-52 w-52">
          <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
            <circle cx="80" cy="80" r={r} fill="none" strokeWidth="18" className="stroke-muted" />
            <circle cx="80" cy="80" r={r} fill="none" strokeWidth="18" strokeLinecap="round" className={good ? "stroke-cta-green" : "stroke-primary/50"} strokeDasharray={c} strokeDashoffset={c - (c * score) / 5} style={{ transition: "stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)" }} />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div><p className={cn("font-display text-[44px] font-extrabold leading-none", good && "text-cta-green dark:text-success")}>{score}/5</p><p className="text-[15px] font-semibold text-muted-foreground">Nivel {level}</p></div>
          </div>
        </div>
        <h1 className="mt-6 text-center font-display text-[28px] font-extrabold">{good ? "¡Mira cómo avanzas!" : "¡Ronda difícil!"}</h1>
        <p className="mt-1 text-center text-[16px] text-muted-foreground">{good ? "Otra victoria. Un motivo más de gratitud." : "Hasta los mejores tropiezan a veces. Inténtalo otra vez."}</p>
        <div className="mt-8 flex items-center gap-4 rounded-[16px] border border-border/60 bg-card p-4">
          <div className="flex-1">
            <p className="font-display text-[16px] font-bold">{toPrize === 0 ? "¡Premio desbloqueado en la ruleta!" : `Solo faltan ${toPrize} niveles`}</p>
            <div className="mt-2 h-3 rounded-full bg-muted"><div className="h-3 rounded-full bg-primary transition-all" style={{ width: `${(((level - 1) % LEVELS_TO_PRIZE) + 1) / LEVELS_TO_PRIZE * 100}%` }} /></div>
          </div>
          <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary"><Puzzle className="h-7 w-7" /></span>
        </div>
        <button onClick={nextLevel} className="mt-6 grid h-14 w-full place-items-center rounded-[12px] bg-primary text-[17px] font-bold text-primary-foreground active:scale-[.97]">Siguiente nivel</button>
        <Link to="/dashboard" className="mt-2 grid h-12 place-items-center text-[14px] font-semibold text-muted-foreground">Volver al inicio</Link>
      </main>
    );
  }

  const q = round[i]!;
  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pb-10 pt-4">
      <Header progress={results} />
      <section className="relative mt-6 rounded-[16px] bg-card p-5 shadow-soft">
        <p className="font-display text-[20px] font-bold">Pregunta {i + 1}</p>
        <p className="mt-6 text-[18px] leading-snug">{q.q}</p>
        {picked !== null && picked === q.answer && (
          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-cta-green px-6 py-1.5 font-display text-[16px] font-extrabold tracking-wide text-cta-green-foreground shadow-lg" style={{ animation: "fade-in .3s ease-out both" }}>GLORIA</span>
        )}
      </section>
      <div className="mt-8 grid gap-3">
        {q.options.map((o, k) => {
          const state = picked === null ? "idle" : k === q.answer ? "right" : k === picked ? "wrong" : "dim";
          return (
            <button key={o} onClick={() => choose(k)} disabled={picked !== null} className={cn("flex min-h-14 items-center justify-between rounded-[16px] px-5 text-left text-[17px] font-medium shadow-soft transition active:scale-[.98]",
              state === "idle" && "bg-card", state === "right" && "bg-cta-green text-cta-green-foreground", state === "wrong" && "bg-destructive/15 text-destructive", state === "dim" && "bg-muted text-muted-foreground")}>
              {o}{state === "right" && <Check className="h-6 w-6" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
    </main>
  );
}

function Header({ progress }: { progress?: boolean[] }) {
  return (
    <div className="flex items-center gap-3">
      <Link to="/dashboard" aria-label="Volver" className="grid h-11 w-11 place-items-center rounded-full"><ChevronLeft className="h-6 w-6" /></Link>
      {progress ? (
        <div className="flex flex-1 items-center gap-2">
          <span className="text-[14px] font-bold text-cta-green dark:text-success">{progress.length}</span><span className="text-[14px] text-muted-foreground">/5</span>
          <div className="flex flex-1 gap-1">{Array.from({ length: 5 }).map((_, k) => <span key={k} className={cn("h-3 flex-1 rounded-full", k < progress.length ? (progress[k] ? "bg-cta-green" : "bg-destructive/70") : "bg-muted")} />)}</div>
        </div>
      ) : <h1 className="flex-1 text-center font-display text-[22px] font-bold">Quiz</h1>}
      <Medal className="h-7 w-7 text-primary" />
    </div>
  );
}

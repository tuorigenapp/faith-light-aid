import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Lock, ArrowRight, Compass, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import stageImg from "@/assets/stage-journey.jpg";
import dailyImg from "@/assets/daily-devotional.jpg";
import heroImg from "@/assets/spiritual-hero.jpg";
import exerciseImg from "@/assets/prayer-exercise.jpg";

export const Route = createFileRoute("/_authenticated/etapas")({
  head: () => ({ meta: [{ title: "Mis Etapas — Reconectando" }] }),
  component: Etapas,
});

const IMAGE_MAP: Record<string, string> = { journey: stageImg, daily: dailyImg, hero: heroImg, exercise: exerciseImg };
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

function Etapas() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isDetailRoute = /^\/etapas\/[^/]+$/.test(pathname);
  const { data } = useQuery({
    queryKey: ["etapas", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [stages, progress, intake] = await Promise.all([
        supabase.from("stages").select("*").order("id"),
        supabase.from("stage_progress").select("*").eq("user_id", user!.id),
        supabase.from("intake_sessions").select("status, primary_focus, ai_plan, ai_summary, genealogy, childhood").eq("user_id", user!.id).maybeSingle(),
      ]);
      return { stages: stages.data ?? [], progress: progress.data ?? [], intake: intake.data };
    },
  });

  const progressMap = new Map((data?.progress ?? []).map((p: any) => [p.stage_id, p]));
  const completedIds = new Set((data?.progress ?? []).filter((p: any) => p.status === "completed").map((p: any) => p.stage_id));
  const completedCount = completedIds.size;
  const recommendedFocuses = getRecommendedFocuses(data?.intake);
  const orderedStages = orderStages(data?.stages ?? [], recommendedFocuses);
  const aiPlan = (data?.intake?.ai_plan ?? {}) as { pattern_name?: string; recommended_categories?: string[] };

  if (isDetailRoute) return <Outlet />;

  if (data && data.intake?.status !== "completed") {
    return (
      <div className="px-4 py-6 md:p-10 max-w-5xl mx-auto mobile-safe-bottom lg:pb-10">
        <Card className="overflow-hidden rounded-[2rem] shadow-soft">
          <img src={stageImg} alt="Camino espiritual" className="h-64 w-full object-cover" />
          <div className="p-6 md:p-8 text-center">
            <div className="w-14 h-14 rounded-3xl bg-primary/10 text-primary grid place-items-center mx-auto"><AlertCircle className="w-6 h-6" /></div>
            <h1 className="font-display font-extrabold text-3xl mt-4">Primero completa tu onboarding</h1>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Ruth Esther usa tus respuestas iniciales para adaptar el Camino ORIGEN a tu historia real.</p>
            <Link to="/onboarding"><Button className="mt-6 rounded-full bg-primary">Completar onboarding</Button></Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:p-10 max-w-6xl mx-auto mobile-safe-bottom lg:pb-10">
      <section className="relative overflow-hidden rounded-[2rem] p-6 md:p-8 text-primary-foreground shadow-glow min-h-64 flex items-end">
        <img src={stageImg} alt="Ruta espiritual" width={1024} height={1024} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-background/15 border border-primary-foreground/20 backdrop-blur-xl px-3 py-1 text-xs font-bold text-gold"><Compass className="w-3.5 h-3.5" /> Plan según tu onboarding</div>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl mt-4">Mis etapas de restauración</h1>
          <p className="mt-2 text-primary-foreground/80">Avanza una etapa a la vez. Las completadas se guardan con check verde y la siguiente se desbloquea automáticamente.</p>
        </div>
      </section>

      <Card className="mt-5 p-5 rounded-[1.7rem] flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between shadow-soft">
        <div>
          <div className="text-xs uppercase tracking-wider text-primary font-extrabold">Resultado</div>
          <h2 className="font-display font-bold text-xl">{aiPlan.pattern_name ?? "Camino ORIGEN personalizado"}</h2>
          <p className="text-sm text-muted-foreground mt-1">Áreas recomendadas: {recommendedFocuses.join(" · ")}</p>
        </div>
        <div className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-foreground">{completedCount}/8 completadas</div>
      </Card>

      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        {orderedStages.map((s: any, i: number) => {
          const p = progressMap.get(s.id);
          const completed = p?.status === "completed";
          const unlocked = i === 0 || completed || completedIds.has(orderedStages[i - 1]?.id);
          const active = unlocked && !completed;
          const image = IMAGE_MAP[s.image_key ?? "journey"] ?? stageImg;
          const recommended = recommendedFocuses.some((f) => (s.focus_area ?? "").toLowerCase().includes(f));
          const content = (
            <Card className={cn("overflow-hidden rounded-[1.7rem] shadow-soft transition-all h-full", completed && "border-accent bg-accent/8", active && "border-primary", !unlocked && "opacity-65")}>
              <div className="relative h-40">
                <img src={image} alt={s.title} width={1024} height={1024} loading="lazy" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
                <div className="absolute top-3 left-3 rounded-full bg-background/85 backdrop-blur px-3 py-1 text-xs font-bold">Etapa {s.id}</div>
                {recommended && <div className="absolute top-3 right-3 rounded-full bg-gold text-gold-foreground px-3 py-1 text-xs font-bold flex items-center gap-1"><Sparkles className="w-3 h-3" /> Recomendada</div>}
                <div className={cn("absolute bottom-3 right-3 w-12 h-12 rounded-2xl grid place-items-center font-bold", completed ? "bg-accent text-accent-foreground" : unlocked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  {completed ? <Check className="w-6 h-6" /> : unlocked ? s.id : <Lock className="w-5 h-5" />}
                </div>
              </div>
              <div className="p-5">
                <div className="text-[11px] uppercase tracking-widest text-primary font-extrabold">{s.focus_area ?? "restauración"}</div>
                <h3 className="font-display font-bold text-xl mt-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{s.subtitle}</p>
                <p className="scripture text-xs text-muted-foreground/80 mt-3 line-clamp-2">“{s.scripture}” — {s.scripture_reference}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className={cn("text-xs font-bold", completed ? "text-accent-foreground" : active ? "text-primary" : "text-muted-foreground")}>{completed ? "Completada y guardada" : active ? "Disponible ahora" : "Bloqueada"}</span>
                  {unlocked && <ArrowRight className="w-4 h-4 text-primary" />}
                </div>
              </div>
            </Card>
          );
          return <Link key={s.id} to="/etapas/$stageId" params={{ stageId: String(s.id) }} className="block h-full">{content}</Link>;
        })}
      </div>
    </div>
  );
}

function getRecommendedFocuses(intake: any): string[] {
  const plan = intake?.ai_plan ?? {};
  const raw = [intake?.primary_focus, ...(plan.recommended_categories ?? [])].filter(Boolean).map((x: string) => x.toLowerCase());
  const focuses = raw.flatMap((k: string) => [KEY_TO_FOCUS[k], ...Object.entries(KEY_TO_FOCUS).filter(([key]) => k.includes(key)).map(([, value]) => value)]).filter(Boolean);
  return Array.from(new Set(focuses.length ? focuses : ["reconexión", "sanidad emocional", "identidad"])).slice(0, 4);
}

function orderStages(stages: any[], focuses: string[]) {
  return [...stages].sort((a, b) => {
    const af = focuses.findIndex((f) => (a.focus_area ?? "").toLowerCase().includes(f));
    const bf = focuses.findIndex((f) => (b.focus_area ?? "").toLowerCase().includes(f));
    const ar = af === -1 ? 99 : af;
    const br = bf === -1 ? 99 : bf;
    return ar - br || a.id - b.id;
  });
}
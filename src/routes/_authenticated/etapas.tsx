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
import paisaje from "@/assets/fondo-mistico.png.asset.json";
import mapaCamino from "@/assets/mapa-camino.png.asset.json";


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
    <div className="px-4 py-5 md:p-8 max-w-[1100px] mx-auto mobile-safe-bottom lg:pb-10">
      {/* HERO — mapa del camino */}
      <section className="relative overflow-hidden rounded-[16px] shadow-soft min-h-[240px] flex items-end">
        <img src={paisaje.url} alt="Camino de restauración" width={1024} height={1024} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1B1930]/90 via-[#1B1930]/35 to-transparent" />
        <div className="relative z-10 p-5 md:p-7 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 backdrop-blur px-3 py-1 text-[12px] font-bold">
            <Compass className="w-3.5 h-3.5" /> {completedCount}/8 etapas
          </div>
          <h1 className="font-display font-extrabold text-[28px] md:text-[36px] leading-tight mt-3">Tu camino de restauración</h1>
          <p className="text-[15px] text-white/85 mt-1 max-w-md">{aiPlan.pattern_name ?? "Plan personalizado según tu onboarding"}</p>
          <div className="mt-4 h-1.5 w-full max-w-xs rounded-full bg-white/25 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary via-accent-pink to-gold transition-all duration-700" style={{ width: `${Math.round((completedCount / 8) * 100)}%` }} />
          </div>
        </div>
      </section>

      <Card className="mt-4 p-4 rounded-[16px] grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 shadow-soft">
        <div className="min-w-0">
          <div className="text-[12px] uppercase tracking-widest text-primary font-bold">Áreas recomendadas</div>
          <p className="text-[14px] text-muted-foreground mt-1">{recommendedFocuses.join(" · ")}</p>
        </div>
        <div className="shrink-0 rounded-full bg-primary/10 px-3.5 py-1.5 text-[13px] font-bold text-primary">{completedCount}/8</div>
      </Card>

      {/* MAPA SERPENTEANTE */}
      <div className="relative mt-6">
        <div className="absolute left-1/2 top-0 bottom-0 w-[3px] -translate-x-1/2 bg-gradient-to-b from-primary/35 via-accent-pink/35 to-gold/35 rounded-full" />
        <div className="relative space-y-4">
          {orderedStages.map((s: any, i: number) => {
            const p = progressMap.get(s.id);
            const completed = p?.status === "completed";
            const unlocked = i === 0 || completed || completedIds.has(orderedStages[i - 1]?.id);
            const active = unlocked && !completed;
            const image = IMAGE_MAP[s.image_key ?? "journey"] ?? stageImg;
            const recommended = recommendedFocuses.some((f) => (s.focus_area ?? "").toLowerCase().includes(f));
            const left = i % 2 === 0;
            return (
              <Link
                key={s.id}
                to="/etapas/$stageId"
                params={{ stageId: String(s.id) }}
                className={cn("block relative", left ? "sm:pr-[52%]" : "sm:pl-[52%]")}
                style={{ animation: `fade-in 0.4s ease-out ${i * 60}ms both` }}
              >
                <Card
                  className={cn(
                    "overflow-hidden rounded-[16px] shadow-soft transition-all active:scale-[.97]",
                    completed && "border-accent-green/45",
                    active && "border-primary",
                    !unlocked && "opacity-70"
                  )}
                >
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 p-4 items-center">
                    <div className="relative w-16 h-16 shrink-0 rounded-[14px] overflow-hidden">
                      <img src={image} alt={s.title} width={1024} height={1024} loading="lazy" className={cn("h-full w-full object-cover", !unlocked && "blur-[2px]")} />
                      <div className={cn("absolute inset-0 grid place-items-center text-white font-bold", completed ? "bg-accent-green/75" : unlocked ? "bg-primary/60" : "bg-foreground/55")}>
                        {completed ? <Check className="w-6 h-6" /> : unlocked ? <span className="font-display text-lg">{s.id}</span> : <Lock className="w-5 h-5" />}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] uppercase tracking-widest text-primary font-bold">{s.focus_area ?? "restauración"}</span>
                        {recommended && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 text-gold px-2 py-0.5 text-[11px] font-bold">
                            <Sparkles className="w-3 h-3" /> Recomendada
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-[18px] leading-tight mt-1 truncate">{s.title}</h3>
                      <p className="text-[13px] text-muted-foreground mt-1 line-clamp-2">{s.subtitle}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className={cn("text-[12px] font-bold", completed ? "text-accent-green" : active ? "text-primary" : "text-muted-foreground")}>
                          {completed ? "Completada" : active ? "Disponible ahora" : "Bloqueada"}
                        </span>
                        {unlocked && <ArrowRight className="w-4 h-4 text-primary shrink-0" />}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
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
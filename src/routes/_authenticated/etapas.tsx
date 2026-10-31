import { useSeasonalBackground } from "@/lib/seasonal-bg";
import { wholeHojas } from "@/lib/gems";
import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Lock, AlertCircle, Flame, Award, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import stageImg from "@/assets/stage-journey.jpg";
import arbolIsla from "@/assets/hojas-tree.png";
import portal from "@/assets/onb-portal.png";
import heartGem from "@/assets/e3d-heartgem.png";
import { DuolingoPath } from "@/components/DuolingoPath";
import { toast } from "sonner";
import { getRecommendedFocuses, orderStages, resolveStageStates } from "@/lib/stage-order";

export const Route = createFileRoute("/_authenticated/etapas")({
  head: () => ({
    meta: [
      { title: "Mi camino ORIGEN — Mapa de etapas" },
      { name: "description", content: "Avanza por tu mapa de restauración: cada etapa desbloquea la siguiente parada de tu camino." },
      { property: "og:image", content: "https://tuorigen.app/og/etapas.jpg" }, { name: "twitter:image", content: "https://tuorigen.app/og/etapas.jpg" }, { property: "og:title", content: "Mi camino ORIGEN — Mapa de etapas" },
      { property: "og:description", content: "Tu mapa de restauración paso a paso, con hojas de sanación y logros." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Etapas,
});

function Etapas() {
  const seasonBg = useSeasonalBackground();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isDetailRoute = /^\/etapas\/[^/]+$/.test(pathname);

  const { data } = useQuery({
    queryKey: ["etapas", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [stages, progress, intake, rewards] = await Promise.all([
        supabase.from("stages").select("*").order("id"),
        supabase.from("stage_progress").select("*").eq("user_id", user!.id),
        supabase.from("intake_sessions").select("status, primary_focus, ai_plan").eq("user_id", user!.id).maybeSingle(),
        supabase.from("stage_rewards").select("stage_id, xp, insignia").eq("user_id", user!.id),
      ]);
      return { stages: stages.data ?? [], progress: progress.data ?? [], intake: intake.data, rewards: rewards.data ?? [] };
    },
  });

  const progressList = data?.progress ?? [];
  const completedIds = new Set(progressList.filter((p: any) => p.status === "completed").map((p: any) => p.stage_id));
  const recommendedFocuses = getRecommendedFocuses(data?.intake);
  const orderedStages = orderStages(data?.stages ?? [], recommendedFocuses);
  const stageStates = resolveStageStates(orderedStages.map((s: any) => s.id), progressList as any);
  const total = orderedStages.length || 7;
  const completedCount = completedIds.size;
  const pct = Math.round((completedCount / total) * 100);
  const firstName = (profile?.display_name || profile?.full_name || "Alma").split(" ")[0];
  const gems = wholeHojas(profile?.gems);
  const rewards = data?.rewards ?? [];
  const totalXp = rewards.reduce((a: number, r: any) => a + (r.xp ?? 0), 0);
  const insignias = Array.from(new Set(rewards.map((r: any) => r.insignia).filter(Boolean))) as string[];
  const logros = insignias.length;

  if (isDetailRoute) return <Outlet />;

  if (data && data.intake?.status !== "completed") {
    return (
      <div className="px-4 py-6 md:p-10 max-w-[1100px] mx-auto mobile-safe-bottom lg:pb-10">
        <Card className="overflow-hidden rounded-[16px] shadow-soft">
          <img src={stageImg} alt="Camino espiritual" className="h-56 w-full object-cover" />
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-[16px] bg-primary/10 text-primary grid place-items-center mx-auto"><AlertCircle className="w-6 h-6" /></div>
            <h1 className="font-display font-extrabold text-[28px] mt-4 leading-tight">Primero completa tu onboarding</h1>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-[15px]">Usamos tus respuestas iniciales para adaptar tu camino a tu historia real.</p>
            <Link to="/onboarding"><Button className="mt-6 h-[52px] w-full rounded-[12px] bg-primary text-[16px] font-semibold">Completar onboarding</Button></Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh">
      {/* Fondo místico animado */}
      <img src={seasonBg} alt="" aria-hidden width={720} height={1280} className="fixed inset-0 h-full w-full object-cover motion-safe:transition-opacity motion-safe:duration-500" />
      <div aria-hidden className="fixed inset-0 bg-gradient-to-b from-[#1E1712]/35 via-[#1E1712]/50 to-[#120D09]/85" />
      <div aria-hidden className="fixed inset-0 pointer-events-none">
        {[12, 34, 58, 76, 90].map((l, i) => (
          <span
            key={l}
            className="absolute w-1.5 h-1.5 rounded-full bg-card/70"
            style={{ left: `${l}%`, top: `${18 + i * 14}%`, animation: `fade-in 2.4s ease-in-out ${i * 420}ms infinite alternate` }}
          />
        ))}
      </div>

      <div className="relative z-10 px-4 py-5 md:px-6 max-w-[520px] mx-auto mobile-safe-bottom lg:pb-10">
        {/* Saludo + saldo */}
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <h1 className="font-display font-extrabold text-[26px] leading-tight text-white truncate">¡Hola, {firstName} hermosa! 💜</h1>
            <p className="text-[13.5px] text-white/75 mt-1 leading-snug">Tu transformación espiritual es un viaje, no una carrera.</p>
          </div>
          <div className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 shadow-soft">
            <span className="font-display font-extrabold text-[15px] text-foreground">{gems}</span>
            <Leaf className="w-4 h-4 text-[#3FBE8F]" />
          </div>
        </header>

        {/* Progreso general */}
        <Card className="relative overflow-hidden mt-4 p-4 rounded-[16px] border-white/15 bg-card/95 shadow-soft">
          <div className="text-[13px] font-bold text-primary">Tu progreso general</div>
          <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
            <Donut pct={pct} />
            <div className="min-w-0">
              <p className="font-display font-extrabold text-[19px] leading-tight">
                {completedCount} de {total} etapas
                <br />completadas
              </p>
              <p className="mt-1.5 text-[11.5px] text-muted-foreground leading-snug">
                7 etapas por semana, una lección por día · 365 lecciones al año
              </p>
              <div className="mt-2.5 h-2 w-full rounded-full bg-primary/12 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary via-accent-pink to-gold transition-all duration-1000" style={{ width: `${Math.max(pct, 4)}%` }} />
              </div>
            </div>
          </div>
          <img src={arbolIsla} alt="" aria-hidden width={512} height={512} loading="lazy" className="pointer-events-none absolute -right-3 -top-2 w-24 opacity-95" />
        </Card>

        {/* MAPA ESTILO DUOLINGO */}
        <div className="relative mt-6">
          <DuolingoPath
            nodes={orderedStages.map((s: any, i: number) => {
              const state = stageStates.get(s.id) ?? "locked-sequential";
              const day = (i % 7) + 1;
              return {
                key: String(s.id),
                label: `Lección ${i + 1} · Día ${day}: ${s.title as string}`,
                note:
                  state === "locked-today"
                    ? "Se abre mañana: una lección por día"
                    : state === "locked-sequential"
                      ? "Termina la lección anterior"
                      : undefined,
                state: state === "completed" ? "completed" : state === "open" ? "active" : "locked",
              } as const;
            })}
            onSelect={(node) => {
              if (node.state === "locked") {
                toast.info(
                  node.note?.startsWith("Se abre")
                    ? "Esta lección se abre mañana: en ORÍGEN se avanza una lección por día."
                    : "Completa la lección anterior para abrir esta.",
                );
                return;
              }
              navigate({ to: "/etapas/$stageId", params: { stageId: node.key } });
            }}
          />
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatCard label="Racha actual" value={`${profile?.consecutive_days ?? 0} días`} icon={<Flame className="w-4 h-4 text-[#FF7A3C]" />} />
          <StatCard label="Hojas de sanación" value={String(gems)} icon={<Leaf className="w-4 h-4 text-[#3FBE8F]" />} />
          <StatCard label="Logros" value={String(logros)} icon={<Award className="w-4 h-4 text-gold" />} />
        </div>

        {/* XP e insignias ganadas */}
        <Card className="mt-4 p-4 rounded-[16px] border-white/15 bg-card/95 shadow-soft">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-widest font-bold text-primary">Tus recompensas</div>
              <p className="font-display font-extrabold text-[19px] leading-tight mt-1">{totalXp} XP acumulados</p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-gold/12 px-3 py-2">
              <Award className="w-4 h-4 text-gold" />
              <span className="font-display font-extrabold text-[14px]">{insignias.length}</span>
            </span>
          </div>
          {insignias.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {insignias.map((b) => (
                <span key={b} className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1.5 text-[12px] font-bold text-primary">
                  <Award className="w-3.5 h-3.5" /> {b}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[12.5px] text-muted-foreground leading-snug">Completa tu primera etapa para ganar tu primera insignia y tus primeros XP.</p>
          )}
        </Card>

        {/* Escritura */}
        <Card className="relative overflow-hidden mt-4 p-4 pr-24 rounded-[16px] border-white/15 bg-card/92 shadow-soft">
          <p className="scripture text-[14px] leading-snug">
            “Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.”
          </p>
          <p className="text-[12px] font-bold text-primary mt-2">— Mateo 11:28</p>
          <img src={portal} alt="" aria-hidden width={512} height={512} loading="lazy" className="pointer-events-none absolute -right-2 bottom-0 w-24 object-contain" />
        </Card>
      </div>
    </div>
  );
}

function Donut({ pct }: { pct: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-[78px] h-[78px] shrink-0">
      <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="8" className="stroke-primary/12" />
        <circle
          cx="36" cy="36" r={r} fill="none" strokeWidth="8" strokeLinecap="round"
          className="stroke-primary transition-all duration-1000"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.min(pct, 100)) / 100}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display font-extrabold text-[17px]">{pct}%</span>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-[16px] bg-card/92 p-3 text-center shadow-soft">
      <div className="text-[11px] font-semibold text-muted-foreground leading-tight">{label}</div>
      <div className="mt-1 inline-flex items-center gap-1.5">
        <span className="font-display font-extrabold text-[16px] text-foreground">{value}</span>
        {icon}
      </div>
    </div>
  );
}


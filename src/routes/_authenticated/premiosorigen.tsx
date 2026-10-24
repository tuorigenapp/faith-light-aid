import { wholeHojas } from "@/lib/gems";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, Crown, Flame, Gift, Lock, Sparkles, Star, Trophy, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";
import { GrowingTree } from "@/components/GrowingTree";
import { WHEEL_PRIZES } from "@/lib/ruleta";
import e3dStar from "@/assets/e3d-star.png";
import e3dCoin from "@/assets/e3d-coin.png";
import e3dHeart from "@/assets/e3d-heartgem.png";
import e3dPractice from "@/assets/e3d-practice.png";
import companion from "@/assets/origen-companion.png";
import dove from "@/assets/origen-dove.png";
import lion from "@/assets/origen-lion.png";
import lamb from "@/assets/origen-lamb.png";
import logo from "@/assets/logo-origen.png";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/premiosorigen")({
  head: () => ({
    meta: [
      { title: "Premios ORÍGEN — Bonificaciones" },
      { name: "description", content: "Consulta tu trayectoria, racha, XP y recompensas desbloqueables dentro de ORÍGEN." },
      { property: "og:title", content: "Premios ORÍGEN" },
      { property: "og:description", content: "Bonificaciones, logros y recompensas para motivar tu camino diario." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PremiosOrigen,
});

const REWARDS = [
  { title: "Primer cierre", target: 1, image: lamb, icon: Star, gift: "Primer paso" },
  { title: "Racha de 7 días", target: 7, image: dove, icon: Flame, gift: "Constancia" },
  { title: "30 días de camino", target: 30, image: lion, icon: Crown, gift: "Fortaleza" },
  { title: "100 acciones reales", target: 100, image: companion, icon: Trophy, gift: "Propósito" },
];

function todayIso(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function PremiosOrigen() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["premios-origen", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [profile, activities, stageRewards, stages] = await Promise.all([
        supabase.from("profiles").select("display_name, full_name, gems, consecutive_days").eq("id", user!.id).maybeSingle(),
        supabase.from("daily_activity").select("activity_date, activity_type").eq("user_id", user!.id).order("activity_date", { ascending: false }).limit(180),
        supabase.from("stage_rewards").select("xp, leaves, insignia, created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(80),
        supabase.from("stage_progress").select("stage_id, status").eq("user_id", user!.id),
      ]);
      return { profile: profile.data, activities: activities.data ?? [], stageRewards: stageRewards.data ?? [], stages: stages.data ?? [] };
    },
  });

  const dates = new Set((data?.activities ?? []).map((a) => a.activity_date));
  let streak = 0;
  for (let i = 0; i < 120; i++) {
    if (dates.has(todayIso(-i))) streak += 1;
    else break;
  }
  const actions = data?.activities?.length ?? 0;
  const xp = (data?.stageRewards ?? []).reduce((sum, r) => sum + (r.xp ?? 0), 0) + actions * 10;
  const name = (data?.profile?.display_name || data?.profile?.full_name || "Amigo").split(" ")[0];
  const next = REWARDS.find((r) => actions < r.target) ?? REWARDS[REWARDS.length - 1];
  const nextPct = next ? Math.min(100, Math.round((actions / next.target) * 100)) : 100;

  const TOTAL_STAGES = 8;
  const stagesDone = (data?.stages ?? []).filter((x: any) => x.status === "completed").length;
  const treePct = Math.min(100, Math.round((stagesDone / TOTAL_STAGES) * 70 + Math.min(30, actions / 3)));
  const treeLabel = treePct < 15 ? "Tu árbol está seco, pero tiene raíz" : treePct < 50 ? "Empiezan a salir hojas" : treePct < 85 ? "Tu árbol está tomando vida" : "Tu árbol está florecido";

  return (
    <div className="personal-space min-h-dvh">
      <div className="mx-auto max-w-[1120px] px-5 pt-6 pb-28">
        <section className="personal-banner relative overflow-hidden border-b border-border p-5">
          <div className="relative grid gap-5 md:grid-cols-[minmax(0,1fr)_220px] items-center">
            <div>
              <div className="flex items-center gap-2"><img src={logo} alt="ORÍGEN" className="h-10 w-10 object-contain" /><p className="text-[12px] uppercase font-bold text-primary">Premios ORÍGEN</p></div>
              <h1 className="font-display font-extrabold text-[32px] leading-[1.12] mt-3">{name}, celebra lo que sí avanzaste</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">Tu constancia tiene raíces. Cada paso real cuenta en tu historia.</p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <Stat icon={Flame} label="Racha" value={`${streak} días`} />
                <Stat icon={Sparkles} label="XP" value={xp.toLocaleString()} />
                <Stat icon={Gift} label="Hojas" value={wholeHojas(data?.profile?.gems).toLocaleString("es")} />
              </div>
            </div>
            <img src={companion} alt="Compañero ORÍGEN celebra tu avance" loading="eager" className="mascot-motion mx-auto h-48 w-48 object-contain" />
          </div>
        </section>

        <section className="mt-6 border-b border-border pb-6">
          <p className="text-[11px] uppercase tracking-widest font-bold text-primary">Tu árbol ORÍGEN</p>
          <h2 className="font-display font-bold text-[19px] leading-tight">{treeLabel}</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">Crece con cada etapa de tu Camino ORÍGEN que completas.</p>
          <GrowingTree pct={treePct} />
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {Array.from({ length: TOTAL_STAGES }, (_, i) => {
              const done = i < stagesDone;
              return (
                <div key={i} className={cn("rounded-[10px] border p-2 text-center", done ? "border-primary/40 bg-primary/10" : "border-border")}>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Etapa</p>
                  <p className="font-display text-[16px] font-bold">{i + 1}</p>
                  <p className={cn("text-[10px] font-semibold", done ? "text-primary" : "text-muted-foreground")}>{done ? "Lista" : i === stagesDone ? "En curso" : "Pendiente"}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[13px] font-semibold">{stagesDone} de {TOTAL_STAGES} etapas · sigue avanzando para que florezca.</p>
        </section>

        <section className="mt-6 border-b border-border pb-6">
          <div className="mb-4 flex items-center gap-4"><img src={lion} alt="León ORÍGEN" loading="lazy" className="mascot-motion h-24 w-24 object-contain" /><div><h2 className="font-display text-[22px] font-bold">Un giro, nuevas posibilidades</h2><p className="mt-1 text-sm text-muted-foreground">Tus premios disponibles están en la ruleta.</p></div></div>
          <p className="text-[11px] uppercase tracking-widest font-bold text-primary">Lo que puedes ganar en la ruleta</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {WHEEL_PRIZES.map((w) => (
              <li key={w.key} className="flex items-start gap-3 rounded-[12px] border border-border p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-primary/10 text-primary"><Gift className="h-5 w-5" /></span>
                <span className="min-w-0"><span className="block text-[14px] font-bold">{w.label}</span><span className="block text-[12.5px] text-muted-foreground">{w.description}</span></span>
              </li>
            ))}
          </ul>
          <Button asChild className="mt-4 h-[52px] w-full rounded-[12px] text-[16px] font-semibold"><Link to="/ruleta"><Gift className="mr-2 h-5 w-5" />Girar la ruleta de hoy</Link></Button>
        </section>

        <section className="mt-6 border-b border-border pb-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div>
              <p className="text-[12px] uppercase font-bold text-primary">Siguiente hito</p>
              <h2 className="font-display font-bold text-[19px] leading-tight">{next?.title}</h2>
            </div>
            <Award className="w-7 h-7 text-primary" />
          </div>
          <div className="mt-4 h-4 rounded-full bg-primary/12 overflow-hidden">
            <div className="h-full rounded-full bg-brand-gradient transition-all" style={{ width: `${nextPct}%` }} />
          </div>
          <p className="mt-2 text-[13px] text-muted-foreground">{actions} de {next?.target} acciones · {next?.gift}</p>
        </section>

        <section className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {REWARDS.map((reward) => {
            const unlocked = actions >= reward.target;
            const pct = Math.min(100, Math.round((actions / reward.target) * 100));
            const Icon = reward.icon;
            return (
              <article key={reward.title} className={cn("rounded-[16px] border p-4 shadow-soft bg-card overflow-hidden", unlocked ? "border-primary/45" : "border-border")}>
                <div className="flex items-start justify-between gap-3">
                  <img src={reward.image} alt={reward.gift} loading="lazy" className={cn("h-28 w-28 object-contain", unlocked ? "mascot-motion" : "opacity-65 grayscale")} />
                  <span className={cn("w-10 h-10 rounded-[12px] grid place-items-center", unlocked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    {unlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </span>
                </div>
                <h3 className="mt-3 font-display font-bold text-[16px] leading-tight">{reward.title}</h3>
                <p className="mt-1 text-[12.5px] text-muted-foreground">{reward.gift}</p>
                <div className="mt-4 h-2.5 rounded-full bg-primary/10 overflow-hidden"><div className="h-full rounded-full bg-brand-gradient" style={{ width: `${pct}%` }} /></div>
                <p className="mt-2 text-[12px] font-bold text-primary">{unlocked ? "Hito alcanzado" : `${actions}/${reward.target}`}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-5 grid gap-3 md:grid-cols-2">
          <Link to="/ruleta" className="app-card p-4 flex items-center gap-3 active:scale-[.99] transition">
            <span className="w-12 h-12 rounded-[14px] bg-primary/10 grid place-items-center text-primary"><Gift className="w-6 h-6" /></span>
            <div className="min-w-0"><h3 className="font-display font-bold text-[16px]">Ruleta diaria</h3><p className="text-[13px] text-muted-foreground">Gira una vez cada 24 horas y suma premios.</p></div>
          </Link>
          <Link to="/comprarmonedas" className="app-card p-4 flex items-center gap-3 active:scale-[.99] transition">
            <span className="w-12 h-12 rounded-[14px] bg-primary/10 grid place-items-center text-primary"><Sparkles className="w-6 h-6" /></span>
            <div className="min-w-0"><h3 className="font-display font-bold text-[16px]">Comprar monedas</h3><p className="text-[13px] text-muted-foreground">Recarga hojas para consultas y mentoría.</p></div>
          </Link>
        </section>

        {isLoading && <div className="mt-5 h-24 rounded-[16px] bg-muted animate-pulse" />}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-[14px] bg-background border border-border p-3">
      <Icon className="w-4 h-4 text-primary" />
      <p className="mt-2 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{label}</p>
      <p className="font-display font-bold text-[15px] leading-tight">{value}</p>
    </div>
  );
}

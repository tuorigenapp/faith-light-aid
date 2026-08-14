import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { awardGems } from "@/lib/gems";
import { CAMINO_TOTAL_DAYS, WEEK_UNLOCK_COST, getCamino } from "@/lib/caminos";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, Award, Check, Flame, Leaf, Lock, Sparkles } from "lucide-react";
import paisaje from "@/assets/fondo-mistico.png";
import mapaCamino from "@/assets/mapa-camino.png";
import arbolIsla from "@/assets/hojas-tree.png";
import heartGem from "@/assets/e3d-heartgem.png";
import portal from "@/assets/onb-portal.png";

export const Route = createFileRoute("/_authenticated/caminos/$caminoId/")({
  head: () => ({
    meta: [
      { title: "Mi transformación diaria — Caminos ORIGEN" },
      { name: "description", content: "Una lección por día: mapa guiado con lección, tareas, juegos y recompensas para tu tema." },
      { property: "og:title", content: "Mi transformación diaria — Caminos ORIGEN" },
      { property: "og:description", content: "Lección diaria con tareas espirituales, quiz y juegos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CaminoMapa,
});

function todayIso() { return new Date().toISOString().slice(0, 10); }

function CaminoMapa() {
  const { caminoId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const camino = getCamino(caminoId);

  const { data } = useQuery({
    queryKey: ["camino", caminoId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("daily_activity")
        .select("activity_type, activity_date, metadata")
        .eq("user_id", user!.id)
        .in("activity_type", ["camino_dia", "camino_semana"]);
      const mine = (rows ?? []).filter((r: any) => r.metadata?.camino === caminoId);
      return {
        done: mine.filter((r: any) => r.activity_type === "camino_dia").map((r: any) => ({ day: Number(r.metadata?.day), date: r.activity_date as string })),
        weekOpen: mine.some((r: any) => r.activity_type === "camino_semana"),
      };
    },
  });

  if (!camino) {
    return (
      <div className="px-4 py-12 max-w-md mx-auto text-center">
        <h1 className="font-display font-extrabold text-[22px]">Este camino no está disponible</h1>
        <Link to="/categorias" className="mt-4 inline-flex h-12 items-center rounded-[12px] px-5 btn-primary-gradient text-white text-[15px] font-semibold">Ver categorías</Link>
      </div>
    );
  }

  const done = data?.done ?? [];
  const doneDays = new Set(done.map((d) => d.day));
  const weekOpen = data?.weekOpen ?? false;
  const doneToday = done.some((d) => d.date === todayIso());
  const completedCount = doneDays.size;
  const pct = Math.round((completedCount / CAMINO_TOTAL_DAYS) * 100);
  const gems = profile?.gems ?? 0;
  const firstName = (profile?.display_name || profile?.full_name || "Alma").split(" ")[0];

  const isUnlocked = (day: number) => {
    if (doneDays.has(day)) return true;
    if (day === 1) return true;
    if (!doneDays.has(day - 1)) return false;
    return weekOpen || !doneToday;
  };

  async function unlockWeek() {
    if (!user) return;
    if (gems < WEEK_UNLOCK_COST) {
      toast.error(`Necesitas ${WEEK_UNLOCK_COST} hojas para abrir la semana completa.`);
      navigate({ to: "/premios" });
      return;
    }
    await awardGems(-WEEK_UNLOCK_COST, `Semana completa · ${camino!.title}`);
    await supabase.from("daily_activity").insert({
      user_id: user.id,
      activity_type: "camino_semana",
      activity_date: todayIso(),
      reference_id: crypto.randomUUID(),
      metadata: { camino: caminoId } as never,
    });
    qc.invalidateQueries({ queryKey: ["camino", caminoId] });
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Semana completa desbloqueada · 7 días disponibles");
  }

  return (
    <div className="relative min-h-dvh">
      <img src={paisaje} alt="" aria-hidden width={1024} height={1024} className="fixed inset-0 h-full w-full object-cover" />
      <img src={mapaCamino} alt="" aria-hidden width={1024} height={1024} className="fixed inset-0 h-full w-full object-cover opacity-30 mix-blend-screen" />
      <div aria-hidden className="fixed inset-0 bg-gradient-to-b from-[#2A1B45]/72 via-[#241539]/78 to-[#150C24]/92" />

      <div className="relative z-10 px-4 py-5 max-w-[520px] mx-auto mobile-safe-bottom lg:pb-10">
        <Link to="/categorias" className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-white/85">
          <span className="w-11 h-11 rounded-[12px] bg-white/15 backdrop-blur grid place-items-center"><ArrowLeft className="w-5 h-5" /></span>
          Categorías
        </Link>

        <header className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-widest font-bold text-[#F58BCB]">Transformación diaria</div>
            <h1 className="font-display font-extrabold text-[25px] leading-tight text-white mt-1">{camino.title}</h1>
            <p className="text-[13.5px] text-white/75 mt-1 leading-snug">{camino.claim}</p>
          </div>
          <div className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 shadow-soft">
            <span className="font-display font-extrabold text-[15px] text-foreground">{gems}</span>
            <Leaf className="w-4 h-4 text-[#3FBE8F]" />
          </div>
        </header>

        {/* Banner del tema */}
        <div className="mt-4 rounded-[16px] overflow-hidden shadow-soft">
          <img src={camino.banner} alt={camino.title} loading="lazy" className="w-full h-auto block" />
        </div>

        {/* Progreso */}
        <div className="relative overflow-hidden mt-4 p-4 rounded-[16px] bg-white/95 shadow-soft">
          <div className="text-[13px] font-bold text-primary">Hola {firstName}, tu progreso aquí</div>
          <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
            <Donut pct={pct} />
            <div className="min-w-0">
              <p className="font-display font-extrabold text-[19px] leading-tight">{completedCount} días<br />completados</p>
              <div className="mt-2.5 h-2 w-full rounded-full bg-primary/12 overflow-hidden">
                <div className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-1000", camino.gradient)} style={{ width: `${Math.max(pct, 4)}%` }} />
              </div>
            </div>
          </div>
          <img src={arbolIsla} alt="" aria-hidden width={512} height={512} loading="lazy" className="pointer-events-none absolute -right-3 -top-2 w-24 opacity-95" />
        </div>

        {!weekOpen && (
          <button onClick={unlockWeek} className="mt-3 w-full h-[52px] rounded-[12px] bg-white/95 text-[15px] font-semibold text-primary inline-flex items-center justify-center gap-2 shadow-soft active:scale-[.97] transition">
            <Leaf className="w-4.5 h-4.5 text-[#3FBE8F]" /> Abrir la semana completa · {WEEK_UNLOCK_COST} hojas
          </button>
        )}
        {weekOpen && (
          <p className="mt-3 text-center text-[12.5px] text-white/80 inline-flex w-full items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold" /> Semana completa abierta: avanza a tu ritmo
          </p>
        )}
        {!weekOpen && doneToday && (
          <p className="mt-2 text-center text-[12.5px] text-white/75">Ya completaste tu etapa de hoy. Vuelve mañana o abre la semana completa.</p>
        )}

        {/* MAPA */}
        <div className="relative mt-6">
          <div aria-hidden className="absolute left-[27px] top-6 bottom-6 w-[3px] rounded-full bg-gradient-to-b from-[#3FBE8F]/70 via-accent-pink/60 to-white/20" />
          <ol className="relative space-y-3.5">
            {camino.etapas.map((e, i) => {
              const completed = doneDays.has(e.day);
              const unlocked = isUnlocked(e.day);
              const active = unlocked && !completed;
              const inner = (
                <div className={cn("grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3", i % 2 === 0 ? "ml-0" : "ml-6")}>
                  <span
                    className={cn(
                      "relative w-[54px] h-[54px] shrink-0 rounded-full grid place-items-center border-[3px] transition",
                      completed && "bg-[#3FBE8F] border-white/70 text-white",
                      active && "bg-gradient-to-br from-accent-pink to-primary border-white text-white",
                      !unlocked && "bg-primary/35 border-white/25 text-white/70 backdrop-blur",
                    )}
                    style={active ? { boxShadow: "0 0 0 8px rgba(245,139,203,0.22), 0 8px 22px rgba(245,139,203,0.45)" } : undefined}
                  >
                    {completed ? <Check className="w-7 h-7" /> : active ? (
                      <img src={heartGem} alt="" aria-hidden width={128} height={128} className="w-8 h-8 object-contain drop-shadow" />
                    ) : <span className="font-display font-extrabold text-[17px]">{e.day}</span>}
                  </span>
                  <div
                    className={cn(
                      "min-w-0 rounded-full pl-4 pr-3 py-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 transition active:scale-[.98]",
                      completed && "bg-white/92",
                      active && "bg-white border-2 border-accent-pink",
                      !unlocked && "bg-white/12 border border-white/18 backdrop-blur",
                    )}
                    style={active ? { boxShadow: "0 4px 14px rgba(245,139,203,0.28)" } : undefined}
                  >
                    <span className={cn("truncate font-display font-bold text-[15px]", unlocked ? "text-foreground" : "text-white/80")}>
                      Día {e.day} · {e.title}
                    </span>
                    {active && <span className="shrink-0 rounded-full bg-accent-pink px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-white">HOY</span>}
                    {!unlocked && <Lock className="w-4 h-4 shrink-0 text-white/70" />}
                  </div>
                </div>
              );
              return (
                <li key={e.day} style={{ animation: `fade-in .45s ease-out ${i * 70}ms both` }}>
                  {unlocked ? (
                    <Link to="/caminos/$caminoId/$day" params={{ caminoId, day: String(e.day) }} className="block">{inner}</Link>
                  ) : (
                    <button onClick={unlockWeek} className="block w-full text-left">{inner}</button>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat label="Racha actual" value={`${profile?.consecutive_days ?? 0} días`} icon={<Flame className="w-4 h-4 text-[#FF7A3C]" />} />
          <Stat label="Hojas" value={String(gems)} icon={<Leaf className="w-4 h-4 text-[#3FBE8F]" />} />
          <Stat label="Insignias" value={String(completedCount)} icon={<Award className="w-4 h-4 text-gold" />} />
        </div>

        <div className="relative overflow-hidden mt-4 p-4 pr-24 rounded-[16px] bg-white/92 shadow-soft">
          <p className="scripture text-[14px] leading-snug">“{camino.scripture.text}”</p>
          <p className="text-[12px] font-bold text-primary mt-2">— {camino.scripture.ref}</p>
          <img src={portal} alt="" aria-hidden width={512} height={512} loading="lazy" className="pointer-events-none absolute -right-2 bottom-0 w-24 object-contain" />
        </div>
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
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="8" strokeLinecap="round" className="stroke-primary transition-all duration-1000"
          strokeDasharray={c} strokeDashoffset={c - (c * Math.min(pct, 100)) / 100} />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display font-extrabold text-[17px]">{pct}%</span>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-[16px] bg-white/92 p-3 text-center shadow-soft">
      <div className="text-[11px] font-semibold text-muted-foreground leading-tight">{label}</div>
      <div className="mt-1 inline-flex items-center gap-1.5">
        <span className="font-display font-extrabold text-[16px] text-foreground">{value}</span>
        {icon}
      </div>
    </div>
  );
}

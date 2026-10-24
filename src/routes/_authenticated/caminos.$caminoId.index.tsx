import { useSeasonalBackground } from "@/lib/seasonal-bg";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCamino } from "@/hooks/use-content-overrides";
import { useAuth } from "@/lib/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { hasHojas, spendHojas, wholeHojas } from "@/lib/gems";
import { CAMINO_TOTAL_DAYS, WEEK_UNLOCK_COST } from "@/lib/caminos";
import { cn } from "@/lib/utils";
import { DuolingoPath } from "@/components/DuolingoPath";
import { toast } from "sonner";
import { ArrowLeft, Award, Check, Flame, Leaf, Lock, Sparkles } from "lucide-react";
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
  const seasonBg = useSeasonalBackground();
  const { caminoId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { camino, isLoading: caminoLoading } = useCamino(caminoId);

  const { data } = useQuery({
    queryKey: ["camino", caminoId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("daily_activity")
        .select("activity_type, activity_date, metadata")
        .eq("user_id", user!.id)
        .in("activity_type", ["camino_dia", "camino_semana"]);
      const mine = (rows ?? []).filter((r: any) => r.metadata?.camino === caminoId || (r.activity_type === "camino_semana" && r.metadata?.camino === "*" && r.activity_date >= new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)));
      return {
        done: mine.filter((r: any) => r.activity_type === "camino_dia").map((r: any) => ({ day: Number(r.metadata?.day), date: r.activity_date as string })),
        weekOpen: mine.some((r: any) => r.activity_type === "camino_semana"),
      };
    },
  });

  if (!camino && caminoLoading) return <div className="mx-auto max-w-[520px] px-4 pt-6"><div className="h-56 animate-pulse rounded-[16px] bg-muted" /></div>;
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
  const gems = wholeHojas(profile?.gems);
  const firstName = (profile?.display_name || profile?.full_name || "Alma").split(" ")[0];

  const isUnlocked = (day: number) => {
    if (doneDays.has(day)) return true;
    if (day === 1) return true;
    if (!doneDays.has(day - 1)) return false;
    return weekOpen || !doneToday;
  };

  async function unlockWeek() {
    if (!user) return;
    if (!hasHojas(profile?.gems, WEEK_UNLOCK_COST)) {
      toast.error(`Necesitas ${WEEK_UNLOCK_COST} hojas para abrir la semana completa.`);
      navigate({ to: "/comprarmonedas" });
      return;
    }
    const nb = await spendHojas(WEEK_UNLOCK_COST, `Semana completa · ${camino!.title}`, { camino: caminoId });
    if (nb === null) { toast.error("No pudimos cobrar tus hojas. Intenta de nuevo."); return; }
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
      <img src={seasonBg} alt="" aria-hidden width={720} height={1280} className="fixed inset-0 h-full w-full object-cover motion-safe:transition-opacity motion-safe:duration-500" />
      <div aria-hidden className="fixed inset-0 bg-gradient-to-b from-[#1E1712]/35 via-[#1E1712]/50 to-[#120D09]/85" />

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

        {/* MAPA ESTILO DUOLINGO */}
        <div className="relative mt-6">
          <DuolingoPath
            nodes={camino.etapas.map((e) => {
              const completed = doneDays.has(e.day);
              const unlocked = isUnlocked(e.day);
              return {
                key: String(e.day),
                label: `Día ${e.day} · ${e.title}`,
                state: completed ? "completed" : unlocked ? "active" : "locked",
              } as const;
            })}
            onSelect={(node) => {
              if (node.state === "locked") {
                void unlockWeek();
                return;
              }
              navigate({ to: "/caminos/$caminoId/$day", params: { caminoId, day: node.key } });
            }}
          />
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

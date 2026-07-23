import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { HealingTree } from "@/components/HealingTree";
import { DailyReflection } from "@/components/DailyReflection";
import { DailyQuiz } from "@/components/DailyQuiz";
import { LockedCard } from "@/components/LockedCard";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowRight, BookHeart, Compass, Flame, HeartHandshake, Headphones,
  Layers, MessageCircle, Sparkles, TreeDeciduous, Trophy, Users2, HeartPulse,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Hoy — ORIGEN" }] }),
  component: Dashboard,
});

function todayIso() { return new Date().toISOString().slice(0, 10); }

function Dashboard() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["dashboard", user?.id, todayIso()],
    enabled: !!user,
    queryFn: async () => {
      const [profile, diag, progress, activities, streak] = await Promise.all([
        supabase.from("profiles").select("display_name, full_name, gems").eq("id", user!.id).maybeSingle(),
        supabase.from("diagnostic_results").select("level").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("stage_progress").select("stage_id,status").eq("user_id", user!.id),
        supabase.from("daily_activity").select("activity_date").eq("user_id", user!.id).order("activity_date", { ascending: false }).limit(14),
        supabase.from("daily_activity").select("activity_date").eq("user_id", user!.id).order("activity_date", { ascending: false }).limit(30),
      ]);
      return {
        profile: profile.data,
        diagnostic: diag.data,
        progressItems: progress.data ?? [],
        activities: activities.data ?? [],
        streakActivities: streak.data ?? [],
      };
    },
  });

  const displayName = (data?.profile?.display_name || data?.profile?.full_name || "Amigo").split(" ")[0];
  const completed = (data?.progressItems ?? []).filter((p) => p.status === "completed").length;

  // Streak calc: consecutive days from today back
  const streakDates = new Set((data?.streakActivities ?? []).map((a) => a.activity_date));
  const week = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { date: d, iso: d.toISOString().slice(0, 10), active: streakDates.has(d.toISOString().slice(0, 10)) };
  });
  const activeCount = week.filter((w) => w.active).length;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-aura-top">
      <div className="relative z-10 max-w-lg lg:max-w-4xl mx-auto px-4 pt-4 pb-10 space-y-4">
        {/* Greeting header */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-brand-gradient shadow-glow grid place-items-center text-white font-display font-bold shrink-0">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <h1 className="font-display font-bold text-[20px] leading-tight truncate">
                Hola, {displayName}
              </h1>
            </div>
          </div>
        </header>

        {/* Hero mission */}
        <div className="hero-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-widest font-bold text-primary">Tu misión de hoy</span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-secondary text-primary">
              {data?.diagnostic?.level ?? "Personalizado"}
            </span>
          </div>
          <h2 className="font-display font-bold text-[20px] leading-tight">
            {data?.diagnostic ? "Continúa tu Camino ORIGEN" : "Empieza con tu Diagnóstico Inicial"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.diagnostic
              ? `Llevas ${completed} etapas completadas. Sigue avanzando en tu proceso.`
              : "Necesito conocerte para personalizar tu camino de sanación."}
          </p>
          <Link
            to={data?.diagnostic ? "/etapas" : "/diagnostico"}
            className="mt-4 btn-primary-gradient w-full h-[54px] rounded-[14px] flex items-center justify-center gap-2 text-[15px]"
          >
            {data?.diagnostic ? "Ver mis etapas" : "Comenzar diagnóstico"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3 pilares principales */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-bold text-[15px]">Los 3 pilares del método</h3>
          </div>
          <div className="hairline-brand mb-3" />

          <div className="space-y-3">
            <PilarCard
              to="/chat"
              gradient="from-[#7C5CFF] to-[#5AA9FF]"
              icon={<MessageCircle className="w-6 h-6" />}
              badge="Mentora en vivo"
              title="Conversa con Ruth Esther"
              desc="Cuéntale lo que sientes. Te acompaña con la sabiduría del libro y del método ORIGEN."
              cta="Abrir conversación"
            />
            <PilarCard
              to="/pareja"
              gradient="from-[#F58BCB] to-[#7C5CFF]"
              icon={<HeartHandshake className="w-6 h-6" />}
              badge="Nuevo"
              title="¿Tu pareja es deuda o propósito?"
              desc="Descubre qué viene a enseñarte esta persona. Solo necesitas los datos de ambos."
              cta="Analizar mi pareja"
            />
            <PilarCard
              to="/patrones"
              gradient="from-[#3FBE8F] to-[#5AA9FF]"
              icon={<Users2 className="w-6 h-6" />}
              badge="Análisis profundo"
              title="Encuentra tu patrón familiar"
              desc="Basado en tu árbol y tu historia. Identifica qué se está repitiendo y cómo romperlo."
              cta="Analizar mi patrón"
            />
          </div>
        </section>

        {/* Racha + Progreso */}
        <div className="grid grid-cols-2 gap-3">
          <div className="app-card p-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#F58BCB]/15 grid place-items-center">
                <Flame className="w-5 h-5 text-[#F58BCB]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Racha</p>
                <p className="font-display font-bold text-base">{activeCount} días</p>
              </div>
            </div>
            <div className="mt-3 flex gap-1 items-center">
              {week.map((w, i) => (
                <span key={i} className={"w-2 h-2 rounded-full " + (w.active ? "bg-primary" : "bg-border")} />
              ))}
            </div>
          </div>
          <Link to="/etapas" className="app-card p-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-secondary grid place-items-center">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Camino 365</p>
                <p className="font-display font-bold text-base">Día {Math.min(365, Math.max(1, data?.streakActivities?.length || 1))} / 365</p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-brand-gradient" style={{ width: `${Math.min(100, ((data?.streakActivities?.length ?? 0) / 365) * 100)}%` }} />
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">Semana {Math.max(1, Math.ceil((data?.streakActivities?.length || 1) / 7))} de 52 · {completed} etapas</p>
          </Link>

        </div>

        {/* Árbol de Sanación */}
        <HealingTree />

        {/* Reflexión del día */}
        <DailyReflection />

        {/* Quiz diario */}
        <DailyQuiz />

        {/* Descubre hoy — mezcla desbloqueado + bloqueado */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-bold text-[15px]">Descubre hoy</h3>
            <span className="text-[11px] font-semibold text-primary">Explorar</span>
          </div>
          <div className="hairline-brand mb-3" />
          <div className="grid grid-cols-2 gap-3">
            <Link to="/arbol" className="app-card p-4">
              <div className="w-10 h-10 rounded-xl bg-[#3FBE8F]/15 grid place-items-center text-[#3FBE8F]">
                <TreeDeciduous className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-[14px] mt-2">Mi árbol genealógico</h4>
              <p className="text-xs text-muted-foreground mt-1">Suma familiares y sana tu linaje.</p>
            </Link>
            <Link to="/diario" className="app-card p-4">
              <div className="w-10 h-10 rounded-xl bg-[#F58BCB]/15 grid place-items-center text-[#F58BCB]">
                <BookHeart className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-[14px] mt-2">Diario íntimo</h4>
              <p className="text-xs text-muted-foreground mt-1">Escribe lo que llevas en el alma.</p>
            </Link>
            <LockedCard
              title="Círculo de mujeres"
              subtitle="Sesiones en vivo cada semana"
              icon={<div className="w-10 h-10 rounded-xl bg-primary/15 grid place-items-center text-primary"><HeartPulse className="w-5 h-5" /></div>}
            />
            <LockedCard
              title="Meditaciones guiadas"
              subtitle="Audios diarios del método"
              icon={<div className="w-10 h-10 rounded-xl bg-accent/15 grid place-items-center text-accent"><Headphones className="w-5 h-5" /></div>}
            />
          </div>
        </section>

        {/* Diagnóstico prompt */}
        {!data?.diagnostic && (
          <Link to="/diagnostico" className="app-card p-4 flex items-center justify-between bg-brand-soft">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-primary font-bold">Necesario</div>
              <h4 className="font-display font-bold text-sm mt-0.5">Haz tu diagnóstico espiritual</h4>
              <p className="text-xs text-muted-foreground">Personaliza tus etapas y ejercicios.</p>
            </div>
            <Compass className="w-6 h-6 text-primary" />
          </Link>
        )}

        {/* Invita y gana */}
        <Link to="/invita" className="app-card p-5 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 text-6xl opacity-10">💜</div>
          <div className="flex items-start gap-3 relative">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient grid place-items-center text-white shadow-glow">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-widest text-primary font-bold">Invita sin presión</div>
              <h4 className="font-display font-bold text-[15px] mt-0.5">¿Conoces a alguien que necesite esto?</h4>
              <p className="text-xs text-muted-foreground mt-1">Comparte tu enlace, ayuda a un ser querido y gana un dinerito extra.</p>
            </div>
            <ArrowRight className="w-4 h-4 text-primary self-center" />
          </div>
        </Link>

        {/* Premios */}
        <Link to="/premios" className="app-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F7B955]/20 grid place-items-center text-[#F7B955]">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Tus hojas de sanación</p>
            <p className="font-display font-bold text-base">{(data?.profile?.gems ?? 0).toLocaleString()} 🍃</p>
          </div>
          <span className="text-xs font-bold text-primary">Canjear</span>
        </Link>
      </div>
    </div>
  );
}

function PilarCard({
  to, gradient, icon, badge, title, desc, cta,
}: { to: string; gradient: string; icon: React.ReactNode; badge: string; title: string; desc: string; cta: string }) {
  return (
    <Link to={to} className="block app-card overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
      <div className="p-4 flex items-start gap-3">
        <div className={`w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-soft grid place-items-center`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] uppercase tracking-widest font-bold text-primary">{badge}</span>
          <h4 className="font-display font-bold text-[16px] leading-tight mt-0.5">{title}</h4>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{desc}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground self-center shrink-0" />
      </div>
      <div className="px-4 pb-3 -mt-1">
        <span className="text-[11px] font-bold text-primary inline-flex items-center gap-1">
          {cta} <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}

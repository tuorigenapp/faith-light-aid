import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { HealingTree } from "@/components/HealingTree";
import { DailyReflection } from "@/components/DailyReflection";
import { DailyQuiz } from "@/components/DailyQuiz";
import { DailyExercises } from "@/components/DailyExercises";
import { CategoriaSlider } from "@/components/CategoriaSlider";
import { LockedCard } from "@/components/LockedCard";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowRight, BookHeart, Flame, Headphones,
  Layers, Sparkles, TreeDeciduous, Trophy, HeartPulse,
} from "lucide-react";
import pilarMentora from "@/assets/pilar-mentora.png.asset.json";
import pilarPareja from "@/assets/pilar-pareja.png.asset.json";
import pilarPatron from "@/assets/pilar-patron.png.asset.json";
import pilarMinistracion from "@/assets/dios-te-dice-hoy.png.asset.json";
import visualizaBanner from "@/assets/visualiza-banner-home-v2.png.asset.json";
import afiliacionBanner from "@/assets/afiliacion-origen-home.png.asset.json";

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
      const [profile, intake, progress, activities, streak] = await Promise.all([
        supabase.from("profiles").select("display_name, full_name, gems").eq("id", user!.id).maybeSingle(),
        supabase.from("intake_sessions").select("status, primary_focus, ai_plan, ai_summary").eq("user_id", user!.id).maybeSingle(),
        supabase.from("stage_progress").select("stage_id,status").eq("user_id", user!.id),
        supabase.from("daily_activity").select("activity_date").eq("user_id", user!.id).order("activity_date", { ascending: false }).limit(14),
        supabase.from("daily_activity").select("activity_date").eq("user_id", user!.id).order("activity_date", { ascending: false }).limit(30),
      ]);
      return {
        profile: profile.data,
        intake: intake.data,
        progressItems: progress.data ?? [],
        activities: activities.data ?? [],
        streakActivities: streak.data ?? [],
      };
    },
  });

  const realName = [data?.profile?.display_name, data?.profile?.full_name].find(
    (n) => n && n.trim() && !/^invitado_/i.test(n.trim()),
  );
  const displayName = (realName || "Amigo").trim().split(" ")[0];
  const completed = (data?.progressItems ?? []).filter((p) => p.status === "completed").length;
  const aiPlan = (data?.intake?.ai_plan ?? {}) as { pattern_name?: string; welcome_message?: string };
  const hasOnboarding = data?.intake?.status === "completed";

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
        {/* Greeting ahora vive en el header móvil deslizante */}


        {/* Hero mission */}
        <div className="hero-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-widest font-bold text-primary">Tu misión de hoy</span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-secondary text-primary">
              {aiPlan.pattern_name ?? "Personalizado"}
            </span>
          </div>
          <h2 className="font-display font-bold text-[20px] leading-tight">
            {hasOnboarding ? "Continúa tu Camino ORIGEN" : "Primero personalizamos tu caso"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {hasOnboarding
              ? `Ruth Esther ya adaptó tu camino. Llevas ${completed} etapas completadas.`
              : "El onboarding recoge tu historia para que ORIGEN encuentre tu punto de partida."}
          </p>
          <Link
            to={hasOnboarding ? "/etapas" : "/onboarding"}
            className="mt-4 btn-primary-gradient w-full h-[54px] rounded-[14px] flex items-center justify-center gap-2 text-[15px]"
          >
            {hasOnboarding ? "Ver mis etapas" : "Completar onboarding"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3 pilares principales */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-bold text-[15px]">Los 4 pilares más TOP del Método ORIGEN🔥</h3>
          </div>
          <div className="hairline-brand mb-3" />

          <div className="space-y-3">
            <PilarBanner to="/chat" image={pilarMentora.url} alt="Conversa con Ruth Esther" />
            <PilarBanner to="/pareja" image={pilarPareja.url} alt="¿Tu pareja es deuda o propósito?" />
            <PilarBanner to="/patrones" image={pilarPatron.url} alt="Encuentra tu patrón familiar" />
            <PilarBanner to="/ministracion" image={pilarMinistracion.url} alt="Dios te dice hoy — Ministración desde la Corte Celestial" />
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

        {/* Ejercicios del día — justo debajo del cuadro MI CAMINO */}
        <DailyExercises />

        {/* Palabras para ti Hoy */}
        <PalabrasHoy name={displayName} aiPlan={aiPlan} />

        {/* Árbol de Sanación */}
        <HealingTree />

        {/* Banner Visualízalo y Vívelo */}
        <Link
          to="/visualiza"
          aria-label="Visualízalo y Vívelo — descubre todas nuestras categorías"
          className="block rounded-[24px] overflow-hidden shadow-soft hover:shadow-glow transition-all hover-scale"
        >
          <img src={visualizaBanner.url} alt="Descubre todas nuestras categorías — Visualízalo y Vívelo" loading="lazy" className="w-full h-auto block" />
        </Link>


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

        {/* Invita y gana */}
        <Link
          to="/invita"
          aria-label="Afiliación ORIGEN — gana el 70% al compartir"
          className="block rounded-[24px] overflow-hidden shadow-soft hover:shadow-glow transition-all hover-scale"
        >
          <img src={afiliacionBanner.url} alt="Afiliación ORIGEN — Gana el 70% de ganancias al compartir ORIGEN" loading="lazy" className="w-full h-auto block" />
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

function PilarBanner({ to, image, alt }: { to: string; image: string; alt: string }) {
  return (
    <Link to={to} className="block rounded-[20px] overflow-hidden shadow-soft hover:shadow-glow transition-all hover-scale">
      <img src={image} alt={alt} loading="lazy" className="w-full h-auto block" />
    </Link>
  );
}


const PALABRAS = [
  "Hoy tu linaje respira contigo. Cada paso que das aquí también sana a los que vinieron antes.",
  "Lo que sentiste no fue debilidad: fue la memoria de tu familia pidiendo ser vista.",
  "No estás repitiendo por gusto. Estás repitiendo porque nadie te enseñó a cerrar. Hoy empiezas a cerrar.",
  "El amor que no recibiste puedes darlo. Y al darlo, se rompe el patrón.",
  "Tu paz de hoy es la oración que tu abuela nunca pudo terminar.",
  "No tienes que cargar lo que no es tuyo. Devuélvelo con respeto y sigue liviana.",
  "Cada vez que eliges responderte con ternura, tu niña interior confía un poco más.",
];

function PalabrasHoy({ name, aiPlan }: { name: string; aiPlan: { pattern_name?: string; welcome_message?: string } }) {
  const day = Math.floor(Date.now() / 86400000);
  const msg = PALABRAS[day % PALABRAS.length];
  const personalized = aiPlan.welcome_message || (aiPlan.pattern_name ? `Hoy trabaja con suavidad el patrón “${aiPlan.pattern_name}”. No lo pelees: obsérvalo, nómbralo y da un paso pequeño distinto.` : msg);
  return (
    <section className="app-card p-5 bg-brand-soft relative overflow-hidden">
      <div className="absolute -right-6 -top-6 text-7xl opacity-10">✨</div>
      <div className="relative">
        <div className="text-[11px] uppercase tracking-widest font-bold text-primary flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Palabras para ti hoy
        </div>
        <h3 className="font-display font-bold text-[17px] mt-2 leading-snug">{name}, esto es lo que necesitas escuchar</h3>
        <p className="mt-2 text-sm leading-relaxed text-foreground/85">"{personalized}"</p>
        <p className="mt-3 text-[11px] text-muted-foreground italic">— Ruth Esther, desde el método ORIGEN</p>
      </div>
    </section>
  );
}


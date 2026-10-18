import { createFileRoute, Link } from "@tanstack/react-router";
import { wholeHojas } from "@/lib/gems";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { HealingTree } from "@/components/HealingTree";
import { DailyReflection } from "@/components/DailyReflection";
import { DailyQuiz } from "@/components/DailyQuiz";
import { DailyExercises } from "@/components/DailyExercises";
import { CategoriaSlider } from "@/components/CategoriaSlider";
import { ManifestacionSlider } from "@/components/ManifestacionSlider";
import { SonidosHome } from "@/components/SonidosHome";
import { PalabrasHoy } from "@/components/PalabrasHoy";
import { BibliotecaSlider } from "@/components/BibliotecaSlider";
import { PrimerosPasos } from "@/components/PrimerosPasos";
import { GuidedTour } from "@/components/GuidedTour";
import { useEffect } from "react";
import { toast } from "sonner";
import { checkLocalReminder, showLocalNotification } from "@/lib/notifications";
import { celebrateOnce, milestoneMessage } from "@/lib/celebrate";


import { DailyGames } from "@/components/games/DailyGames";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowRight, Flame,
  Layers, Lock, Sparkles, Trophy,
} from "lucide-react";
import pilarMentora from "@/assets/pilar-mentora.png";
import pilarPareja from "@/assets/pilar-pareja.png";
import pilarPatron from "@/assets/pilar-patron.png";
import pilarMinistracion from "@/assets/dios-te-dice-hoy.png";
import visualizaBanner from "@/assets/visualiza-banner-home-v2.png";
import afiliacionBanner from "@/assets/afiliacion-origen-home.png";
import { FEATURED_EXPLORE } from "@/lib/explore-content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [
    { title: "Hoy — ORIGEN" },
    { name: "description", content: "Tu misión diaria, ejercicios, racha y contenido recomendado dentro de ORÍGEN." },
    { property: "og:title", content: "Hoy — ORIGEN" },
    { property: "og:description", content: "Tu home diaria con misión, racha, ejercicios y contenido de ORÍGEN." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
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

  // Recordatorio de inactividad + celebración de hitos reales
  useEffect(() => {
    const reminder = checkLocalReminder();
    if (!reminder) return;
    toast(reminder.title, { description: reminder.body });
    showLocalNotification(reminder).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (activeCount <= 0) return;
    const msg = milestoneMessage(activeCount);
    if (!msg) return;
    if (celebrateOnce(`racha-${activeCount}`)) toast.success("¡Hito alcanzado!", { description: msg });
  }, [activeCount]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-aura-top">
      <GuidedTour />
      <div className="relative z-10 max-w-lg lg:max-w-4xl mx-auto px-4 pt-4 pb-10 space-y-4">
        {/* Greeting ahora vive en el header móvil deslizante */}

        {/* Primeros pasos — solo mientras falte algo */}
        <PrimerosPasos />

        <HomeHero
          name={displayName}
          stage={Math.min(20, completed + 1)}
          total={20}
          to={hasOnboarding ? "/etapas" : "/onboarding"}
        />
        <OrigenPillars />
        <DailyExerciseBanner done={streakDates.has(todayIso())} streak={activeCount} />
        <DigitalLibraryCarousel />
        <DailyMessageBanner name={displayName} />
        <OrigenCommunityBanner />
        <HealingTree bannerImage={arbolImg} />
        <HealingPracticesCarousel />
        <VisualizeAndLiveCarousel />
        <DailyGamesSection />

        {/* Contenido adicional existente */}
        <CategoriaSlider />
        <ManifestacionSlider />
        <SonidosHome />
        <DailyReflection />
        <DailyQuiz />







        {/* Explora todo el contenido de ORÍGEN */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-bold text-[15px]">Explora todo el contenido de ORÍGEN</h3>
            <Link to="/explorar" className="text-[11px] font-semibold text-primary inline-flex items-center gap-1">
              Explorar <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="hairline-brand mb-3" />
          <div className="grid grid-cols-2 gap-3">
            {FEATURED_EXPLORE.map((item) => (
              <Link key={item.title} to={item.locked ? "/membresia" : item.to} className="overflow-hidden rounded-[16px] bg-card border border-border shadow-soft active:scale-[.99] transition">
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  <img src={item.image} alt={item.title} loading="lazy" className={cn("h-full w-full object-cover", item.locked && "opacity-55")} />
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-[10px] bg-background/85 px-2 py-1 text-[10px] font-black text-primary">
                    {item.locked ? <Lock className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />} {item.tag}
                  </span>
                </div>
                <div className="p-3">
                  <h4 className="font-display font-bold text-[14px] leading-tight">{item.title}</h4>
                  <p className="text-[12px] text-muted-foreground mt-1 leading-snug">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Invita y gana */}
        <Link
          to="/invita"
          aria-label="Afiliación ORIGEN — gana el 70% al compartir"
          className="block rounded-[24px] overflow-hidden shadow-soft hover:shadow-glow transition-all hover-scale"
        >
          <img src={afiliacionBanner} alt="Afiliación ORIGEN — Gana el 70% de ganancias al compartir ORIGEN" loading="lazy" className="w-full h-auto block" />
        </Link>

        {/* Premios */}
        <Link to="/comprarmonedas" className="app-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F7B955]/20 grid place-items-center text-[#F7B955]">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Comprar monedas</p>
            <p className="font-display font-bold text-base">{wholeHojas(data?.profile?.gems)} 🍃</p>
          </div>
          <span className="text-xs font-bold text-primary">Recargar</span>
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





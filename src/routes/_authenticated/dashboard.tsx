import { createFileRoute } from "@tanstack/react-router";
import { wholeHojas } from "@/lib/gems";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { HealingTree } from "@/components/HealingTree";
import { getTodayExercise } from "@/lib/ejercicios365";
import { SonidosHome } from "@/components/SonidosHome";
import { PrimerosPasos } from "@/components/PrimerosPasos";
import { GuidedTour } from "@/components/GuidedTour";
import { useEffect } from "react";
import { toast } from "sonner";
import { checkLocalReminder, showLocalNotification } from "@/lib/notifications";
import { celebrateOnce, milestoneMessage } from "@/lib/celebrate";


import { InstallAppButton } from "@/components/InstallAppGuide";
import { HomeHero, OrigenPillars, DailyExerciseBanner, DigitalLibraryCarousel, DailyMessageBanner, OrigenCommunityBanner, HealingPracticesCarousel, VisualizeAndLiveCarousel, DailyGamesSection, ExploreOrigen, AffiliateBanner, BalanceCard } from "@/components/home/HomeSections";
import arbolImg from "@/assets/home/arbol.jpg";

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

  const exRef = `ex-${getTodayExercise().day}`;
  const { data: exerciseDone } = useQuery({
    queryKey: ["daily_exercise_today", user?.id, exRef],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("daily_activity").select("id").eq("user_id", user!.id)
        .eq("activity_type", "exercise_completed").eq("activity_date", todayIso()).eq("reference_id", exRef).maybeSingle();
      return !!data;
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
        <DailyExerciseBanner done={!!exerciseDone} streak={activeCount} />
        <DigitalLibraryCarousel />
        <DailyMessageBanner name={displayName} />
        <OrigenCommunityBanner />
        <HealingTree bannerImage={arbolImg} />
        <HealingPracticesCarousel />
        <VisualizeAndLiveCarousel />
        <SonidosHome />
        <DailyGamesSection />
        <ExploreOrigen />
        <AffiliateBanner />
        <InstallAppButton label="Instalar ORÍGEN en mi celular" />
        <BalanceCard hojas={wholeHojas(data?.profile?.gems)} />
      </div>
    </div>
  );
}


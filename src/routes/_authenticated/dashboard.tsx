import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/spiritual-hero.jpg";
import dailyImg from "@/assets/daily-devotional.jpg";
import stageImg from "@/assets/stage-journey.jpg";
import exerciseImg from "@/assets/prayer-exercise.jpg";
import { ArrowRight, BookHeart, CalendarDays, CheckCircle2, Clock3, Compass, Flame, Layers, MessageCircle, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Hoy — Reconectando" }] }),
  component: Dashboard,
});

const FALLBACK_DEVOTIONAL = {
  quote: "El patrón se rompe contigo cuando decides caminar con verdad.",
  scripture: "Juan 8:32",
  word: "Libertad",
  reflection: "Lo que reconoces con humildad puede ser sanado con gracia. No temas mirar tu historia con Dios al lado.",
  challenge: "Nombra un patrón que deseas romper y ora por dirección.",
};

const IMAGE_MAP: Record<string, string> = { hero: heroImg, daily: dailyImg, journey: stageImg, exercise: exerciseImg };

function dayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["dashboard", user?.id, todayIso()],
    enabled: !!user,
    queryFn: async () => {
      const todayNumber = ((dayOfYear() - 1) % 7) + 1;
      const [profile, diag, progress, journal, msgs, devotional, activities, completions, dailyExercise] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
        supabase.from("diagnostic_results").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("stage_progress").select("stage_id,status").eq("user_id", user!.id),
        supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("daily_devotionals").select("*").eq("day_of_year", todayNumber).maybeSingle(),
        supabase.from("daily_activity").select("*").eq("user_id", user!.id).eq("activity_date", todayIso()),
        supabase.from("exercise_completions").select("exercise_id,created_at").eq("user_id", user!.id),
        supabase.from("exercises").select("*").eq("day_index", todayNumber).order("sort_order").limit(1).maybeSingle(),
      ]);
      return {
        profile: profile.data,
        diagnostic: diag.data,
        progressItems: progress.data ?? [],
        journalCount: journal.count ?? 0,
        msgCount: msgs.count ?? 0,
        devotional: devotional.data,
        activities: activities.data ?? [],
        completions: completions.data ?? [],
        dailyExercise: dailyExercise.data,
      };
    },
  });

  const completed = (data?.progressItems ?? []).filter((p) => p.status === "completed").length;
  const pct = Math.round((completed / 8) * 100);
  const firstName = data?.profile?.full_name?.split(" ")[0] ?? "Hermano";
  const devotional = data?.devotional ?? FALLBACK_DEVOTIONAL;
  const devotionalDone = (data?.activities ?? []).some((a: any) => a.activity_type === "devotional");
  const exerciseDone = data?.dailyExercise ? (data?.completions ?? []).some((c: any) => c.exercise_id === data.dailyExercise.id) : false;
  const devotionalImage = IMAGE_MAP[(data?.devotional as any)?.image_key ?? "daily"] ?? dailyImg;

  async function markDevotionalDone() {
    if (!user) return;
    await supabase.from("daily_activity").upsert({
      user_id: user.id,
      activity_date: todayIso(),
      activity_type: "devotional",
      reference_id: String(dayOfYear()),
      metadata: { word: devotional.word },
    }, { onConflict: "user_id,activity_date,activity_type,reference_id" });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  return (
    <div className="px-4 py-5 md:p-10 max-w-6xl mx-auto mobile-safe-bottom lg:pb-10">
      <section className="relative overflow-hidden rounded-[2rem] min-h-[360px] p-5 sm:p-8 text-primary-foreground shadow-glow">
        <img src={heroImg} alt="Biblia abierta al amanecer" width={1280} height={1600} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/35 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-end min-h-[310px]">
          <span className="w-fit inline-flex items-center gap-2 rounded-full bg-background/15 backdrop-blur-xl border border-primary-foreground/20 px-3 py-1 text-[11px] font-bold text-gold"><Flame className="w-3.5 h-3.5" /> {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</span>
          <h1 className="mt-4 font-display font-extrabold text-4xl md:text-5xl">Hola, {firstName}.</h1>
          <p className="mt-2 text-primary-foreground/82 max-w-xl">Hoy tienes palabra, reto, ejercicio y una ruta espiritual para seguir avanzando sin perder tu progreso.</p>
        </div>
      </section>

      {!data?.diagnostic && (
        <Link to="/diagnostico">
          <Card className="mt-5 p-5 border-primary/30 bg-primary/8 hover:bg-primary/12 transition-colors flex items-center justify-between rounded-[1.7rem]">
            <div>
              <div className="text-xs uppercase tracking-widest text-primary font-bold">Obligatorio para personalizar</div>
              <h2 className="mt-1 font-display font-bold text-lg">Realiza tu Diagnóstico Espiritual Inicial</h2>
              <p className="text-sm text-muted-foreground mt-1">La app desbloquea y recomienda etapas según tu resultado.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-primary" />
          </Card>
        </Link>
      )}

      <section className="mt-5 grid lg:grid-cols-[1.1fr_0.9fr] gap-5">
        <Card className="overflow-hidden rounded-[2rem] border-border shadow-soft">
          <img src={devotionalImage} alt="Devocional del día" width={1024} height={1024} loading="lazy" className="h-48 w-full object-cover" />
          <div className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-primary font-extrabold">Palabra del día</div>
                <h2 className="font-display font-extrabold text-3xl mt-1">{devotional.word}</h2>
              </div>
              {devotionalDone && <div className="rounded-full bg-accent text-accent-foreground px-3 py-1 text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Hecho</div>}
            </div>
            <p className="scripture mt-4 text-xl leading-snug">“{devotional.quote}”</p>
            <p className="text-sm text-primary font-bold mt-2">{devotional.scripture}</p>
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{devotional.reflection}</p>
            <div className="mt-5 rounded-3xl bg-secondary/70 p-4 text-sm"><span className="font-bold">Reto:</span> {devotional.challenge}</div>
            <Button onClick={markDevotionalDone} disabled={devotionalDone} className="mt-5 w-full rounded-full bg-primary">
              {devotionalDone ? "Devocional registrado" : "Marcar devocional de hoy"}
            </Button>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5 rounded-[2rem] shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Progreso de etapas</div>
                <div className="mt-1 font-display font-extrabold text-4xl">{completed}<span className="text-base text-muted-foreground"> / 8</span></div>
              </div>
              <div className="w-14 h-14 rounded-3xl bg-primary/10 text-primary grid place-items-center"><Layers className="w-6 h-6" /></div>
            </div>
            <Progress value={pct} className="mt-4" />
            <Link to="/etapas"><Button variant="outline" className="mt-4 w-full rounded-full">Ver mis etapas</Button></Link>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] shadow-soft">
            <img src={exerciseImg} alt="Ejercicio espiritual del día" width={1024} height={1024} loading="lazy" className="h-36 w-full object-cover" />
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-primary font-extrabold">Ejercicio de hoy</div>
                {exerciseDone && <CheckCircle2 className="w-5 h-5 text-accent-foreground" />}
              </div>
              <h2 className="font-display font-bold text-xl mt-1">{data?.dailyExercise?.title ?? "Respira y ora"}</h2>
              <p className="text-sm text-muted-foreground mt-2">{data?.dailyExercise?.description ?? "Una práctica breve para volver al centro."}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="w-3.5 h-3.5" /> {data?.dailyExercise?.duration_minutes ?? 8} min</div>
              <Link to="/ejercicios"><Button className="mt-4 w-full rounded-full bg-primary">Abrir ejercicios</Button></Link>
            </div>
          </Card>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ActionCard to="/chat" icon={<MessageCircle className="w-5 h-5" />} title="Consultor IA" desc={`${data?.msgCount ?? 0} mensajes`} />
        <ActionCard to="/diario" icon={<BookHeart className="w-5 h-5" />} title="Diario" desc={`${data?.journalCount ?? 0} entradas`} />
        <ActionCard to="/diagnostico" icon={<Compass className="w-5 h-5" />} title="Diagnóstico" desc={data?.diagnostic ? data.diagnostic.level : "Pendiente"} />
        <ActionCard to="/membresia" icon={<Sparkles className="w-5 h-5" />} title="WhatsApp" desc="Soporte y comunidad" />
      </section>
    </div>
  );
}

function ActionCard({ to, icon, title, desc }: { to: any; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to}>
      <Card className="h-full p-4 rounded-[1.5rem] hover:border-primary transition-colors shadow-soft">
        <div className="w-11 h-11 rounded-2xl bg-primary/10 grid place-items-center text-primary">{icon}</div>
        <h3 className="mt-3 font-display font-bold text-base">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{desc}</p>
      </Card>
    </Link>
  );
}
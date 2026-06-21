import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Compass, Layers, MessageCircle, BookHeart, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Inicio — Reconectando" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [profile, diag, progress, journal, msgs] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
        supabase.from("diagnostic_results").select("id,level,recommended_plan,created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("stage_progress").select("stage_id,status").eq("user_id", user!.id),
        supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
      ]);
      return {
        profile: profile.data,
        diagnostic: diag.data,
        progressItems: progress.data ?? [],
        journalCount: journal.count ?? 0,
        msgCount: msgs.count ?? 0,
      };
    },
  });

  const completed = (data?.progressItems ?? []).filter(p => p.status === "completed").length;
  const pct = Math.round((completed / 8) * 100);
  const firstName = data?.profile?.full_name?.split(" ")[0] ?? "Hermano";

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="rounded-3xl bg-divine text-white p-8 md:p-10 shadow-glow">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-gold"><Sparkles className="w-3 h-3" /> Bienvenido de vuelta</span>
        <h1 className="mt-4 font-display text-3xl md:text-4xl">Hola, {firstName}.</h1>
        <p className="mt-2 text-white/75 max-w-xl">El patrón se rompe contigo. Hoy es un buen día para dar el siguiente paso.</p>
        <p className="mt-4 scripture text-gold/90">"Por fe andamos, no por vista." — 2 Corintios 5:7</p>
      </div>

      {!data?.diagnostic && (
        <Link to="/diagnostico">
          <Card className="mt-6 p-6 border-gold/40 bg-gold/5 hover:bg-gold/10 transition-colors flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-gold">Comienza aquí</div>
              <h3 className="mt-1 font-display text-lg">Realiza tu Diagnóstico Espiritual Inicial</h3>
              <p className="text-sm text-muted-foreground mt-1">10 preguntas. Recibirás un plan personalizado.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gold" />
          </Card>
        </Link>
      )}

      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Etapa actual</div>
          <div className="mt-1 font-display text-3xl">{data?.profile?.current_stage ?? 1} <span className="text-base text-muted-foreground">/ 8</span></div>
          <Progress value={pct} className="mt-4" />
          <div className="text-xs text-muted-foreground mt-2">{completed} completadas</div>
        </Card>
        <Card className="p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Días consecutivos</div>
          <div className="mt-1 font-display text-3xl">{data?.profile?.consecutive_days ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-2">Sigue ahí. La constancia transforma.</div>
        </Card>
        <Card className="p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Diario</div>
          <div className="mt-1 font-display text-3xl">{data?.journalCount ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-2">Entradas escritas</div>
        </Card>
      </div>

      <h2 className="mt-10 font-display text-xl">Continúa tu camino</h2>
      <div className="mt-4 grid md:grid-cols-3 gap-4">
        <ActionCard to="/chat" icon={<MessageCircle className="w-5 h-5" />} title="Habla con el Consultor IA" desc="Comparte lo que sientes hoy." />
        <ActionCard to="/etapas" icon={<Layers className="w-5 h-5" />} title="Avanza una etapa" desc="Tu progreso te espera." />
        <ActionCard to="/diario" icon={<BookHeart className="w-5 h-5" />} title="Escribe en tu diario" desc="Oración, gratitud, reflexión." />
        <ActionCard to="/ejercicios" icon={<Compass className="w-5 h-5" />} title="Ejercicio guiado" desc="Perdón, sanidad, identidad." />
      </div>
    </div>
  );
}

function ActionCard({ to, icon, title, desc }: { to: any; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to}>
      <Card className="p-6 h-full hover:border-gold transition-colors group">
        <div className="w-10 h-10 rounded-lg bg-primary/5 grid place-items-center text-primary group-hover:bg-gold/15 group-hover:text-gold transition-colors">{icon}</div>
        <h3 className="mt-4 font-display text-base">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{desc}</p>
      </Card>
    </Link>
  );
}

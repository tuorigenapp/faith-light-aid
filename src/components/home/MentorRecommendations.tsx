import { Link } from "@tanstack/react-router";
import { ChevronRight, Compass, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { recommendationsFor, useToolsPref } from "@/lib/tools-preference";

const LABEL = { audio: "audios, respiración y afirmaciones", practica: "ejercicios prácticos y reflexión", fe: "enseñanza de fe y sabiduría interior" } as const;

/** Lo que tus mentoras te sugieren hoy, según cómo prefieres recibir tus herramientas. */
export function MentorRecommendations() {
  const { user } = useAuth();
  const { data: pref, isLoading } = useToolsPref(user?.id);
  if (isLoading) return <div className="h-40 animate-pulse rounded-[16px] bg-muted" />;
  const recs = recommendationsFor(pref ?? null).slice(0, 4);
  return (
    <section className="rounded-[16px] bg-card p-4 shadow-soft" aria-labelledby="mentor-recs">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-primary/10 text-primary"><Compass className="h-5 w-5" /></span>
        <div className="min-w-0">
          <h2 id="mentor-recs" className="font-display text-[17px] font-bold leading-tight">Tus mentoras te recomiendan hoy</h2>
          <p className="text-[13px] text-muted-foreground">{pref ? `Porque prefieres ${LABEL[pref]}.` : "Para avanzar más rápido en tu camino."}</p>
        </div>
      </div>
      <ul className="mt-3 grid gap-2">
        {recs.map((r) => (
          <li key={r.to + r.title}>
            <Link to={r.to as never} className={`flex min-h-14 items-center gap-3 rounded-[12px] px-3 py-2.5 transition active:scale-[.98] ${r.urgent ? "border-2 border-primary bg-primary/5" : "bg-muted/60"}`}>
              <Sparkles className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-semibold leading-tight">{r.title}{r.urgent && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10.5px] font-bold text-primary-foreground">Hoy primero</span>}</span>
                <span className="block text-[12.5px] text-muted-foreground">{r.body}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

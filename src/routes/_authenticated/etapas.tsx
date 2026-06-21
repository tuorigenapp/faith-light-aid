import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/etapas")({
  head: () => ({ meta: [{ title: "8 Etapas — Reconectando" }] }),
  component: Etapas,
});

function Etapas() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["etapas", user?.id],
    queryFn: async () => {
      const [stages, progress] = await Promise.all([
        supabase.from("stages").select("*").order("id"),
        user ? supabase.from("stage_progress").select("*").eq("user_id", user.id) : Promise.resolve({ data: [] }),
      ]);
      return { stages: stages.data ?? [], progress: progress.data ?? [] };
    },
  });

  const progressMap = new Map((data?.progress ?? []).map((p: any) => [p.stage_id, p]));

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl">Programa de Transformación</h1>
      <p className="text-muted-foreground mt-2">8 etapas para sanar el linaje, renovar la identidad y caminar en propósito.</p>

      <div className="mt-8 space-y-3">
        {(data?.stages ?? []).map((s: any, i: number) => {
          const p = progressMap.get(s.id);
          const status = p?.status ?? (i === 0 ? "available" : "locked");
          const completed = status === "completed";
          return (
            <Link key={s.id} to="/etapas/$stageId" params={{ stageId: String(s.id) }}>
              <Card className={cn("p-6 flex items-start gap-5 hover:border-gold transition-colors",
                completed && "border-gold/50 bg-gold/5"
              )}>
                <div className={cn("shrink-0 w-12 h-12 rounded-full grid place-items-center text-white font-display",
                  completed ? "bg-gold text-gold-foreground" : "bg-divine"
                )}>
                  {completed ? <Check className="w-5 h-5" /> : s.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-gold">Etapa {s.id}</div>
                  <h3 className="font-display text-lg mt-0.5">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{s.subtitle}</p>
                  <p className="scripture text-xs text-muted-foreground/80 mt-2">"{s.scripture}" — {s.scripture_reference}</p>
                </div>
                {status === "locked" && <Lock className="w-4 h-4 text-muted-foreground" />}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

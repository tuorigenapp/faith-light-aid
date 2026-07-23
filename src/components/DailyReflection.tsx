import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { awardGems } from "@/lib/gems";
import { Heart, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { key: string; label: string; response: string };
function todayIso() { return new Date().toISOString().slice(0, 10); }

export function DailyReflection() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [picked, setPicked] = useState<Option | null>(null);

  const { data: reflection } = useQuery({
    queryKey: ["daily_reflection", todayIso()],
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_reflections")
        .select("*")
        .eq("day", todayIso())
        .maybeSingle();
      return data as { question: string; options: Option[] } | null;
    },
  });

  const { data: done } = useQuery({
    queryKey: ["daily_reflection_done", user?.id, todayIso()],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("daily_activity")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("activity_type", "reflection_done")
        .eq("activity_date", todayIso());
      return (count ?? 0) > 0;
    },
  });

  async function pick(opt: Option) {
    if (!user || done || picked) return;
    setPicked(opt);
    await supabase.from("daily_activity").insert({
      user_id: user.id,
      activity_type: "reflection_done",
      activity_date: todayIso(),
      reference_id: opt.key,
      metadata: { key: opt.key } as never,
    });
    await awardGems(5, "Reflexión del día");
    qc.invalidateQueries({ queryKey: ["profile"] });
    qc.invalidateQueries({ queryKey: ["daily_reflection_done"] });
  }

  if (!reflection) return null;

  return (
    <div className="app-card p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-[#F58BCB]/15 grid place-items-center">
          <Heart className="w-4 h-4 text-[#F58BCB]" fill="currentColor" />
        </div>
        <span className="text-[11px] uppercase tracking-widest font-bold text-primary">Reflexión de hoy</span>
      </div>
      <h3 className="font-display font-bold text-[17px] leading-snug mb-4">{reflection.question}</h3>

      {!picked && !done && (
        <div className="space-y-2">
          {reflection.options.map((o) => (
            <button
              key={o.key}
              onClick={() => pick(o)}
              className="w-full text-left px-4 py-3 rounded-[14px] border border-border bg-white hover:border-primary/40 hover:bg-secondary/40 transition text-sm font-medium"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {(picked || done) && (
        <div className={cn("rounded-[14px] bg-secondary/60 p-4 border border-primary/15", picked && "animate-in fade-in")}>
          <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1">
            <Check className="w-3.5 h-3.5" /> Gracias por compartir
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed">
            {picked?.response ?? "Ya reflexionaste hoy. Vuelve mañana para una nueva pregunta."}
          </p>
        </div>
      )}
    </div>
  );
}

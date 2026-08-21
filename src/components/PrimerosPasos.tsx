import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

const STEPS = [
  { key: "diagnostico", label: "Completa tu diagnóstico", to: "/diagnostico" as const },
  { key: "palabra", label: "Abre la Palabra de hoy", to: "/palabra" as const },
  { key: "arbol", label: "Agrega 1 familiar a tu árbol", to: "/arbol" as const },
  { key: "camino", label: "Haz el Día 1 de tu camino", to: "/etapas" as const },
  { key: "diario", label: "Escribe tu primera entrada", to: "/diario" as const },
];

const CLOSED_KEY = "origen_primeros_pasos_cerrado";

export function PrimerosPasos() {
  const { user } = useAuth();
  const [closed, setClosed] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem(CLOSED_KEY) === "1" : false,
  );
  const [min, setMin] = useState(false);

  const { data } = useQuery({
    queryKey: ["primeros-pasos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [diag, family, journal, progress, activity] = await Promise.all([
        supabase.from("diagnostic_results").select("id").eq("user_id", user!.id).limit(1),
        supabase.from("family_members").select("id").eq("user_id", user!.id).limit(1),
        supabase.from("journal_entries").select("id").eq("user_id", user!.id).is("deleted_at", null).limit(1),
        supabase.from("stage_progress").select("id").eq("user_id", user!.id).eq("status", "completed").limit(1),
        supabase.from("daily_activity").select("activity_type").eq("user_id", user!.id).eq("activity_type", "palabra").limit(1),
      ]);
      return {
        diagnostico: (diag.data ?? []).length > 0,
        arbol: (family.data ?? []).length > 0,
        diario: (journal.data ?? []).length > 0,
        camino: (progress.data ?? []).length > 0,
        palabra: (activity.data ?? []).length > 0,
      } as Record<string, boolean>;
    },
  });

  if (closed || !data) return null;
  const done = STEPS.filter((s) => data[s.key]).length;
  if (done === STEPS.length) return null;

  return (
    <section className="rounded-[16px] border border-border/60 bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-widest text-primary">Primeros pasos</p>
          <h3 className="mt-0.5 font-display text-[17px] font-bold">
            {done} de {STEPS.length} listos
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMin((m) => !m)}
            aria-label={min ? "Mostrar pasos" : "Minimizar"}
            className="grid h-11 w-11 place-items-center rounded-full hover:bg-secondary"
          >
            <ChevronDown className={`h-5 w-5 transition ${min ? "-rotate-90" : ""}`} />
          </button>
          <button
            onClick={() => {
              localStorage.setItem(CLOSED_KEY, "1");
              setClosed(true);
            }}
            aria-label="Cerrar primeros pasos"
            className="grid h-11 w-11 place-items-center rounded-full hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${Math.max(8, (done / STEPS.length) * 100)}%` }}
        />
      </div>

      {!min && (
        <div className="mt-4 space-y-2">
          {STEPS.map((s) => {
            const ok = data[s.key];
            return (
              <Link
                key={s.key}
                to={s.to}
                className="flex min-h-11 items-center gap-3 rounded-[10px] px-1 text-sm font-medium hover:bg-secondary"
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                    ok ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                  }`}
                >
                  {ok ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </span>
                <span className={ok ? "text-muted-foreground line-through" : ""}>{s.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

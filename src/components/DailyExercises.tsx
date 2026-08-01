import { useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { awardGems } from "@/lib/gems";
import { Check, Dumbbell, Timer, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const POOL: { title: string; body: string; minutes: number }[] = [
  { title: "Respiración 3·6·9", body: "Inhala 3, sostén 6, exhala 9. Nueve rondas antes de responderle a alguien.", minutes: 3 },
  { title: "Carta que no envías", body: "Escríbele 10 líneas a quien te dolió. No la envías: la sueltas.", minutes: 7 },
  { title: "Espejo sin crítica", body: "60 segundos mirándote a los ojos. Repite: “soy digna de amor sin condiciones”.", minutes: 2 },
  { title: "Devolver cargas", body: "Nombra en voz alta una carga familiar y di: “esto no es mío, lo devuelvo con respeto”.", minutes: 4 },
  { title: "Tres gracias difíciles", body: "Agradece 3 cosas que hoy te costaron. Ahí está la lección.", minutes: 3 },
  { title: "Límite de la semana", body: "Escribe un límite concreto y a quién se lo vas a sostener.", minutes: 5 },
  { title: "Abrazo al niño de 7", body: "Cierra los ojos, mírate de niño y dile lo que necesitabas escuchar.", minutes: 6 },
  { title: "Silencio con mano al pecho", body: "Tres minutos de silencio, mano en el corazón, respirando lento.", minutes: 3 },
  { title: "Nombrar la emoción", body: "“Hoy me sentí ___ porque ___. Y está bien.” Sin corregir, sin justificar.", minutes: 4 },
  { title: "Oración escrita de cierre", body: "Entrega por escrito lo que hoy no puedes controlar.", minutes: 5 },
  { title: "Postura de valor", body: "Dos minutos de pie, hombros atrás, respirando. Tu cuerpo enseña a tu mente.", minutes: 2 },
  { title: "Sin justificar el no", body: "Di un “no” hoy sin dar explicaciones. Solo observa cómo se siente.", minutes: 2 },
  { title: "Diez de tu presente", body: "Lista de 10 cosas que agradeces de tu vida hoy, no de la que quieres.", minutes: 5 },
  { title: "Foto familiar", body: "Mira una foto de familia y di: “gracias por lo que me dieron”.", minutes: 3 },
];

function todayIso() { return new Date().toISOString().slice(0, 10); }

/** Ejercicios que cambian todos los días (rotación determinista por fecha). */
export function DailyExercises() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const day = Math.floor(Date.now() / 86400000);
  const today = [0, 1, 2].map((i) => POOL[(day * 3 + i) % POOL.length]);
  const [busy, setBusy] = useState<string | null>(null);

  const { data: done = [], refetch } = useQuery({
    queryKey: ["daily_exercises", user?.id, todayIso()],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_activity")
        .select("reference_id")
        .eq("user_id", user!.id)
        .eq("activity_type", "exercise")
        .eq("activity_date", todayIso());
      return (data ?? []).map((d) => d.reference_id as string);
    },
  });

  async function complete(title: string) {
    if (!user || done.includes(title) || busy) return;
    setBusy(title);
    await supabase.from("daily_activity").upsert({
      user_id: user.id,
      activity_date: todayIso(),
      activity_type: "exercise",
      reference_id: title,
      metadata: { title } as never,
    }, { onConflict: "user_id,activity_date,activity_type,reference_id" });
    await awardGems(15, `Ejercicio: ${title}`);
    qc.invalidateQueries({ queryKey: ["profile"] });
    await refetch();
    setBusy(null);
  }

  const allDone = today.every((e) => done.includes(e.title));

  return (
    <section className="app-card p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest font-bold text-primary inline-flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5" /> Ejercicios de hoy
          </div>
          <h3 className="font-display font-bold text-[17px] mt-1 leading-tight">
            {allDone ? "Cerraste tus 3 ejercicios 🍃" : "Tres prácticas cortas para hoy"}
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-[12px] font-bold text-primary">
          {done.filter((d) => today.some((t) => t.title === d)).length}/3
        </span>
      </div>

      <div className="mt-3 space-y-2.5">
        {today.map((e, i) => {
          const isDone = done.includes(e.title);
          return (
            <button
              key={e.title}
              onClick={() => complete(e.title)}
              disabled={isDone}
              style={{ animation: `fade-in .35s ease-out ${i * 60}ms both` }}
              className={cn(
                "w-full text-left rounded-[16px] p-3.5 border transition active:scale-[.98]",
                isDone ? "border-[#3FBE8F]/45 bg-[#3FBE8F]/8" : "border-border bg-card hover:border-primary/40",
              )}
            >
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
                <span className={cn(
                  "w-10 h-10 rounded-[12px] grid place-items-center shrink-0",
                  isDone ? "bg-[#3FBE8F]/20 text-[#3FBE8F]" : "bg-primary/10 text-primary",
                )}>
                  {isDone ? <Check className="w-5 h-5" /> : <Timer className="w-5 h-5" />}
                </span>
                <span className="min-w-0">
                  <span className="block font-display font-bold text-[14px] leading-tight">{e.title}</span>
                  <span className="block text-[12.5px] text-muted-foreground mt-1 leading-snug">{e.body}</span>
                </span>
                <span className="shrink-0 text-[11px] font-bold text-muted-foreground">{e.minutes} min</span>
              </div>
            </button>
          );
        })}
      </div>

      <Link
        to="/ejercicios"
        className="mt-3 h-11 rounded-[12px] inline-flex w-full items-center justify-center gap-1.5 bg-primary/10 text-primary text-[13px] font-semibold active:scale-[.98] transition"
      >
        Ver todos los ejercicios <ArrowRight className="w-4 h-4" />
      </Link>
    </section>
  );
}

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Crown, Leaf, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CADENCES, PLAN_LEVELS, type Cadence } from "@/lib/plans-catalog";

const ICONS = { explorador: Sprout, caminante: Leaf, proposito: Crown } as const;

/** Planes sin precio: cada uno con su botón para probar gratis. */
export function FreePlansSection() {
  const [cad, setCad] = useState<Cadence>("annual");
  const per = CADENCES.find((c) => c.id === cad)!;
  return (
    <section className="mx-auto mt-12 max-w-5xl" aria-labelledby="free-plans-title">
      <p className="text-center text-[12px] font-bold uppercase tracking-widest text-primary">Elige cómo caminar</p>
      <h2 id="free-plans-title" className="mt-1 text-center font-display text-[26px] font-extrabold leading-tight sm:text-[32px]">Pruébalo gratis en el plan que va contigo</h2>
      <div role="tablist" aria-label="Forma de pago" className="mx-auto mt-5 grid max-w-sm grid-cols-3 gap-1 rounded-[12px] bg-muted p-1">
        {CADENCES.map((c) => (
          <Button key={c.id} variant="membershipPeriod" role="tab" aria-selected={cad === c.id} data-selected={cad === c.id} onClick={() => setCad(c.id)} className="h-11 rounded-[10px] text-[14px] font-semibold">{c.label}</Button>
        ))}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {PLAN_LEVELS.map((l) => {
          const Icon = ICONS[l.id];
          const pop = l.id === "caminante";
          return (
            <article key={l.id} className={`relative flex flex-col rounded-[16px] bg-card p-5 shadow-[0_1px_3px_rgba(30,25,20,.06)] ${pop ? "border-2 border-primary" : "border border-border/60"}`}>
              {pop && <span className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground">Más elegido</span>}
              <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-3 font-display text-[18px] font-extrabold">{l.name}</h3>
              <p className="text-[13px] text-muted-foreground">{l.claim} · pago por {per.per}</p>
              <ul className="mt-4 grid flex-1 gap-2">
                {l.includes.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-[14px]"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/12 text-primary"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>{t}</li>
                ))}
              </ul>
              <Link to="/empezar" className="mt-5 grid h-[52px] place-items-center rounded-[12px] bg-cta-green text-[16px] font-bold text-cta-green-foreground shadow-[0_4px_14px_color-mix(in_oklab,var(--cta-green)_30%,transparent)] transition active:scale-[.97]">
                Pruébalo GRATIS
              </Link>
            </article>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[13px] text-muted-foreground">Empiezas sin pagar · cancelas cuando quieras · te avisamos antes de cualquier cobro</p>
    </section>
  );
}

import { useState } from "react";
import { CalendarClock, Check, HeartHandshake, ShieldCheck } from "lucide-react";
import { CADENCES, OFF_PCT, PLAN_LEVELS, type Cadence, type PlanLevel } from "@/lib/plans-catalog";
import { longDate } from "@/lib/grace";
import { cn } from "@/lib/utils";

/** Pantalla especial de /membresia cuando el período de gracia está activo. */
export function GraceRenewal({ daysLeft, total, endsAt, current }: { daysLeft: number; total: number; endsAt: Date; current: PlanLevel | null }) {
  const [levelId, setLevelId] = useState<PlanLevel["id"]>(current?.id ?? "caminante");
  const [cad, setCad] = useState<Cadence>("annual");
  const level = PLAN_LEVELS.find((l) => l.id === levelId)!;
  const pct = OFF_PCT[cad];
  const price = level.usd[cad];
  const final = Math.round(price * (100 - pct)) / 100;
  const used = Math.min(100, Math.round(((total - daysLeft) / total) * 100));

  return (
    <section className="mx-auto max-w-[620px]">
      <div className="rounded-[16px] bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-[12px] bg-primary/10 text-primary"><CalendarClock className="h-6 w-6" /></span>
          <div>
            <p className="text-[12.5px] font-medium text-muted-foreground">Tu período de gracia está activo</p>
            <p className="font-display text-[28px] font-extrabold leading-tight">{daysLeft} {daysLeft === 1 ? "día restante" : "días restantes"}</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${used}%` }} /></div>
        <p className="mt-2 text-[13px] text-muted-foreground">Finaliza el {longDate(endsAt)}. Tu progreso de sanación sigue guardado.</p>
      </div>

      <h2 className="mt-7 font-display text-[22px] font-bold">Renovar mi membresía antes de que finalice mi período de gracia</h2>
      <p className="mt-1 text-[14px] text-muted-foreground">Descuento especial solo durante tu gracia: {OFF_PCT.annual}% anual y mensual · {OFF_PCT.weekly}% semanal.</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {PLAN_LEVELS.map((l) => (
          <button key={l.id} onClick={() => setLevelId(l.id)} className={cn("min-h-11 rounded-[10px] border-[1.5px] px-2 text-[12.5px] font-semibold transition active:scale-[.97]", l.id === levelId ? "border-primary bg-primary/10 text-primary" : "border-border bg-card")}>
            {l.name.replace(" ORÍGEN", "")}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3">
        {CADENCES.map((c) => {
          const p = level.usd[c.id]; const f = Math.round(p * (100 - OFF_PCT[c.id])) / 100;
          return (
            <button key={c.id} onClick={() => setCad(c.id)} className={cn("flex items-center justify-between rounded-[16px] bg-card p-4 text-left shadow-sm transition active:scale-[.98]", c.id === cad ? "ring-2 ring-primary" : "ring-1 ring-border")}>
              <div>
                <p className="text-[15px] font-semibold">{c.label}</p>
                <p className="text-[12.5px] text-muted-foreground"><s>US${p.toFixed(2)}</s> · {OFF_PCT[c.id]}% de descuento</p>
              </div>
              <p className="font-display text-[20px] font-extrabold text-primary">US${f.toFixed(2)}<span className="text-[12px] font-medium text-muted-foreground">/{c.per}</span></p>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-[16px] bg-card p-5 shadow-sm">
        <p className="flex items-center gap-2 text-[15px] font-semibold"><HeartHandshake className="h-5 w-5 text-primary" /> Vuelves a tener acceso a todo</p>
        <ul className="mt-3 grid gap-2">
          {level.includes.map((i) => (
            <li key={i} className="flex items-start gap-2 text-[14px]"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/12 text-primary"><Check className="h-3 w-3" /></span>{i}</li>
          ))}
        </ul>
      </div>

      <a href={level.off[cad]} className="mt-5 grid h-14 w-full place-items-center rounded-[12px] bg-cta-green text-[16px] font-bold text-cta-green-foreground shadow-md transition active:scale-[.97]">
        Renovar ahora por US${final.toFixed(2)}
      </a>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[12.5px] text-muted-foreground"><ShieldCheck className="h-4 w-4" /> Pago seguro por Hotmart · el monto final lo confirma Hotmart</p>
    </section>
  );
}

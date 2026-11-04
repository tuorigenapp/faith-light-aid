import { useState } from "react";
import { Check, Lock, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CADENCES, OFF_PCT, PLAN_LEVELS, type Cadence } from "@/lib/plans-catalog";
import { discounted, formatUsd } from "@/lib/currency";
import { longDate } from "@/lib/grace";

/** Pantalla única al terminar el período de gracia: sin salida hasta pagar o que el equipo lo quite. */
export function GraceLockScreen({ name, purgeAt, daysToPurge, onSignOut }: { name: string; purgeAt: Date; daysToPurge: number; onSignOut: () => void }) {
  const [cad, setCad] = useState<Cadence>("monthly");
  const per = CADENCES.find((c) => c.id === cad)!;
  return (
    <main className="min-h-dvh bg-aura-top px-4 pb-12 pt-10">
      <div className="mx-auto max-w-md">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary"><Lock className="h-9 w-9" /></span>
        <h1 className="mt-5 text-center font-display text-[30px] font-extrabold leading-tight">{name ? `${name}, tu` : "Tu"} período de gracia terminó</h1>
        <p className="mt-2 text-center text-[15px] leading-relaxed text-muted-foreground">Para seguir tu sanación con ORÍGEN necesitas activar tu plan. Antes, esto es lo que importa:</p>

        <section className="mt-6 rounded-[16px] border border-border/60 bg-card p-5 shadow-soft">
          <p className="flex items-center gap-2 font-display text-[18px] font-bold"><ShieldCheck className="h-5 w-5 text-cta-green dark:text-success" />No perdiste nada</p>
          <p className="mt-2 text-[15px] leading-relaxed">Tus etapas, tu diario, tu árbol y tus hojas <strong>quedan guardados hasta el {longDate(purgeAt)}</strong> ({daysToPurge} días). Si activas tu plan, sigues exactamente donde lo dejaste.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">Si no lo haces en ese plazo, tu progreso se borrará y tendrías que empezar de cero.</p>
        </section>

        <h2 className="mt-8 text-center font-display text-[20px] font-bold">Vuelve con tu descuento de gracia</h2>
        <div role="tablist" className="mt-3 grid grid-cols-3 gap-1 rounded-[12px] bg-muted p-1">
          {CADENCES.map((c) => <Button key={c.id} variant="membershipPeriod" role="tab" aria-selected={cad === c.id} data-selected={cad === c.id} onClick={() => setCad(c.id)} className="h-auto min-h-11 flex-col gap-0 rounded-[10px] text-[14px] font-semibold">{c.label}<span className="text-[11px] font-bold">-{OFF_PCT[c.id]}%</span></Button>)}
        </div>
        <div className="mt-4 grid gap-3">
          {PLAN_LEVELS.map((l) => {
            const price = discounted(l.usd[cad], OFF_PCT[cad]);
            return (
              <a key={l.id} href={l.off[cad]} target="_blank" rel="noopener" className={`block rounded-[16px] bg-card p-4 shadow-soft transition active:scale-[.98] ${l.id === "caminante" ? "border-2 border-primary" : "border border-border/60"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-[16px] font-extrabold">{l.name}</p>
                    <p className="text-[13px] text-muted-foreground"><s>{formatUsd(l.usd[cad])}</s> · ahorras {OFF_PCT[cad]}%</p>
                  </div>
                  <p className="shrink-0 font-display text-[22px] font-extrabold">{formatUsd(price)}<span className="text-[12px] font-semibold text-muted-foreground">/{per.per}</span></p>
                </div>
                <ul className="mt-2 grid gap-1">{l.perks.map((p) => <li key={p} className="flex items-center gap-2 text-[13.5px]"><Check className="h-4 w-4 text-primary" />{p}</li>)}</ul>
                <span className="mt-3 grid h-[52px] place-items-center rounded-[12px] bg-cta-green text-[16px] font-bold text-cta-green-foreground">Reanudar con {OFF_PCT[cad]}% de descuento</span>
              </a>
            );
          })}
        </div>
        <p className="mt-4 text-center text-[13px] text-muted-foreground">Pagas en Hotmart con el mismo correo de tu cuenta ORÍGEN. Al confirmarse el pago, el equipo reactiva tu acceso.</p>
        <p className="mt-2 text-center text-[13px] text-muted-foreground">¿Dudas? Escríbenos a <a className="font-semibold text-primary" href="mailto:supportorigenapp@gmail.com">supportorigenapp@gmail.com</a></p>
        <button onClick={onSignOut} className="mx-auto mt-6 flex min-h-11 items-center gap-2 text-[14px] font-semibold text-muted-foreground"><LogOut className="h-4 w-4" />Cerrar sesión</button>
      </div>
    </main>
  );
}

/** Aviso en los últimos días del período de gracia. */
export function GraceWarning({ day, total, daysLeft, endsAt }: { day: number; total: number; daysLeft: number; endsAt: Date }) {
  return (
    <div role="status" className="mx-auto mb-3 max-w-lg rounded-[16px] border-2 border-warning/60 bg-warning/10 p-4 lg:max-w-4xl">
      <p className="font-display text-[16px] font-bold">Día {day} de {total} de tu período de gracia</p>
      <p className="mt-1 text-[14px]">Te quedan {daysLeft} día(s). El {longDate(endsAt)} ORÍGEN se pausará hasta que gestiones tu pago. No perderás tu progreso.</p>
      <a href="/membresia" className="mt-3 grid h-12 place-items-center rounded-[12px] bg-cta-green text-[15px] font-bold text-cta-green-foreground">Gestionar mi pago ahora</a>
    </div>
  );
}

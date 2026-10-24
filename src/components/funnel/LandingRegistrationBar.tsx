import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Clock3, TicketPercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { registrationClock } from "@/lib/registration-clock";

export function LandingRegistrationBar() {
  const [clock, setClock] = useState<ReturnType<typeof registrationClock> | null>(null);
  useEffect(() => {
    const update = () => setClock(registrationClock(new Date()));
    update();
    const interval = window.setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return <aside aria-label="Registro y oferta ORÍGEN" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl motion-safe:animate-in motion-safe:slide-in-from-bottom-4">
    <div className="mx-auto w-full max-w-md">
      <div className="flex min-h-11 items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-foreground"><TicketPercent className="h-4 w-4 text-primary" />Oferta especial</span>
        <Button asChild variant="link" className="h-11 shrink-0 px-0 text-[13px] font-semibold"><Link to="/empezar" search={{ oferta: "especial" }}>Ver descuento<ArrowRight /></Link></Button>
      </div>
      <div className="mb-3 flex min-h-6 items-center justify-between gap-2 text-[12px] text-muted-foreground">
        <span className="inline-flex min-w-0 items-center gap-1.5"><CalendarDays className="h-4 w-4 shrink-0" />{clock ? <time dateTime={clock.dayKey}>{clock.date}</time> : <span aria-hidden className="h-4 w-40 animate-pulse rounded bg-muted" />}</span>
        <span title="Hora local de tu dispositivo" className="inline-flex shrink-0 items-center gap-1.5 rounded-[8px] bg-secondary px-2 py-1 font-semibold tabular-nums text-secondary-foreground"><Clock3 className="h-4 w-4" />{clock ? <time dateTime={clock.iso} aria-label={`Hora local: ${clock.time}`}>{clock.time}</time> : <span aria-hidden className="h-4 w-16 animate-pulse rounded bg-muted" />}</span>
      </div>
      <Button asChild className="h-14 w-full rounded-[12px] bg-gradient-to-r from-primary to-accent text-[16px] font-bold text-primary-foreground shadow-glow active:scale-[.97]"><Link to="/empezar">Probar gratis ahora<ArrowRight /></Link></Button>
    </div>
  </aside>;
}
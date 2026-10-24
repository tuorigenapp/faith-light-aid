import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgePercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import origenIcon from "@/assets/origen-o-icon.png";

export function LandingRegistrationBar() {
  return (
    <aside aria-label="Registro y oferta ORÍGEN" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-300">
      <div className="registration-dock pointer-events-auto mx-auto w-full max-w-[880px] rounded-[16px] border border-registration-border p-4 text-registration-foreground shadow-registration">
        <div className="grid items-center gap-x-6 md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex min-w-0 items-center gap-3">
            <img src={origenIcon} alt="" width={56} height={56} className="h-14 w-14 shrink-0 object-contain" />
            <div className="min-w-0">
              <p className="font-display text-[17px] font-bold leading-6">Tu cambio empieza aquí</p>
              <p className="text-[13px] leading-5 text-registration-muted">Evaluación gratis · 2 minutos</p>
            </div>
          </div>
          <Button asChild variant="registration" className="group mt-3 h-14 w-full justify-between rounded-[12px] px-5 text-[16px] font-bold transition-[background-color,transform] duration-150 active:scale-[.97] md:mt-0">
            <Link to="/empezar">Registrarme gratis<ArrowRight className="transition-transform duration-150 motion-safe:group-hover:translate-x-1" /></Link>
          </Button>
          <div className="mt-2 flex min-w-0 items-center justify-between gap-2 border-t border-registration-border pt-1 md:col-span-2">
            <span className="inline-flex min-w-0 items-center gap-2 text-[13px] font-medium text-registration-muted"><BadgePercent className="h-4 w-4 shrink-0" />Descuento disponible</span>
            <Button asChild variant="link" className="h-11 shrink-0 px-0 text-[14px] font-bold text-registration-foreground focus-visible:ring-registration-cta"><Link to="/empezar" search={{ oferta: "especial" }}>Ver oferta<ArrowRight /></Link></Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
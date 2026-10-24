import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function LandingRegistrationBar() {
  return (
    <aside aria-label="Registro y oferta ORÍGEN" className="registration-dock fixed inset-x-0 bottom-0 z-40 border-t border-registration-border px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 text-registration-foreground shadow-registration motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-300">
      <div className="mx-auto grid w-full max-w-[880px] items-center gap-3 md:grid-cols-[minmax(0,1fr)_320px] md:gap-8">
          <div className="text-center md:text-left">
            <p className="text-[14px] font-medium leading-5 text-registration-muted">Desbloquea tu</p>
            <p className="font-display text-[22px] font-bold leading-7">descuento especial</p>
          </div>
          <div className="mx-auto w-full max-w-md">
            <Button asChild variant="registration" className="registration-pulse h-14 w-full rounded-[12px] px-4 text-[16px] font-bold transition-[background-color,transform] duration-150 active:scale-[.97]">
              <Link to="/empezar" search={{ oferta: "especial" }}>Probar gratis ahora</Link>
            </Button>
            <p className="mt-2 text-center text-[12px] leading-4 text-registration-muted">Tu evaluación es gratis. Tú decides después.</p>
          </div>
      </div>
    </aside>
  );
}
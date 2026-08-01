import { Link } from "@tanstack/react-router";
import { ArrowRight, Eye, Flame, LayoutGrid } from "lucide-react";
import { CATEGORIAS, watching } from "@/lib/categorias";
import { cn } from "@/lib/utils";

/**
 * Slider horizontal de las nuevas categorías con alerta de fuego
 * y prueba social ("X personas están viendo esto ahora").
 */
export function CategoriaSlider({ title = "Nuevas categorías 🔥", showMore = true }: { title?: string; showMore?: boolean }) {
  return (
    <section>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 mb-2">
        <h3 className="font-display font-bold text-[15px] truncate">{title}</h3>
        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#F58BCB]/15 px-2.5 py-1 text-[11px] font-bold text-[#F58BCB]">
          <Flame className="w-3.5 h-3.5" /> Tendencia
        </span>
      </div>
      <div className="hairline-brand mb-3" />

      <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
        <ul className="flex gap-3 w-max pb-1">
          {CATEGORIAS.map((c, i) => {
            const w = watching(c);
            return (
              <li key={c.id} className="w-[264px] shrink-0" style={{ animation: `fade-in .4s ease-out ${i * 70}ms both` }}>
                <Link
                  to="/programas/$programaId"
                  params={{ programaId: c.programaId }}
                  aria-label={c.title}
                  className="block rounded-[16px] overflow-hidden bg-card border border-border shadow-soft active:scale-[.97] transition-transform"
                >
                  <div className="relative">
                    <img src={c.banner} alt={c.title} loading="lazy" className="w-full h-auto block" />
                    <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-[#1B1930]/75 backdrop-blur px-2.5 py-1 text-[11px] font-bold text-white">
                      <Flame className="w-3.5 h-3.5 text-[#F7B955]" /> {w.now} viendo ahora
                    </span>
                  </div>
                  <div className="p-3.5">
                    <h4 className="font-display font-bold text-[15px] leading-tight truncate">{c.title}</h4>
                    <p className="text-[12px] text-muted-foreground mt-1 inline-flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 shrink-0" />
                      {w.total.toLocaleString()} personas {c.hook}
                    </p>
                    <span className="mt-3 h-11 rounded-[12px] btn-primary-gradient text-white text-[13px] font-semibold inline-flex w-full items-center justify-center gap-1.5">
                      Comenzar ahora <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {showMore && (
        <Link
          to="/categorias"
          className={cn(
            "mt-3 w-full h-12 rounded-[12px] inline-flex items-center justify-center gap-2",
            "bg-primary/10 text-primary text-[14px] font-semibold active:scale-[.98] transition",
          )}
        >
          <LayoutGrid className="w-4 h-4" /> Ver más categorías
        </Link>
      )}
    </section>
  );
}

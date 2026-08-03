import { Link } from "@tanstack/react-router";
import { Eye, Flame, LayoutGrid, ArrowRight } from "lucide-react";
import { CAMINOS } from "@/lib/caminos";
import { CATEGORIAS, watching } from "@/lib/categorias";

/**
 * Slider horizontal de las categorías (caminos de 8 etapas diarias).
 * Solo el banner es visible y clicable — la imagen ya trae su propio botón.
 */
export function CategoriaSlider({ title = "Transformación diaria 🔥", showMore = true }: { title?: string; showMore?: boolean }) {
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
          {CAMINOS.map((c, i) => {
            const cat = CATEGORIAS.find((x) => x.id === c.id) ?? CATEGORIAS[0];
            const w = watching(cat);
            return (
              <li key={c.id} className="w-[264px] shrink-0" style={{ animation: `fade-in .4s ease-out ${i * 70}ms both` }}>
                <Link
                  to="/caminos/$caminoId"
                  params={{ caminoId: c.id }}
                  aria-label={c.title}
                  className="relative block rounded-[16px] overflow-hidden shadow-soft active:scale-[.97] transition-transform"
                >
                  <img src={c.banner} alt={c.title} loading="lazy" className="w-full h-auto block" />
                  <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-[#1B1930]/75 backdrop-blur px-2.5 py-1 text-[11px] font-bold text-white">
                    <Flame className="w-3.5 h-3.5 text-[#F7B955]" /> {w.now} viendo ahora
                  </span>
                  <span className="absolute bottom-2.5 left-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#1B1930]/70 backdrop-blur px-2.5 py-1 text-[10.5px] font-semibold text-white">
                    <Eye className="w-3 h-3 shrink-0" /> {w.total.toLocaleString()} personas {cat.hook}
                  </span>
                </Link>
              </li>
            );
          })}

          {showMore && (
            <li className="w-[168px] shrink-0">
              <Link
                to="/categorias"
                className="h-full app-card p-4 flex flex-col justify-between active:scale-[.97] transition-transform"
              >
                <span className="w-11 h-11 rounded-[12px] bg-primary/10 text-primary grid place-items-center">
                  <LayoutGrid className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-display font-bold text-[14.5px] leading-tight mt-3">Ver más categorías</h4>
                  <span className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary">
                    Explorar <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}

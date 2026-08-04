import { Link } from "@tanstack/react-router";
import { Flame, LayoutGrid, ArrowRight } from "lucide-react";
import { CAMINOS } from "@/lib/caminos";

/**
 * Carrusel a ancho completo de las categorías (mismo tamaño que los banners de pilares).
 * Solo la imagen es visible y clicable — sin superposiciones de texto.
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

      <div className="-mx-4 px-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
        <ul className="flex gap-3">
          {CAMINOS.map((c, i) => (
            <li
              key={c.id}
              className="w-[calc(100vw-2rem)] max-w-[520px] lg:w-[440px] shrink-0 snap-center"
              style={{ animation: `fade-in .4s ease-out ${i * 70}ms both` }}
            >
              <Link
                to="/caminos/$caminoId"
                params={{ caminoId: c.id }}
                aria-label={c.title}
                className="block rounded-[20px] overflow-hidden shadow-soft hover:shadow-glow transition-all active:scale-[.98]"
              >
                <img src={c.banner} alt={c.title} loading="lazy" className="w-full h-auto block" />
              </Link>
            </li>
          ))}

          {showMore && (
            <li className="w-[calc(100vw-2rem)] max-w-[520px] lg:w-[440px] shrink-0 snap-center">
              <Link
                to="/categorias"
                className="h-full min-h-[160px] app-card p-6 flex flex-col justify-between active:scale-[.98] transition-transform"
              >
                <span className="w-12 h-12 rounded-[12px] bg-primary/10 text-primary grid place-items-center">
                  <LayoutGrid className="w-6 h-6" />
                </span>
                <div>
                  <h4 className="font-display font-bold text-[18px] leading-tight mt-4">Ver todas las categorías</h4>
                  <span className="mt-2 inline-flex items-center gap-1 text-[13.5px] font-semibold text-primary">
                    Explorar <ArrowRight className="w-4 h-4" />
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

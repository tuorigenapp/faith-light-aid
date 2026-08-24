import { Link } from "@tanstack/react-router";
import { CAMINOS } from "@/lib/caminos";

/**
 * "Lo nuevo de ORIGEN": una imagen vertical por fila, sin textos superpuestos.
 * Cada imagen abre directamente su camino diario.
 */
export function CategoriaSlider() {
  return (
    <section>
      <h3 className="font-display font-bold text-[19px] leading-tight">Elige el dolor que quieres sanar</h3>
      <p className="text-[13px] text-muted-foreground mt-1">
        Cada día abre una práctica corta: entiendes algo, lo trabajas y lo cierras. Sin audios largos.
      </p>
      <div className="hairline-brand mt-3 mb-3" />

      <div className="space-y-3">
        {CAMINOS.map((c, i) => (
          <Link
            key={c.id}
            to="/caminos/$caminoId"
            params={{ caminoId: c.id }}
            aria-label={c.title}
            style={{ animation: `fade-in .4s ease-out ${i * 70}ms both` }}
            className="block rounded-[20px] overflow-hidden shadow-soft hover:shadow-glow transition-all active:scale-[.98]"
          >
            <img src={c.banner} alt={c.title} loading="lazy" className="w-full h-auto block" />
          </Link>
        ))}
      </div>
    </section>
  );
}

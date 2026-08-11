import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight } from "lucide-react";
import { CAMINOS } from "@/lib/caminos";
import fondo from "@/assets/fondo-mistico.png.asset.json";

export const Route = createFileRoute("/_authenticated/categorias")({
  head: () => ({
    meta: [
      { title: "Categorías ORIGEN — Una transformación por día" },
      { name: "description", content: "Elige tu tema: niño interior, glow up mujer u hombre, magnetismo o dejar de pedir permiso. Una lección diaria guiada en cada camino." },
      { property: "og:title", content: "Categorías ORIGEN — Una transformación por día" },
      { property: "og:description", content: "Mapas guiados con lección diaria, tareas, juegos y recompensas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CategoriasPage,
});

function CategoriasPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <img src={fondo.url} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-[0.18]" />
      <div className="relative z-10 mx-auto max-w-lg lg:max-w-[1100px] px-4 pt-4 pb-12">
        <header className="rounded-[16px] bg-card border border-border shadow-soft p-5">
          <div className="text-[11px] uppercase tracking-widest font-bold text-primary inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Todas las categorías
          </div>
          <h1 className="font-display font-extrabold text-[28px] leading-tight mt-2">Elige por dónde quieres empezar a transformarte</h1>
          <p className="text-[14px] text-muted-foreground mt-2">
            Cada categoría es un mapa diario: una transformación por día con lección, tareas, juegos y recompensas.
          </p>
        </header>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {CAMINOS.map((c, i) => (
            <Link
              key={c.id}
              to="/caminos/$caminoId"
              params={{ caminoId: c.id }}
              aria-label={c.title}
              style={{ animation: `fade-in .4s ease-out ${i * 70}ms both` }}
              className="block rounded-[16px] overflow-hidden shadow-soft active:scale-[.98] transition-transform"
            >
              <img src={c.banner} alt={c.title} loading="lazy" className="w-full h-auto block" />
            </Link>
          ))}


          <Link
            to="/visualiza"
            className="rounded-[16px] bg-card border border-border shadow-soft p-5 flex flex-col justify-between active:scale-[.98] transition-transform"
          >
            <div>
              <span className="w-11 h-11 rounded-[12px] bg-primary/10 text-primary grid place-items-center">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="font-display font-bold text-[17px] mt-3">Visualízalo y Vívelo</h2>
              <p className="text-[13px] text-muted-foreground mt-1">Manifestación con música, limpieza espiritual, identidad y Método de Cristo 3·6·9.</p>
            </div>
            <span className="mt-4 h-12 rounded-[12px] bg-primary/10 text-primary text-[14px] font-semibold inline-flex items-center justify-center gap-2">
              Entrar <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

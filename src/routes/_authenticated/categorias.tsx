import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Eye, Flame, Sparkles } from "lucide-react";
import { CATEGORIAS, watching } from "@/lib/categorias";
import fondo from "@/assets/fondo-mistico.png.asset.json";

export const Route = createFileRoute("/_authenticated/categorias")({
  head: () => ({
    meta: [
      { title: "Categorías del Método ORIGEN — Sana lo que se repite" },
      { name: "description", content: "Elige tu camino: niño interior, glow up, magnetismo o dejar de pedir permiso. Programas guiados de 21 días dentro de ORIGEN." },
      { property: "og:title", content: "Categorías del Método ORIGEN" },
      { property: "og:description", content: "Programas guiados de 21 días para sanar, renovar tu identidad y vivir con propósito." },
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
          <h1 className="font-display font-extrabold text-[28px] leading-tight mt-2">Elige por dónde quieres empezar a sanar</h1>
          <p className="text-[14px] text-muted-foreground mt-2">
            Cada categoría es un programa guiado de 21 días con audios, afirmaciones, ejercicios y diario.
          </p>
        </header>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {CATEGORIAS.map((c, i) => {
            const w = watching(c);
            return (
              <Link
                key={c.id}
                to="/programas/$programaId"
                params={{ programaId: c.programaId }}
                style={{ animation: `fade-in .4s ease-out ${i * 70}ms both` }}
                className="block rounded-[16px] overflow-hidden bg-card border border-border shadow-soft active:scale-[.98] transition-transform"
              >
                <div className="relative">
                  <img src={c.banner} alt={c.title} loading="lazy" className="w-full h-auto block" />
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-[#1B1930]/75 backdrop-blur px-2.5 py-1 text-[11px] font-bold text-white">
                    <Flame className="w-3.5 h-3.5 text-[#F7B955]" /> {w.now} viendo ahora
                  </span>
                </div>
                <div className="p-4">
                  <h2 className="font-display font-bold text-[17px] leading-tight">{c.title}</h2>
                  <p className="text-[12.5px] text-muted-foreground mt-1 inline-flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 shrink-0" /> {w.total.toLocaleString()} personas {c.hook}
                  </p>
                  <span className="mt-3 h-12 rounded-[12px] btn-primary-gradient text-white text-[14px] font-semibold inline-flex w-full items-center justify-center gap-2">
                    Comenzar ahora <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            );
          })}

          {/* Pilares que ya existen dentro de la app */}
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

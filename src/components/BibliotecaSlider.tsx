import coverFallback from "@/assets/e3d-book.png";
import { Link } from "@tanstack/react-router";
import { EBOOKS } from "@/lib/biblioteca";
import { BookOpen, ChevronLeft, ChevronRight, Library } from "lucide-react";
import { useRef } from "react";

/**
 * Slider horizontal de portadas de la Biblioteca Digital + CTA morado.
 */
export function BibliotecaSlider() {
  const ref = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: number) => {
    ref.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  };

  return (
    <section aria-labelledby="biblioteca-home">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 mb-2">
        <h3 id="biblioteca-home" className="font-display font-bold text-[15px] truncate">
          Biblioteca Digital
        </h3>
        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-bold text-primary">
          <Library className="w-3.5 h-3.5" /> {EBOOKS.length} libros
        </span>
      </div>
      <div className="hairline-brand mb-3" />
      <p className="text-[13px] text-muted-foreground mb-3">
        Lecturas que acompañan tu proceso. Desliza para ver más.
      </p>

      <div
        ref={ref}
        className="-mx-4 px-4 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {EBOOKS.slice(0, 14).map((b, i) => (
          <Link
            key={b.id}
            to="/biblioteca"
            className="snap-start shrink-0 w-[152px] rounded-[16px] overflow-hidden bg-card border border-border/60 shadow-soft active:scale-[.97] transition-transform"
            style={{ animation: `fade-in .35s ease-out ${i * 45}ms both` }}
          >
            <img
              src={b.cover}
              alt={`Portada de ${b.title}`}
              loading="lazy"
              className="w-full aspect-[3/4] object-cover bg-secondary"
              onError={(e) => {
                const el = e.currentTarget;
                if (el.dataset["fallback"]) return;
                el.dataset["fallback"] = "1";
                el.src = coverFallback;
              }}
            />
          </Link>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Ver libros anteriores"
          className="w-11 h-11 rounded-full bg-card border border-border grid place-items-center text-foreground active:scale-95 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground font-semibold">
          Desliza para ver más
        </span>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Ver más libros"
          className="w-11 h-11 rounded-full bg-card border border-border grid place-items-center text-foreground active:scale-95 transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <Link
        to="/biblioteca"
        className="mt-4 flex h-[54px] w-full items-center justify-center gap-2 rounded-[12px] bg-primary text-primary-foreground font-display font-extrabold text-[15px] tracking-wide uppercase shadow-[0_4px_14px_hsl(var(--primary)/0.3)] active:scale-[.98] transition-transform"
      >
        <BookOpen className="w-5 h-5" /> Acceder a la Biblioteca Digital
      </Link>
    </section>
  );
}

import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight } from "lucide-react";
import { getPalabraHoy } from "@/lib/palabra365";

export function PalabrasHoy({ name }: { name?: string }) {
  const palabra = getPalabraHoy();
  const preview = palabra.reflection.split(". ").slice(0, 2).join(". ").trim();
  const previewText = preview.endsWith(".") ? preview : `${preview}.`;

  return (
    <section className="app-card p-5 bg-brand-soft relative overflow-hidden">
      <div className="absolute -right-6 -top-6 text-7xl opacity-10">✨</div>
      <div className="relative">
        <div className="text-[11px] uppercase tracking-widest font-bold text-primary flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Palabras para ti hoy
        </div>
        <h3 className="font-display font-bold text-[17px] mt-2 leading-snug">
          {name ? `${name}, ` : ""}
          {palabra.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-foreground/85 line-clamp-4">{previewText}</p>
        <p className="mt-1 text-[11px] text-muted-foreground italic">{palabra.passage.reference}</p>
        <Link
          to="/palabra"
          className="btn-primary-gradient mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm"
        >
          Ver Completo <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

export default PalabrasHoy;
